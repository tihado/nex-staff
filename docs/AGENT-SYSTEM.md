# Hệ thống Agent — Nex Staff

## Agent Types

| Type          | Role                    | Runtime                           | Persistent                         |
| ------------- | ----------------------- | --------------------------------- | ---------------------------------- |
| **Assistant** | Coordinator, gatekeeper | `ToolLoopAgent` (sync, streaming) | 1 per user, auto-created on signup |
| **Staff**     | Specialist worker       | `DurableAgent` + Workflow (async) | N per user, hired on demand        |

### Assistant

- Cửa ngõ duy nhất giữa user và hệ thống
- Biết toàn bộ staff roster, documents, task history
- Quyết định: tự xử lý, delegate, hoặc đề xuất hire
- Không thực hiện công việc nặng — delegate cho Staff

### Staff

- Chuyên gia theo role (Writer, Researcher, Analyst...)
- Làm việc async trong background workflow
- Có instructions, skills, tools, document access riêng
- Một staff có thể nhận nhiều tasks (queue khi đang busy)

---

## Hiring Flow

```mermaid
stateDiagram-v2
    [*] --> DetectNeed: User describes need
    DetectNeed --> ProposeHire: No matching staff
    DetectNeed --> Delegate: Matching staff exists
    ProposeHire --> GatherRequirements: User agrees
    GatherRequirements --> ConfigureProfile: Enough info
    GatherRequirements --> GatherRequirements: Need more info
    ConfigureProfile --> CreateStaff: Save to DB
    CreateStaff --> Delegate: Task pending
    CreateStaff --> Idle: Staff ready
    Delegate --> Working: Task queued
    Working --> Delivered: Run finished
    Delivered --> Idle: Ready for next task
    Idle --> Delegate: New task assigned
```

### Chi tiết từng bước

**1. DetectNeed**

- User mô tả nhu cầu: "tôi cần viết blog", "research thị trường X"
- Assistant phân loại intent: `write`, `research`, `analyze`, `code`, `marketing`

**2. ProposeHire** (khi không có staff phù hợp)

- Assistant đề xuất role cụ thể: "Bạn cần hire Content Writer không?"
- Giải thích ngắn staff sẽ làm gì

**3. GatherRequirements**

- Assistant hỏi qua chat (không form):
  - Tone/style (casual, formal, technical)
  - Target audience
  - Tài liệu tham khảo cần link
  - Constraints đặc biệt

**4. ConfigureProfile**

- Assistant map requirements → staff profile
- Chọn preset template hoặc custom
- Set `useSandbox` based on role

**5. CreateStaff**

- `hire_staff` tool lưu vào DB
- Assign 8-bit avatar sprite
- Notify user: "Alex (Content Writer) đã join team!"

**6. Delegate** (nếu có task pending)

- Ngay sau hire, delegate task ban đầu nếu user đã mô tả

---

## Staff Profile

```typescript
interface StaffProfile {
  id: string;
  userId: string;
  name: string; // "Alex" — tên hiển thị
  role: string; // "Content Writer"
  avatar: string; // 8-bit sprite ID
  model?: string; // Override model, default gateway default
  instructions: string; // System prompt / job description
  skills: Skill[]; // AI SDK skills (markdown)
  tools: ToolDef[]; // Tool definitions (JSON schema)
  useSandbox: boolean; // true = Vercel Sandbox per task
  documents: string[]; // Linked document IDs
  status: "idle" | "working" | "offline";
  hiredAt: Date;
}

interface Skill {
  name: string;
  description: string;
  content: string; // Markdown skill content
}

interface ToolDef {
  name: string;
  description: string;
  inputSchema: object; // JSON Schema
  handler: "http" | "rag" | "sandbox_bash" | "sandbox_file";
  config?: object; // Handler-specific config
}
```

### Preset Templates

| Template     | Role                 | useSandbox | Default Skills                        |
| ------------ | -------------------- | ---------- | ------------------------------------- |
| `writer`     | Content Writer       | **true** (MVP) | Blog writing, file draft, tone adaptation |
| `researcher` | Researcher           | false      | Web research, summarization, citation |
| `analyst`    | Data Analyst         | true       | CSV analysis, chart generation        |
| `reviewer`   | Code Reviewer        | true       | Code review, security check           |
| `social`     | Social Media Manager | false      | Post drafting, hashtag research       |

