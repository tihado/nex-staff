# Kiến trúc kỹ thuật — Nex Staff

## Tổng quan

Nex Staff build trực tiếp trên **AI SDK 7** — không dùng Eve, không dùng Cursor SDK. Hai lớp agent runtime:

1. **Assistant** (`ToolLoopAgent`) — sync, streaming, conversational
2. **Staff** (`DurableAgent` + Vercel Workflow) — async, background, durable

## Tech Stack

| Layer             | Technology                                            |
| ----------------- | ----------------------------------------------------- |
| Frontend          | Next.js 16 App Router, React 19, Tailwind CSS v4      |
| Agent framework   | AI SDK 7 (`ai`, `@ai-sdk/react`)                      |
| Assistant runtime | `ToolLoopAgent` + `streamText`                        |
| Staff runtime     | `DurableAgent` (`@workflow/ai`) trong Vercel Workflow |
| Sandbox           | `@ai-sdk/sandbox-vercel` — `createVercelSandbox()`    |
| Durability        | Vercel Workflow (`workflow`, `@ai-sdk/workflow`)      |
| Model provider    | Vercel AI Gateway (multi-provider)                    |
| Database          | Neon Postgres + Drizzle ORM + pgvector                |
| Auth              | Better Auth (Google OAuth)                            |
| File storage      | Vercel Blob                                           |

> **Tạm hoãn (out of scope MVP):** Rate limiting / Upstash Redis — sẽ thêm sau khi có usage data thực tế.

## Kiến trúc tổng thể

```mermaid
flowchart TB
    subgraph client [Client]
        Workspace[Workspace Floor]
        DialogueOverlay[Dialogue Overlay]
        ArchiveRoom[Archive Room]
    end

    subgraph nextjs [Next.js App]
        API[API Routes]
        AssistantAgent[ToolLoopAgent]
        HireService[Hire Service]
        WorkflowAPI[workflow/api start]
    end

    subgraph storage [Storage]
        PG[(Postgres + pgvector)]
        Blob[Document Blob Store]
    end

    subgraph workflowLayer [Vercel Workflow]
        StaffWorkflow[staffTaskWorkflow]
        DurableAgent[DurableAgent]
    end

    subgraph sandboxLayer [Vercel Sandbox]
        SandboxSession[SandboxSession per task]
    end

    Workspace --> API
    DialogueOverlay --> API
    API --> AssistantAgent
    AssistantAgent --> PG
    AssistantAgent --> HireService
    AssistantAgent --> WorkflowAPI
    HireService --> PG
    WorkflowAPI --> StaffWorkflow
    StaffWorkflow --> DurableAgent
    DurableAgent --> SandboxSession
    DurableAgent --> PG
    AssistantAgent --> Blob
```

## Agent Runtime Layers

### Lớp 1 — Assistant (sync, streaming)

`ToolLoopAgent` xử lý mọi tương tác real-time với user.

**Responsibilities:**

- Chat streaming qua `assistant.stream({ messages })` → `useChat` client
- Tools: hire, delegate, RAG, web research, list staff, check status
- Không block khi delegate — fire-and-forget qua `start(staffTaskWorkflow)`

**Implementation pattern:**

```typescript
// lib/agents/assistant.ts
import { ToolLoopAgent } from "ai";
import { gateway } from "@ai-sdk/gateway";

export function createAssistant(userId: string) {
  return new ToolLoopAgent({
    model: gateway("google/gemini-3-flash"),
    instructions: loadAssistantInstructions(userId),
    tools: {
      hire_staff: hireStaffTool,
      delegate_task: delegateTaskTool,
      search_documents: searchDocumentsTool,
      web_research: webResearchTool,
      list_staff: listStaffTool,
      check_task_status: checkTaskStatusTool,
      list_active_tasks: listActiveTasksTool,
      get_task_events: getTaskEventsTool,
      get_task_preview: getTaskPreviewTool,
      get_deliverable: getDeliverableTool,
    },
  });
}
```

**API route:**

```typescript
// app/api/chat/route.ts
export async function POST(req: Request) {
  const { messages } = await req.json();
  const user = await getServerViewer();
  const assistant = createAssistant(user.id);

  return assistant.stream({ messages });
}
```

