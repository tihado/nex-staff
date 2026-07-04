# API Specification — Nex Staff

## Overview

Nex Staff API gồm REST endpoints (Next.js Route Handlers) và SSE events cho real-time notifications. Tất cả endpoints yêu cầu authenticated session (Better Auth) trừ workflow webhook.

**Base URL:** `/api`

**Auth:** Session cookie từ Better Auth. Check via `getServerViewer()`.

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
  "messages": [{ "role": "user", "content": "Viết blog về AI agents" }]
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
  "useSandbox": false
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
      "brief": "Viết blog về AI agents",
      "status": "running",
      "progressPercent": 45,
      "currentStep": "Đang viết phần mở đầu...",
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

RAG query trên user's documents.

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

Tạo tài liệu mới từ nội dung agent generate.

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

Search và summarize từ internet.

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

Tạo staff profile mới.

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

Giao việc cho staff — fire-and-forget.

```typescript
{
  name: "delegate_task",
  description: "Delegate a task to a staff member. They will work in the background.",
  inputSchema: z.object({
    staffId: z.string(),
    brief: z.string(),
  }),
}
```

### `list_staff`

Trả về roster staff.

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

Snapshot đầy đủ: status, progress, current step, recent events, preview excerpt.

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

Tasks đang chạy + vừa hoàn thành chưa thông báo.

```typescript
{
  name: "list_active_tasks",
  description: "List all running tasks and recently completed tasks awaiting notification",
  inputSchema: z.object({}),
}
```

### `get_task_events`

Nhật ký chi tiết từng bước (paginated).

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

Draft output tạm thời.

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

---

## SSE Events

Client connects via `GET /api/notifications` (EventSource).

| Event            | Payload                                     | Trigger                           |
| ---------------- | ------------------------------------------- | --------------------------------- |
| `message.delta`  | `{ text: string }`                          | Assistant streaming (via useChat) |
| `task.started`    | `{ taskId, staffName, staffRole }`                    | Task dispatched to workflow        |
| `task.progress`   | `{ taskId, progressPercent, currentStep, preview? }`  | Mỗi `reportProgress` step          |
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

## Tài liệu liên quan

- [ARCHITECTURE.md](ARCHITECTURE.md) — Implementation details
- [AGENT-SYSTEM.md](AGENT-SYSTEM.md) — Tool behavior and delegation
- [DATA-MODEL.md](DATA-MODEL.md) — Database tables