> **MVP:** Chỉ ship template `writer` với `useSandbox: true` — seed docs từ Archive, ghi deliverable trong sandbox.

---

## Delegation Logic

Assistant quyết định delegate theo thứ tự:

```mermaid
flowchart TD
    A[User request] --> B{Intent classification}
    B --> C{Matching staff?}
    C -->|Yes| D{Staff available?}
    C -->|No| E[Propose hire]
    D -->|Idle| F[delegate_task]
    D -->|Working| G[Queue or suggest wait]
    E --> H[Gather requirements]
    H --> I[hire_staff]
    I --> F
    F --> J[Return confirmation]
```

### 1. Intent Classification

Phân loại yêu cầu user:

| Intent      | Keywords / signals             | Preferred role       |
| ----------- | ------------------------------ | -------------------- |
| `write`     | viết, blog, content, bài       | Content Writer       |
| `research`  | research, tìm hiểu, thị trường | Researcher           |
| `analyze`   | phân tích, data, số liệu       | Data Analyst         |
| `code`      | code, review, bug, PR          | Code Reviewer        |
| `marketing` | social, post, campaign         | Social Media Manager |

### 2. Staff Matching

So khớp `staff.role` + `staff.skills` với intent:

- Exact role match → highest priority
- Skill overlap → secondary
- Generalist staff (nếu có) → fallback

### 3. Availability

| Status    | Behavior                                    |
| --------- | ------------------------------------------- |
| `idle`    | Delegate immediately                        |
| `working` | Queue task hoặc hỏi user có muốn chờ        |
| `offline` | Không delegate; thông báo staff unavailable |

### 4. Fallback

Không match → đề xuất hire với role phù hợp nhất.

---

## Supervision & Multi-worker Control

Assistant không chỉ **delegate** mà còn **giám sát** worker: kiểm tra checkpoint, đánh giá deliverable, và điều phối nhiều worker song song.

### Hub-and-spoke (đã có)

| Thành phần | Chức năng |
|------------|-----------|
| 1 Assistant per user | Coordinator duy nhất — user không nói trực tiếp với worker |
| N Staff per user | Specialist workers chạy async trong workflow riêng |
| `delegate_task` | Fire-and-forget — nhiều staff chạy **song song** |
| `list_active_tasks` | Assistant thấy tất cả task đang chạy cùng lúc |
| `list_staff` | Roster + status idle/working |
| Notification queue | Assistant biết task xong để báo user |
| Retry policy (max 3) | Xử lý worker fail |

### Task queue semantics

Khi staff đang `working`, task mới được **queue** thay vì reject.

| Rule | Giá trị |
|------|---------|
| Queue order | **FIFO** per staff |
| Concurrency per staff | **1 running** + tối đa **3 pending** (default) |
| Cross-staff parallelism | **Unlimited** (bounded bởi Vercel Workflow concurrency) |
| Queue full | Assistant thông báo user; đề xuất staff khác hoặc chờ |

Assistant tool **`list_queued_tasks`** — backlog per staff (pending tasks chưa start workflow).

### Supervisor Loop

Assistant verify worker **trong suốt task lifecycle**, không chỉ khi complete:

```mermaid
sequenceDiagram
    participant A as Assistant
    participant W as Staff Workflow
    participant DB as task_event

    A->>A: delegate_task + checkpoints + acceptance_criteria
    W->>DB: checkpoint.reached / reportProgress
    A->>DB: check_task_status / verify_checkpoint
    alt checkpoint failed
        A->>A: revise_task hoặc re-delegate
    end
    W->>DB: workflow.completed
    A->>A: review_deliverable
    alt quality below threshold
        A->>W: request_revision via revise_task
    end
```

**Khi delegate**, Assistant (hoặc pre-processing) set:

- `metadata.acceptanceCriteria` — rubric ngắn để `review_deliverable` chấm output
- `checkpoints[]` — milestones planned (xem § Task Checkpoints)

**Assistant tools giám sát:**

| Tool | Mục đích |
|------|----------|
| `verify_checkpoint` | So checkpoint status vs plan; trả pass/fail + evidence |
| `review_deliverable` | LLM chấm deliverable vs `acceptanceCriteria` |
| `revise_task` | Gửi feedback cho worker (workflow signal) hoặc spawn task mới |
| `list_queued_tasks` | Xem backlog pending per staff |