### Lớp 2 — Staff (async, durable)

Mỗi delegated task = một Vercel Workflow run chứa `DurableAgent`.

**Responsibilities:**

- Execute task brief với staff-specific instructions, skills, tools
- **Report progress** qua `reportProgress` sau mỗi workflow/agent step
- Append draft text vào `task_preview` khi agent stream
- Save deliverable; enqueue `notification` + SSE khi xong

**Implementation pattern:**

```typescript
// lib/workflows/staff-task.ts
import { DurableAgent } from "@workflow/ai/agent";
import { createVercelSandbox } from "@ai-sdk/sandbox-vercel";

export async function staffTaskWorkflow(taskId: string) {
  "use workflow";

  const task = await loadTask(taskId);
  const staff = await loadStaff(task.staffId);

  let sandbox = null;
  if (staff.useSandbox) {
    sandbox = await createStaffSandbox(staff, task);
  }

  const agent = new DurableAgent({
    model: staff.model ?? "google/gemini-3-flash",
    system: staff.instructions,
    tools: buildStaffTools(staff, sandbox),
    skills: staff.skills,
  });

  const result = await agent.stream({
    messages: [{ role: "user", content: task.brief }],
    maxSteps: 20,
    onStepFinish: async ({ step, toolCalls, text }) => {
      await reportProgress(taskId, {
        type: "agent.step_completed",
        label: summarizeStep(toolCalls, text),
        progressPercent: Math.round((step / 20) * 90),
      });
      if (text) await appendTaskPreview(taskId, text);
    },
  });

  const deliverableId = await saveDeliverable(taskId, result);
  await reportProgress(taskId, {
    type: "workflow.completed",
    progressPercent: 100,
    payload: { deliverableId },
  });
  await enqueueNotification(taskId, "task.completed");
}

async function loadTask(taskId: string) {
  "use step";
  return db.query.tasks.findFirst({ where: eq(tasks.id, taskId) });
}

async function createStaffSandbox(staff: Staff, task: Task) {
  "use step";
  const sandbox = await createVercelSandbox({ runtime: "node24" });
  // Seed linked documents from Blob into sandbox workspace
  await seedDocuments(sandbox, staff.documents);
  return sandbox;
}
```

**Delegate tool (fire-and-forget):**

```typescript
// lib/tools/delegate-task.ts
import { start } from "workflow/api";
import { tool } from "ai";
import { z } from "zod";

export const delegateTaskTool = tool({
  description: "Giao việc cho staff agent. Staff sẽ làm việc nền.",
  inputSchema: z.object({
    staffId: z.string(),
    brief: z.string(),
  }),
  execute: async ({ staffId, brief }, { experimental_context }) => {
    const { userId, chatId } = experimental_context as ToolContext;

    const [task] = await db
      .insert(tasks)
      .values({
        staffId,
        brief,
        chatId,
        userId,
        status: "pending",
      })
      .returning();

    const run = await start(staffTaskWorkflow, [task.id]);

    await db
      .update(tasks)
      .set({
        workflowRunId: run.runId,
        status: "running",
        startedAt: new Date(),
      })
      .where(eq(tasks.id, task.id));

    const staff = await db.query.staff.findFirst({
      where: eq(staff.id, staffId),
    });

    return {
      taskId: task.id,
      staffName: staff?.name,
      message: `Đã giao việc cho ${staff?.name}. Bạn có thể tiếp tục chat.`,
    };
  },
});
```

## Luồng dữ liệu chính

```mermaid
sequenceDiagram
    participant U as User
    participant A as Assistant
    participant DB as Database
    participant W as VercelWorkflow
    participant S as DurableAgent
    participant SB as VercelSandbox

    U->>A: "Viết bài blog về AI agents"
    A->>DB: Tìm staff phù hợp
    alt Có Content Writer
        A->>W: start(staffTaskWorkflow)
        A->>U: "Đã giao cho Alex. Bạn có thể tiếp tục chat."
        W->>SB: createVercelSandbox nếu cần
        W->>S: DurableAgent.stream(brief)
    else Chưa có
        A->>U: "Bạn cần hire Content Writer không?"
        U->>A: "Có, tone casual"
        A->>DB: hire_staff(profile)
        A->>W: start(staffTaskWorkflow)
    end
    S-->>W: result
    W->>DB: Lưu deliverable
    W->>U: SSE notification
```

