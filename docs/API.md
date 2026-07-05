# API Specification — Nex Staff

## Overview

The Nex Staff API comprises REST endpoints (Next.js Route Handlers) and SSE events for real-time notifications. All endpoints require an authenticated session (Better Auth) except the workflow webhook.

**Base URL:** `/api`

**Auth:** Session cookie from Better Auth. Check via `getServerViewer()`.

---

## REST Endpoints

### Chat

| Method   | Path                       | Description                                        |
| -------- | -------------------------- | -------------------------------------------------- |
| `POST`   | `/api/chat`                | Stream assistant response (`ToolLoopAgent.stream`) |
| `GET`    | `/api/chats`               | List user chats (paginated)                        |
| `GET`    | `/api/chats/[id]`          | Get chat with messages and events                  |
| `POST`   | `/api/chats/[id]/messages` | Send user message (alternative to `/api/chat`)     |
| `DELETE` | `/api/chats/[id]`          | Delete chat                                        |

#### `POST /api/chat`

Stream assistant response. Primary endpoint for `useChat`.

**Request:**

```json
{
  "id": "chat-uuid",
  "messages": [{ "role": "user", "content": "Write a blog post about AI agents" }]
}
```

**Response:** `text/event-stream` (AI SDK UI message stream)

**Implementation:**

```typescript
export async function POST(req: Request) {
  const viewer = await getServerViewer();
  if (!viewer) return new Response("Unauthorized", { status: 401 });

  const { messages, id: chatId } = await req.json();
  const assistant = createAssistant(viewer.id);

  return assistant.stream({
    messages,
    experimental_context: { userId: viewer.id, chatId },
  });
}
```

---

### Staff

| Method   | Path              | Description                 |
| -------- | ----------------- | --------------------------- |
| `GET`    | `/api/staff`      | List hired staff            |
| `POST`   | `/api/staff`      | Hire new staff              |
| `GET`    | `/api/staff/[id]` | Staff detail + task history |
| `PATCH`  | `/api/staff/[id]` | Update staff profile        |
| `DELETE` | `/api/staff/[id]` | Remove staff                |

#### `GET /api/staff`

**Query params:** `status` (optional: `idle`, `working`, `offline`)

**Response:**

```json
{
  "staff": [
    {
      "id": "uuid",
      "name": "Alex",
      "role": "Content Writer",
      "avatarSprite": "writer-01",
      "status": "idle",
      "hiredAt": "2026-07-04T10:00:00Z",
      "activeTasks": 0
    }
  ]
}
```

#### `POST /api/staff`

Called by `hire_staff` tool or directly.

**Request:**

```json
{
  "name": "Alex",
  "role": "Content Writer",
  "template": "writer",
  "instructions": "Write casual blog posts for startup founders...",
  "documentIds": ["doc-uuid-1"],
  "useSandbox": true
}
```

**Response:** `201` with created staff object.

---

### Tasks

| Method | Path                     | Description               |
| ------ | ------------------------ | ------------------------- |
| `POST` | `/api/tasks`             | Create + dispatch task    |
| `GET`  | `/api/tasks`               | List tasks (includes progress)        |
| `GET`  | `/api/tasks/[id]`          | Task detail + deliverable + progress  |
| `GET`  | `/api/tasks/[id]/events`   | Task event timeline (paginated)       |
| `GET`  | `/api/tasks/[id]/preview`  | Draft preview text                    |
| `POST` | `/api/tasks/[id]/cancel`   | Cancel running task                   |

#### `GET /api/tasks`

**Query params:**

- `status` — filter by status
- `staffId` — filter by staff
- `limit` — default 20

**Response:**