Chi tiết tool schemas: [API.md](API.md).

### Multi-task orchestration

Khi một user request cần **nhiều worker**:

1. Assistant **decompose** brief → tạo `task_group` (`metadata.parentGroupId`)
2. Delegate parallel (ví dụ Researcher + Writer) hoặc sequential với dependency
3. Task phụ thuộc: `metadata.dependsOn: [taskId]` — workflow chỉ start khi dependency `completed` **và** Assistant `verify_checkpoint` pass
4. Assistant dùng `list_active_tasks` + filter `parentGroupId` để báo cáo tổng thể cho user

Ví dụ: "Research thị trường X rồi viết blog"

```
Group: blog-about-market-X
├── Task 1: Researcher — research + citations     (no deps)
└── Task 2: Writer — viết blog                      (dependsOn: Task 1)
```

Assistant behavior:
- Start Task 1 ngay
- Poll Task 1 checkpoints; khi research verified → start Task 2
- Báo user progress theo group: "Research 100%, Writer đang draft 30%"

### Assistant behavior — supervision

```markdown
When delegating multi-step work:
- Decompose into task_group with explicit dependencies
- Set acceptanceCriteria on each task brief
- Define checkpoints before starting workflow

While tasks run:
- Periodically check list_active_tasks (especially on user message)
- verify_checkpoint when worker reports checkpoint.reached
- If checkpoint failed, use revise_task with specific feedback

When task completes:
- Always run review_deliverable before notifying user
- If score below threshold, offer revision (revise_task) before presenting to user
```

---

## Skills & Tools Model

### Skills

Skills là markdown documents mô tả domain knowledge và workflow.

**Inline trong DurableAgent:**

```typescript
const agent = new DurableAgent({
  system: staff.instructions,
  skills: [
    {
      name: "blog-writing",
      description: "Write SEO-optimized blog posts",
      content: readFileSync("./templates/skills/blog-writing.md", "utf-8"),
    },
  ],
});
```

**Provider upload (optional, Phase 2+):**

```typescript
const { providerReference } = await uploadSkill({
  api: anthropic.skills(),
  files: [{ path: "SKILL.md", content: skillMarkdown }],
  displayTitle: "Blog Writing",
});
```

### Tools

**Assistant tools** (platform-level, code-defined):

| Tool                | Scope                |
| ------------------- | -------------------- |
| `hire_staff`        | Create staff in DB   |
| `delegate_task`     | Start workflow       |
| `search_documents`  | RAG across user docs |
| `web_research`      | Internet search      |
| `list_staff`        | Roster query                                       |
| `check_task_status` | Trạng thái + tiến độ + kết quả tạm của một task   |
| `list_active_tasks` | Tasks đang chạy + vừa xong chưa thông báo        |
| `get_task_events`   | Nhật ký chi tiết từng bước                         |
| `get_task_preview`  | Draft output tạm thời                              |
| `get_deliverable`   | Fetch result                                       |
| `verify_checkpoint` | Verify planned checkpoint vs evidence              |
| `review_deliverable`| Chấm deliverable vs acceptanceCriteria             |
| `revise_task`       | Gửi feedback / spawn revision task                 |
| `list_queued_tasks` | Pending backlog per staff                          |

**Staff tools** (per-staff, from DB + sandbox):

| Handler        | Mô tả                  | Requires sandbox |
| -------------- | ---------------------- | ---------------- |
| `rag`          | Query linked documents | No               |
| `http`         | Templated HTTP call    | No               |
| `sandbox_bash` | Run shell command      | Yes              |
| `sandbox_file` | Read/write file        | Yes              |

**Sandbox tool example:**

```typescript
function buildSandboxTools(sandbox: SandboxSession) {
  return {
    run_command: tool({
      description: "Run a shell command in the workspace",
      inputSchema: z.object({ command: z.string() }),
      execute: async ({ command }) => {
        const result = await sandbox.runCommand(command);
        return { stdout: result.stdout, stderr: result.stderr };
      },
    }),
    read_file: tool({
      description: "Read a file from the workspace",
      inputSchema: z.object({ path: z.string() }),
      execute: async ({ path }) => {
        return await sandbox.readFile(path);
      },
    }),
    write_file: tool({
      description: "Write content to a file",
      inputSchema: z.object({ path: z.string(), content: z.string() }),
      execute: async ({ path, content }) => {
        await sandbox.writeFile(path, content);
        return { success: true };
      },
    }),
  };
}
```