## Cấu trúc thư mục (đề xuất)

```
nex-staff/
├── app/
│   ├── api/
│   │   ├── chat/route.ts          # Assistant streaming
│   │   ├── chats/                 # Chat CRUD
│   │   ├── staff/                 # Staff management
│   │   ├── tasks/                 # Task management
│   │   ├── documents/             # Document upload/RAG
│   │   ├── notifications/         # SSE notifications
│   │   └── workflows/[runId]/     # Workflow status poll
│   ├── (chat)/
│   │   └── page.tsx               # Main chat UI
│   └── layout.tsx
├── components/
│   ├── workspace/                 # WorkspaceFloor, Desk, Player, Archive...
│   ├── dialogue/                  # DialogueBox, ChoiceMenu, Portrait...
│   ├── staff/                     # StaffCard, StaffRoster...
│   └── ui/                        # shadcn + pixel overrides
├── lib/
│   ├── agents/
│   │   ├── assistant.ts           # ToolLoopAgent factory
│   │   └── staff-tools.ts         # Staff tool builders
│   ├── workflows/
│   │   └── staff-task.ts          # staffTaskWorkflow
│   ├── tools/                     # Assistant tool definitions
│   ├── db/
│   │   ├── schema.ts
│   │   └── index.ts
│   └── auth.ts
└── docs/
```

## Patterns từ co-agent (reference only)

Tái sử dụng **patterns**, không import Eve:

| Pattern                      | Nex Staff implementation                          |
| ---------------------------- | ------------------------------------------------- |
| Event-sourced chat           | `chat` + `chat_event` tables                      |
| DB-stored agent profiles     | `staff` table với instructions/skills/tools JSON  |
| Better Auth + Drizzle + Neon | Giữ nguyên stack                                  |
| Dynamic per-turn config      | Load staff profile từ DB khi build `DurableAgent` |

**Khác biệt:**

| co-agent                    | Nex Staff                   |
| --------------------------- | --------------------------- |
| Global `dynamic_agents`     | Per-user `staff` table      |
| Eve `call_agent` delegation | `start(staffTaskWorkflow)`  |
| Eve sandbox                 | Vercel Sandbox              |
| `useEveAgent`               | `useChat` + `ToolLoopAgent` |

## Sandbox Strategy

| Staff type     | `useSandbox` | Lý do                                     |
| -------------- | ------------ | ----------------------------------------- |
| Content Writer | `false`      | Text generation, RAG — không cần file ops |
| Researcher     | `false`      | Web search + summarize                    |
| Data Analyst   | `true`       | Cần chạy scripts, xử lý CSV               |
| Code Reviewer  | `true`       | File read/write trong workspace           |

Khi `useSandbox: true`:

1. `createVercelSandbox({ runtime: "node24" })` per task
2. Seed linked documents từ Blob vào sandbox
3. Expose `run_command`, `read_file`, `write_file` tools wrapping `SandboxSession`
4. Destroy sandbox sau task complete

## Quyết định kiến trúc

1. **AI SDK thuần** — `ToolLoopAgent` (sync) + `DurableAgent` (async), cùng ecosystem
2. **Vercel Sandbox per-task** — isolated execution; text-only staff skip sandbox
3. **Vercel Workflow** — `start()` fire-and-forget, survive deploys/restarts
4. **NPC dialogue UX** — RPG dialogue box thay chat bubbles; `useChat` ở data layer
5. **Per-user isolation** — staff, documents, sandbox scoped by `userId`

## Tài liệu liên quan

- [AGENT-SYSTEM.md](AGENT-SYSTEM.md) — Hiring, delegation logic
- [DATA-MODEL.md](DATA-MODEL.md) — Database schema
- [API.md](API.md) — REST endpoints