```json
{
  "tasks": [
    {
      "id": "uuid",
      "brief": "Write a blog post about AI agents",
      "status": "running",
      "progressPercent": 45,
      "currentStep": "Writing the introduction...",
      "lastEventAt": "2026-07-04T10:08:30Z",
      "staff": { "id": "uuid", "name": "Alex", "role": "Content Writer" },
      "workflowRunId": "wrun_xxx",
      "startedAt": "2026-07-04T10:05:00Z",
      "deliverable": null
    }
  ]
}
```

#### `GET /api/tasks/[id]`

**Response:**

```json
{
  "id": "uuid",
  "brief": "...",
  "status": "completed",
  "staff": { "id": "uuid", "name": "Alex" },
  "deliverable": {
    "id": "uuid",
    "title": "AI Agents Blog Post",
    "content": "# AI Agents\n\n...",
    "contentType": "text/markdown"
  }
}
```

---

### Documents

| Method   | Path                  | Description     |
| -------- | --------------------- | --------------- |
| `POST`   | `/api/documents`      | Upload document |
| `GET`    | `/api/documents`      | List documents  |
| `GET`    | `/api/documents/[id]` | Document detail |
| `DELETE` | `/api/documents/[id]` | Remove document |

#### `POST /api/documents`

**Request:** `multipart/form-data` with `file` field.

**Response:**

```json
{
  "id": "uuid",
  "filename": "product-spec.pdf",
  "status": "processing",
  "uploadedAt": "2026-07-04T10:00:00Z"
}
```

Processing pipeline (async):

1. Upload to Vercel Blob
2. Extract text (PDF parser / markdown read)
3. Chunk + embed
4. Update status → `ready`

---

### Workflows

| Method | Path                        | Description                        |
| ------ | --------------------------- | ---------------------------------- |
| `GET`  | `/api/workflows/[runId]`    | Poll workflow run status           |
| `POST` | `/api/.well-known/workflow` | Vercel Workflow webhook (built-in) |

#### `GET /api/workflows/[runId]`

**Response:**

```json
{
  "runId": "wrun_xxx",
  "status": "running",
  "task": {
    "id": "uuid",
    "brief": "...",
    "staffName": "Alex"
  }
}
```

---

### Notifications

| Method | Path                         | Description                     |
| ------ | ---------------------------- | ------------------------------- |
| `GET`    | `/api/notifications`         | SSE stream for real-time events       |
| `GET`    | `/api/notifications/pending` | Pending notifications (Assistant poll) |
| `PATCH`  | `/api/notifications/[id]`    | Mark notification as delivered        |

#### `GET /api/notifications`

**Response:** `text/event-stream`