### Documents (RAG)

User documents → chunked → embedded → pgvector.

Staff access documents qua:

1. `documents` array trong staff profile (linked doc IDs)
2. `search_documents` tool trong staff toolset (scoped to linked docs)

---

## Task Observability — Theo dõi tiến độ & thông báo

Sau khi `delegate_task`, Assistant **không block** nhưng vẫn có thể (và nên) biết staff đang làm đến đâu, trạng thái hiện tại, kết quả tạm, và **khi nào xong** để thông báo user.

### Vấn đề cần giải quyết

| Nhu cầu | Ai cần | Cách đáp ứng |
|---------|--------|--------------|
| Task đang chạy hay đã xong? | Assistant + User | `task.status` + SSE |
| Đang ở bước nào? | Assistant + User | `task_event` log + `currentStep` |
| Có kết quả tạm chưa? | Assistant + User | `task_preview` + events `agent.text_delta` |
| Khi nào xong để báo user? | Assistant | `notification` queue + SSE `task.completed` |
| User hỏi "Alex làm đến đâu?" | Assistant | Tool `check_task_status` / `get_task_events` |

### Kiến trúc tổng quan

```mermaid
flowchart TB
    subgraph workflow [staffTaskWorkflow]
        Agent[DurableAgent]
        Report[reportProgress step]
    end

    subgraph storage [Storage]
        Task[(task)]
        Events[(task_event)]
        Preview[(task_preview)]
        Notif[(notification)]
    end

    subgraph consumers [Consumers]
        SSE[SSE to UI]
        Assistant[Assistant tools]
        Workspace[Task Board / Desk state]
    end

    Agent -->|mỗi bước| Report
    Report --> Events
    Report --> Task
    Report --> Preview
    Report --> SSE
    Agent -->|hoàn thành| Notif
    Notif --> Assistant
    Notif --> SSE
    Events --> Assistant
    Task --> Workspace
```

### Task Event Log (`task_event`)

Append-only log — mỗi bước trong workflow/agent ghi một event.

| Event type | Khi nào | Payload ví dụ |
|------------|---------|---------------|
| `workflow.started` | Workflow bắt đầu | `{ workflowRunId }` |
| `sandbox.created` | Sandbox spin-up xong | `{ durationMs }` |
| `agent.step_started` | DurableAgent bắt đầu step N | `{ step, maxSteps, label }` |
| `agent.tool_called` | Staff gọi tool | `{ toolName, inputSummary }` |
| `agent.tool_result` | Tool trả về | `{ toolName, resultSummary }` |
| `agent.text_delta` | Có text output tạm | `{ chunk }` — append vào preview |
| `agent.step_completed` | Step kết thúc | `{ step, durationMs }` |
| `checkpoint.reached` | Worker báo đạt milestone | `{ checkpointId, label, evidence }` |
| `checkpoint.verified` | Assistant verify pass | `{ checkpointId, score, reasoning }` |
| `checkpoint.failed` | Worker hoặc verify fail | `{ checkpointId, reason }` |
| `worker.query_response` | Phase 2: trả lời query_worker | `{ question, answer }` |
| `deliverable.saved` | Lưu kết quả cuối | `{ deliverableId, title }` |
| `workflow.completed` | Thành công | `{ deliverableId }` |
| `workflow.failed` | Lỗi | `{ error, step }` |

```typescript
interface TaskEvent {
  id: string;
  taskId: string;
  type: TaskEventType;
  payload: Record<string, unknown>;
  createdAt: Date;
}
```

### Progress trên `task` (denormalized)

Cập nhật mỗi khi có event quan trọng — Assistant đọc nhanh không cần scan toàn bộ events.

```typescript
interface TaskProgress {
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  progressPercent: number;      // 0-100, ước lượng từ step/maxSteps
  currentStep: string;          // "Đang research trên web..."
  lastEventAt: Date;
  lastEventType: TaskEventType;
  workflowRunId: string;
}
```

**Công thức `progressPercent`:** `Math.round((currentStep / maxSteps) * 100)` — cap 95% cho đến khi `workflow.completed`.

### Workflow — ghi progress

```typescript
// lib/workflows/staff-task.ts
export async function staffTaskWorkflow(taskId: string) {
  "use workflow";

  await reportProgress(taskId, {
    type: "workflow.started",
    label: "Bắt đầu công việc",
    progressPercent: 0,
  });

  const task = await loadTask(taskId);
  const staff = await loadStaff(task.staffId);

  if (staff.useSandbox) {
    await reportProgress(taskId, { type: "sandbox.creating", label: "Chuẩn bị workspace..." });
    const sandbox = await createStaffSandbox(staff, task);
    await reportProgress(taskId, { type: "sandbox.created", label: "Workspace sẵn sàng" });
  }

  const agent = new DurableAgent({ /* ... */ });

  const result = await agent.stream({
    messages: [{ role: "user", content: task.brief }],
    maxSteps: 20,
    onStepFinish: async ({ step, toolCalls, text }) => {
      await reportProgress(taskId, {
        type: "agent.step_completed",
        label: summarizeStep(toolCalls, text),
        progressPercent: Math.round((step / 20) * 90),
        payload: { step, toolNames: toolCalls?.map(t => t.toolName) },
      });
      if (text) await appendTaskPreview(taskId, text);
    },
  });

  const deliverableId = await saveDeliverable(taskId, result);
  await reportProgress(taskId, {
    type: "workflow.completed",
    label: "Hoàn thành",
    progressPercent: 100,
    payload: { deliverableId },
  });

  await enqueueNotification(taskId, "task.completed");
}

async function reportProgress(taskId: string, event: ProgressInput) {
  "use step";
  await db.insert(taskEvents).values({ taskId, type: event.type, payload: event });
  await db.update(tasks).set({
    currentStep: event.label,
    progressPercent: event.progressPercent,
    lastEventAt: new Date(),
    lastEventType: event.type,
    status: event.type === "workflow.completed" ? "completed"
          : event.type === "workflow.failed" ? "failed"
          : "running",
  }).where(eq(tasks.id, taskId));
  await publishTaskSSE(taskId, event);
}
```

### Assistant Tools — observability

#### `check_task_status`

Trả về snapshot đầy đủ cho Assistant trả lời user.

```typescript
// Response example
{
  taskId: "uuid",
  staffName: "Alex",
  staffRole: "Content Writer",
  status: "running",
  progressPercent: 45,
  currentStep: "Đang viết phần mở đầu...",
  startedAt: "2026-07-04T10:05:00Z",
  lastEventAt: "2026-07-04T10:08:30Z",
  recentEvents: [
    { type: "agent.tool_called", label: "web_research", at: "..." },
    { type: "agent.step_completed", label: "Research xong", at: "..." },
  ],
  hasPreview: true,
  previewExcerpt: "AI agents are transforming how solo founders..."
}
```

#### `list_active_tasks`

Tất cả tasks chưa terminal (`pending`, `running`) + tasks `completed` trong 1h chưa notify.

```typescript
{
  active: [
    { taskId, staffName, status, progressPercent, currentStep },
  ],
  recentlyCompleted: [
    { taskId, staffName, deliverableId, completedAt },
  ],
}
```

Assistant dùng khi user hỏi chung: "Mọi người đang làm gì?"

#### `get_task_events`

Full event log (paginated) — khi user muốn chi tiết.

#### `get_task_preview`

Draft output tạm thời — staff đã generate text nhưng chưa finalize deliverable.

### Notification — Assistant biết khi task xong

Hai kênh song song: **push cho UI** và **queue cho Assistant**.

```mermaid
sequenceDiagram
    participant W as Workflow
    participant DB as Database
    participant SSE as SSE
    participant UI as Workspace UI
    participant A as Assistant

    W->>DB: task.status = completed
    W->>DB: insert notification (pending)
    W->>SSE: task.completed
    SSE->>UI: Desk ! emote + Task Board update

    Note over A: Khi user mở dialogue hoặc hỏi
    A->>DB: list_active_tasks / check pending notifications
    A->>UI: Cutscene dialogue "Alex đã xong!"
```

**`notification` table:**

```typescript
interface Notification {
  id: string;
  userId: string;
  type: "task.completed" | "task.failed" | "staff.hired";
  taskId?: string;
  payload: Record<string, unknown>;
  status: "pending" | "delivered";  // delivered = Assistant đã báo user
  createdAt: Date;
  deliveredAt?: Date;
}
```