See [SSE Events](#sse-events) below.

---

## Assistant Tools

Tools available to `ToolLoopAgent` (Assistant). Defined in `lib/tools/`.

### `search_documents`

RAG query over user's documents.

```typescript
{
  name: "search_documents",
  description: "Search company documents for relevant information",
  inputSchema: z.object({
    query: z.string(),
    documentIds: z.array(z.string()).optional(),
  }),
  execute: async ({ query, documentIds }, { experimental_context }) => {
    const results = await searchDocuments(experimental_context.userId, query, documentIds);
    return { results, count: results.length };
  },
}
```

### `create_document`

Create a new document from agent-generated content.

```typescript
{
  name: "create_document",
  description: "Create a new document from generated content",
  inputSchema: z.object({
    filename: z.string(),
    content: z.string(),
    mimeType: z.string().default("text/markdown"),
  }),
}
```

### `web_research`

Search and summarize from the internet.

```typescript
{
  name: "web_research",
  description: "Research a topic on the internet and return a summary",
  inputSchema: z.object({
    query: z.string(),
    maxResults: z.number().default(5),
  }),
}
```

### `hire_staff`

Create a new staff profile.

```typescript
{
  name: "hire_staff",
  description: "Hire a new specialist staff member",
  inputSchema: z.object({
    name: z.string(),
    role: z.string(),
    template: z.enum(["writer", "researcher", "analyst", "reviewer", "social"]).optional(),
    instructions: z.string(),
    documentIds: z.array(z.string()).optional(),
    useSandbox: z.boolean().optional(),
  }),
}
```

### `delegate_task`

Delegate to staff — fire-and-forget. Assistant may include checkpoints and acceptance criteria.

```typescript
{
  name: "delegate_task",
  description: "Delegate a task to a staff member. They will work in the background.",
  inputSchema: z.object({
    staffId: z.string(),
    brief: z.string(),
    acceptanceCriteria: z.string().optional(),
    checkpoints: z.array(z.object({
      label: z.string(),
      criteria: z.string(),
      order: z.number(),
    })).optional(),
    parentGroupId: z.string().optional(),
    dependsOn: z.array(z.string()).optional(),
  }),
}
```

### `list_staff`

Returns staff roster.

```typescript
{
  name: "list_staff",
  description: "List all hired staff members and their status",
  inputSchema: z.object({
    status: z.enum(["idle", "working", "offline"]).optional(),
  }),
}
```

### `check_task_status`

Full snapshot: status, progress, current step, recent events, preview excerpt.

```typescript
{
  name: "check_task_status",
  description: "Check status, progress, and partial results of a delegated task",
  inputSchema: z.object({
    taskId: z.string(),
  }),
  // Returns: status, progressPercent, currentStep, recentEvents[], hasPreview, previewExcerpt
}
```

### `list_active_tasks`

Running tasks + recently completed tasks not yet notified.

```typescript
{
  name: "list_active_tasks",
  description: "List all running tasks and recently completed tasks awaiting notification",
  inputSchema: z.object({}),
}
```

### `get_task_events`

Detailed step-by-step log (paginated).

```typescript
{
  name: "get_task_events",
  description: "Get detailed event log for a task",
  inputSchema: z.object({
    taskId: z.string(),
    limit: z.number().default(20),
  }),
}
```

### `get_task_preview`

Temporary draft output.

```typescript
{
  name: "get_task_preview",
  description: "Get partial/draft output from a running task",
  inputSchema: z.object({
    taskId: z.string(),
  }),
}
```

### `get_deliverable`

Fetch completed work.

```typescript
{
  name: "get_deliverable",
  description: "Get the deliverable from a completed task",
  inputSchema: z.object({
    taskId: z.string(),
  }),
}
```

### `verify_checkpoint`

Verify planned checkpoint — score evidence vs criteria, LLM judge pass/fail.

```typescript
{
  name: "verify_checkpoint",
  description: "Verify a task checkpoint against its criteria using worker evidence",
  inputSchema: z.object({
    taskId: z.string(),
    checkpointId: z.string(),
  }),
  // Returns: status (verified|failed), score, reasoning, evidence
}
```

### `review_deliverable`

Score deliverable vs `acceptanceCriteria` in task metadata.

```typescript
{
  name: "review_deliverable",
  description: "Review completed deliverable against acceptance criteria",
  inputSchema: z.object({
    taskId: z.string(),
  }),
  // Returns: score (1-10), passed (boolean), dimensions[], reasoning
}
```

### `revise_task`

Send feedback to running worker or spawn revision task.

```typescript
{
  name: "revise_task",
  description: "Request revision on a running or completed task with specific feedback",
  inputSchema: z.object({
    taskId: z.string(),
    feedback: z.string(),
    mode: z.enum(["signal", "new_task"]).default("new_task"),
  }),
  // signal: Phase 2 workflow signal to running worker
  // new_task: create task with revised brief + metadata.retryCount++
}
```

### `list_queued_tasks`

Pending backlog per staff — tasks created but workflow not started.

```typescript
{
  name: "list_queued_tasks",
  description: "List queued (pending) tasks per staff member",
  inputSchema: z.object({
    staffId: z.string().optional(),
  }),
  // Returns: { staffId, staffName, queued: [{ taskId, brief, createdAt, queuePosition }] }
}
```

---

## SSE Events

Client connects via `GET /api/notifications` (EventSource).

| Event            | Payload                                     | Trigger                           |
| ---------------- | ------------------------------------------- | --------------------------------- |
| `message.delta`  | `{ text: string }`                          | Assistant streaming (via useChat) |
| `task.started`    | `{ taskId, staffName, staffRole }`                    | Task dispatched to workflow        |
| `task.progress`   | `{ taskId, progressPercent, currentStep, preview?, checkpointId? }`  | Each `reportProgress` step          |
| `task.checkpoint` | `{ taskId, checkpointId, label, status }`                            | Checkpoint reached/verified/failed |
| `task.completed`  | `{ taskId, deliverableId, title, preview }`           | Workflow finished successfully     |
| `task.failed`     | `{ taskId, error }`                                   | Workflow or agent error            |
| `staff.hired`    | `{ staffId, name, role, avatarSprite }`     | New staff created                 |
| `document.ready` | `{ documentId, filename }`                  | Document processing complete      |

### Event format

```
event: task.completed
data: {"taskId":"uuid","deliverableId":"uuid","title":"Blog Post","preview":"# AI Agents..."}
```

### Client integration

```typescript
useEffect(() => {
  const es = new EventSource("/api/notifications");

  es.addEventListener("task.completed", (e) => {
    const data = JSON.parse(e.data);
    // Trigger cutscene-notify: staff NPC walk-in + dialogue choices
    showCutsceneNotify(data);
  });

  return () => es.close();
}, []);
```

---

## Voice (planned)

> **Status:** Not implemented. Spec for Phase 2 — see [VOICE-CHAT.md](VOICE-CHAT.md).

| Method | Path                      | Description              |
| ------ | ------------------------- | ------------------------ |
| `POST` | `/api/voice/transcribe`   | Speech-to-text (audio → text) |
| `POST` | `/api/voice/speak`        | Text-to-speech (text → audio) |

Voice endpoints are **adapters** — they do not replace `POST /api/chat`. Client flow: transcribe → user confirms text → existing chat stream → optional speak on NPC lines.

#### `POST /api/voice/transcribe`

**Request:** `multipart/form-data`

| Field    | Type   | Description              |
| -------- | ------ | ------------------------ |
| `audio`  | file   | WebM/Opus or WAV, max 60s |
| `chatId` | uuid   | Optional audit context   |
| `locale` | string | Optional, e.g. `vi`    |

**Response:**

```json
{
  "text": "Write a blog post about AI agents",
  "durationMs": 3200,
  "locale": "vi"
}
```

#### `POST /api/voice/speak`

**Request:**

```json
{
  "text": "Delegated to Alex.",
  "speakerId": "assistant",
  "locale": "vi"
}
```

**Response:** `audio/mpeg` body, or JSON with `audioBase64` (V1 TBD at implementation).

---

## Error Responses

Standard error format:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

| Status | Code               | When                                |
| ------ | ------------------ | ----------------------------------- |
| 401    | `UNAUTHORIZED`     | No session                          |
| 403    | `FORBIDDEN`        | Resource belongs to another user    |
| 404    | `NOT_FOUND`        | Resource doesn't exist              |
| 400    | `VALIDATION_ERROR` | Invalid request body                |
| 409    | `CONFLICT`         | Staff already exists with same name |
| 500    | `INTERNAL_ERROR`   | Server error                        |

---

## Related docs

- [ARCHITECTURE.md](ARCHITECTURE.md) — Implementation details
- [VOICE-CHAT.md](VOICE-CHAT.md) — Voice STT/TTS plan
- [AGENT-SYSTEM.md](AGENT-SYSTEM.md) — Tool behavior and delegation
- [DATA-MODEL.md](DATA-MODEL.md) — Database tables
- [EVAL-FRAMEWORK.md](EVAL-FRAMEWORK.md) — Worker quality metrics and tests