**Luồng thông báo user:**

1. Workflow xong → `notification` status `pending` + SSE `task.completed`
2. **Workspace UI** ngay lập tức: desk `done` state, `!` emote, Task Board cập nhật
3. **Assistant proactive** (một trong hai):
   - **Option A (MVP):** Khi user click Reception hoặc gửi message tiếp, Assistant gọi `list_active_tasks`, thấy `recentlyCompleted` chưa `delivered` → cutscene dialogue
   - **Option B (Phase 2):** SSE trigger dialogue overlay tự động nếu user đang trong app
4. Sau khi Assistant thông báo → `notification.status = delivered`

### Assistant behavior guidelines

```markdown
When a task is running:
- If user asks about progress, use check_task_status or list_active_tasks
- Summarize in plain language: "Alex đang viết phần mở đầu, khoảng 45% xong"
- Offer to show preview if hasPreview is true

When a task completes (pending notification):
- Proactively mention it at the start of the next interaction
- Trigger cutscene-style announcement with [Xem kết quả] choice
- Mark notification as delivered after informing user

Never block waiting for tasks — always use tools to check current state.
```

### UI reflection

| UI element | Data source |
|------------|-------------|
| Desk `working` animation | `task.status === running` |
| Desk `done` + `!` emote | `task.status === completed` + notification pending |
| Task Board sticky note progress | `progressPercent`, `currentStep` |
| Task Board note preview text | `task_preview` excerpt |

### Polling vs Push

| Layer | Mechanism |
|-------|-----------|
| Workspace UI | SSE `task.progress`, `task.completed` — real-time |
| Assistant | Tools on-demand; `list_active_tasks` at conversation start |
| Workflow → DB | `reportProgress` step sau mỗi agent step |
| Fallback | `GET /api/tasks/[id]` nếu SSE disconnect |

---

## Task Checkpoints

Progress **planned** — Assistant tạo checkpoint khi lên kế hoạch (trong `delegate_task`), thay vì chỉ reactive theo `agent.step_completed`.

### So sánh với step progress (đã có)

| Mechanism | Ai định nghĩa | Khi nào update | Dùng cho |
|-----------|---------------|----------------|----------|
| **Step progress** | Workflow (`maxSteps`) | Mỗi `agent.step_completed` | UI progress bar ước lượng |
| **Planned checkpoints** | Assistant khi delegate | Worker báo `checkpoint.reached` → Assistant `verify_checkpoint` | Quality gate, meaningful milestones |

Cả hai chạy song song; `progressPercent` ưu tiên checkpoint khi có (xem công thức bên dưới).

### Khi nào tạo checkpoint

Trong `delegate_task`, Assistant sinh `checkpoints[]` từ brief:

```typescript
interface TaskCheckpoint {
  id: string;
  label: string;           // "Hoàn thành research 3 nguồn"
  criteria: string;        // Rubric ngắn để verify
  order: number;
  status: "pending" | "reached" | "verified" | "failed";
  reachedAt?: Date;
  verifiedAt?: Date;
  evidence?: string;       // excerpt từ preview hoặc tool output
}
```

**Ví dụ** brief "viết blog về AI agents":

| Order | Label | Criteria |
|-------|-------|----------|
| 1 | Research sources | ≥ 3 nguồn có citation |
| 2 | Outline | Có outline với ≥ 4 sections |
| 3 | Draft | ≥ 800 words |
| 4 | Final deliverable | Saved to deliverable table |

### Worker báo cáo checkpoint

Staff workflow gọi tool **`report_checkpoint`** (worker-side) hoặc `reportProgress` với event type:

| Event | Khi nào |
|-------|---------|
| `checkpoint.reached` | Worker tự đánh dấu đạt milestone |
| `checkpoint.failed` | Worker không đạt sau N attempts |

Worker instructions template (append vào staff system prompt):

```markdown
Before moving to the next phase of work:
1. Call report_checkpoint with checkpointId and evidence (quote from your output or tool results)
2. Wait for verification before proceeding to dependent checkpoints
3. If checkpoint fails, revise your approach based on feedback
```

### Assistant verify checkpoint

**`verify_checkpoint(checkpointId)`** — đọc evidence + criteria, LLM judge pass/fail:

```typescript
// Response example
{
  checkpointId: "cp-1",
  status: "verified",  // or "failed"
  score: 8,
  reasoning: "Found 4 cited sources, meets ≥3 requirement",
  evidence: "Sources: [1] arxiv..., [2] blog..., ..."
}
```

Luồng:
1. Worker → `checkpoint.reached` event
2. Assistant (proactive hoặc on user ask) → `verify_checkpoint`
3. Pass → status `verified`; Fail → `revise_task` hoặc notify user

### progressPercent — công thức mới

Khi task có checkpoints:

```
progressPercent = Math.round((verifiedCheckpoints / totalCheckpoints) * 100)
```

Cap 95% cho đến `workflow.completed` (giữ behavior cũ).

Khi **không** có checkpoints — fallback công thức cũ:

```
progressPercent = Math.round((currentStep / maxSteps) * 90)
```

### Dynamic query — MVP vs Phase 2

| Mechanism | Phase | Mô tả |
|-----------|-------|-------|
| **DB polling** | MVP (Phase 1) | `check_task_status`, `get_task_events`, `get_task_preview` — Assistant đọc DB state |
| **Workflow signal** `query_worker` | Phase 2 | Assistant gửi câu hỏi → worker workflow nhận signal → trả lời qua `task_event` type `worker.query_response` |

**Lưu ý:** MVP "dynamic query" = Assistant query **DB**, không RPC trực tiếp tới agent in-memory. Đủ cho hầu hết case (progress, preview, events).

Phase 2 `query_worker` — khi worker stuck hoặc cần clarification mid-task:

```mermaid
sequenceDiagram
    participant A as Assistant
    participant W as Staff Workflow
    participant DB as task_event

    A->>W: workflow signal query_worker
    Note over W: Agent processes question in next step
    W->>DB: worker.query_response event
    A->>DB: get_task_events / check_task_status
```

---

## Task Lifecycle

```
pending → running → completed | failed | cancelled
```

| Status      | Mô tả                                       | Trigger                                |
| ----------- | ------------------------------------------- | -------------------------------------- |
| `pending`   | Task created, workflow chưa start           | `delegate_task` insert                 |
| `running`   | `workflow_run_id` assigned, agent executing | `start()` returns                      |
| `completed` | Deliverable saved                           | Workflow step `saveDeliverable`        |
| `failed`    | Error logged                                | Workflow error / agent `status: error` |
| `cancelled` | User cancelled                              | `POST /api/tasks/[id]/cancel`          |

### Retry Policy

- `failed` tasks: Assistant có thể đề xuất retry
- Retry = tạo task mới với cùng brief (không reuse workflow run)
- Max 3 retries per original task (tracked via `metadata.retryCount`)

### Notifications

| Event            | Channel            | Payload                              |
| ---------------- | ------------------ | ------------------------------------ |
| `task.started`    | SSE                | `{ taskId, staffName }`                              |
| `task.progress`   | SSE                | `{ taskId, progressPercent, currentStep, preview? }` |
| `task.completed`  | SSE + notification | `{ taskId, deliverableId, preview }`                 |
| `task.failed`     | SSE + notification | `{ taskId, error }`                                  |
| `staff.hired`    | SSE                | `{ staffId, name, role }`            |

---

## Assistant Instructions (template)

```markdown
You are the Assistant for Nex Staff — the user's personal coordinator.

Your responsibilities:

1. Understand the user's project and goals through conversation
2. Manage company documents (upload, search, organize)
3. Hire specialized staff when needed
4. Delegate tasks to the right staff member
5. Keep the user informed about task progress
6. Verify checkpoints and review deliverables before presenting results to user

When delegating:

- Always confirm which staff member received the task
- Define checkpoints and acceptanceCriteria for non-trivial tasks
- Tell the user they can continue chatting
- Never wait for task completion in your response

When hiring:

- Ask clarifying questions about role, tone, and requirements
- Suggest appropriate preset templates
- Introduce the new staff member by name

You have access to the user's staff roster and documents. Use tools proactively.
```

---

## Tài liệu liên quan

- [ARCHITECTURE.md](ARCHITECTURE.md) — Runtime implementation
- [DATA-MODEL.md](DATA-MODEL.md) — Database tables
- [API.md](API.md) — Tool schemas, endpoints
- [EVAL-FRAMEWORK.md](EVAL-FRAMEWORK.md) — Worker quality metrics and tests
