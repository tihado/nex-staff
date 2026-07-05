# Roadmap — Nex Staff

## Overview

| Phase | Name       | Timeline | Goals                           |
| ----- | ---------- | -------- | ------------------------------- |
| 0     | Foundation | 2 weeks  | Auth, chat, basic assistant     |
| 1     | MVP        | 3-4 weeks| Hire, delegate, async, 8-bit UI |
| 1.5   | Supervision| 1-2 weeks| Checkpoints, verify, multi-worker orchestration |
| 2     | v1.0       | 3 weeks  | RAG, task history, polish       |
| 3     | v1.5       | TBD      | Custom staff, MCP, HarnessAgent |
| 4     | v2.0       | TBD      | Team, marketplace, billing      |

---

## Phase 0 — Foundation (2 weeks)

**Goals:** User can log in, chat with Assistant, upload files.

### Deliverables

- [ ] Init Next.js 16 project with TypeScript, Tailwind CSS v4
- [ ] Install packages: `ai`, `@ai-sdk/react`, `@ai-sdk/google`, `workflow`, `@workflow/ai`, `@ai-sdk/sandbox-vercel`
- [ ] Better Auth setup (Google OAuth)
- [ ] Drizzle ORM + Neon Postgres schema (core tables)
- [ ] Vercel Blob integration for document upload
- [ ] Workspace screen: tilemap grid, desk zones, player movement (CSS grid fallback)
- [ ] RPG dialogue overlay: DialogueBox + typewriter
- [ ] Assistant `ToolLoopAgent` with tools: chat, `web_research`
- [ ] Document upload endpoint + Blob storage
- [ ] Auto-create Assistant on first login

### Exit Criteria

- User logs in → chats with Assistant → receives streaming response
- Upload file → saved to Blob → Assistant knows file was uploaded
- Deploy to Vercel preview

### Out of scope for Phase 0

- Hire/delegate flow
- Staff agents
- 8-bit UI skin
- RAG/pgvector

---

## Phase 1 — MVP (3-4 weeks)

**Goals:** Full hire → delegate → async → notify loop with 8-bit UI.

### Deliverables

- [ ] Complete hiring flow (assistant-driven, inline chat)
- [ ] 3 preset staff templates: Writer, Researcher, Analyst
- [ ] `staff` table + `hire_staff` tool
- [ ] `DurableAgent` + `staffTaskWorkflow` (Vercel Workflow)
- [ ] `delegate_task` tool — fire-and-forget
- [ ] Vercel Sandbox for staff with `useSandbox: true`
- [ ] Task observability: `task_event`, `task_preview`, `notification` tables
- [ ] `reportProgress` in staffTaskWorkflow + SSE `task.progress`
- [ ] Assistant tools: `list_active_tasks`, `get_task_events`, `get_task_preview`
- [ ] Enhanced `check_task_status` with progress + preview
- [ ] Deliverable preview inline in chat
- [ ] Archive Room + Task Board overlays
- [ ] 8-bit tilemap assets, desk sprites, archive shelves
- [ ] Staff roster overlay (`/staff`)
- [ ] Typing indicator pixel animation
- [ ] Eval harness MVP: routing runner + 5 deliverable scenarios (see [EVAL-FRAMEWORK.md](EVAL-FRAMEWORK.md))

### Exit Criteria

- User: "write a blog about X" → Assistant hires Writer (if not yet hired) → delegates → user continues chatting → receives notification when done → views deliverable
- 3 staff types work end-to-end
- UI has 8-bit aesthetic

### Milestones

| Week | Focus                                     |
| ---- | ----------------------------------------- |
| 1    | Staff schema, hire flow, preset templates |
| 2    | Workflow + DurableAgent + delegate        |
| 3    | Sandbox integration, notifications        |
| 4    | 8-bit UI, polish, testing                 |

---

## Phase 1.5 — Supervision (1-2 weeks)

**Goals:** Assistant supervises workers via planned checkpoints; multi-worker orchestration; eval integration.

### Deliverables

- [ ] `task_checkpoint` table + checkpoint events in `task_event`
- [ ] `delegate_task` extended: `checkpoints[]`, `acceptanceCriteria`, `parentGroupId`, `dependsOn`
- [ ] Worker tool `report_checkpoint` in staffTaskWorkflow
- [ ] Assistant tools: `verify_checkpoint`, `review_deliverable`, `revise_task`, `list_queued_tasks`
- [ ] Task queue semantics: FIFO per staff, 1 running + 3 pending
- [ ] Multi-task orchestration: task groups + dependency gating
- [ ] `progressPercent` from verified checkpoints (fallback step-based)
- [ ] SSE `task.checkpoint` event
- [ ] Eval harness: checkpoint pass rate metric

### Exit Criteria

- Assistant delegates blog task with 4 checkpoints → verifies each checkpoint → reviews deliverable before notifying user
- Multi-worker flow: Researcher → Writer dependency chain works end-to-end
- Checkpoint pass rate ≥ 85% on eval scenarios

### Out of scope for Phase 1.5

- Workflow signal `query_worker` (Phase 2)
- Per-staff quality dashboard (Phase 2)

---

## Phase 2 — v1.0 (3 weeks)

**Goals:** Production-ready with RAG, task history, error handling.

### Deliverables

- [ ] pgvector setup + `document_chunk` embedding pipeline
- [ ] `search_documents` tool (RAG) for Assistant and Staff
- [ ] Staff document linking (`staff_document` table)
- [ ] Task history view (`/tasks` command)
- [ ] Enhanced deliverable preview (markdown render, copy, download)
- [ ] Slash commands: `/staff`, `/tasks`, `/docs`, `/status`, `/help`
- [ ] Error handling + retry logic for failed tasks
- [ ] Workflow status polling endpoint
- [ ] Chat persistence (`chat_event` event sourcing)
- [ ] Chat sidebar (list conversations)
- [ ] **Voice V1:** push-to-talk STT + optional NPC TTS readback in dialogue (see [VOICE-CHAT.md](VOICE-CHAT.md))
- [ ] Workflow signal `query_worker` — Assistant dynamic query to running worker
- [ ] Regression eval golden tasks (see [EVAL-FRAMEWORK.md](EVAL-FRAMEWORK.md))
- [ ] Per-staff quality metrics dashboard

### Exit Criteria

- Upload PDF → chunk + embed → Assistant/Staff can search with citation
- User can review full task history and deliverables
- Failed task → Assistant suggests retry
- Chat history persists across refresh

---

## Phase 3 — v1.5 (TBD)

**Goals:** Power features for advanced users.

### Deliverables

- [ ] Custom staff (user-defined role + skills + instructions)
- [ ] MCP tool integrations (Notion, Linear, GitHub) via AI SDK MCP Apps
- [ ] `HarnessAgent` for coding staff (Claude Code / Codex in Sandbox)
- [ ] Staff "level up" — learn from user feedback, update instructions
- [ ] Chiptune sound effects (hire, complete, notification)
- [ ] **Voice V2:** streaming STT, sentence-chunk TTS, mic SFX, user voice prefs (see [VOICE-CHAT.md](VOICE-CHAT.md))
- [ ] `create_document` tool — save output as company doc
- [ ] Provider skill uploads (`uploadSkill` API)

### Considerations

- MCP Apps need sandbox iframe — evaluate security
- HarnessAgent APIs experimental — pin versions
- "Level up" needs eval framework to avoid drift

---

## Phase 4 — v2.0 (TBD)

**Goals:** Expand beyond solo founder (if product-market fit).

### Potential Deliverables

- [ ] Team workspace (multiple users, shared staff)
- [ ] Role-based access (admin, member, viewer)
- [ ] Agent marketplace (share/discover staff templates)
- [ ] Billing / usage tracking
- [ ] Rate limiting / usage quotas
- [ ] Mobile PWA
- [ ] Audit log

### Gate

Only proceed if:

- Phase 1-2 has traction (retention, engagement metrics)
- User feedback requests team features
- Unit economics work with LLM + Sandbox costs

---

## Technical Risks

| Risk                        | Impact                     | Likelihood | Mitigation                                                |
| --------------------------- | -------------------------- | ---------- | --------------------------------------------------------- |
| Sandbox cold start (10-30s) | UX delay on delegate       | High       | Pixel "staff preparing..." animation; set expectation     |
| Vercel Sandbox cost         | Cost per sandbox-minute    | Medium     | Destroy immediately after task; monitor usage on Vercel   |
| Workflow cold start         | Delay on hobby tier        | Medium     | Optimize step caching; set user expectation               |
| LLM API cost                | Many tasks = many calls    | High       | `maxSteps` limit per task                                 |
| RAG quality                 | Staff answers incorrectly from docs | Medium | Citation required; chunking eval benchmark           |
| 8-bit assets delay          | UI lacks identity          | Medium     | Emoji fallback in Phase 0-1                               |
| AI SDK 7 breaking changes   | Experimental APIs change   | Medium     | Pin versions; monitor changelog                           |
| Delegation routing errors   | Wrong staff gets task      | Medium     | 20-scenario eval benchmark; fallback to Assistant         |

---

## Success Metrics by Phase

| Phase | Metric                      | Target                |
| ----- | --------------------------- | --------------------- |
| 0     | Login → first chat          | < 30s                 |
| 1     | Hire → first deliverable    | < 10 min              |
| 1     | Delegation routing accuracy | ≥ 90%                 |
| 1.5   | Checkpoint pass rate        | ≥ 85%                 |
| 2     | RAG citation accuracy       | ≥ 85%                 |
| 2     | Task completion rate        | ≥ 80%                 |
| 3     | Custom staff adoption       | ≥ 30% of active users |

---

## Dependencies

| Dependency                  | Required by                     | Notes                         |
| --------------------------- | ------------------------------- | ----------------------------- |
| Vercel account + AI Gateway | Phase 0                         | API keys, OIDC for Sandbox    |
| Neon Postgres + pgvector    | Phase 0 (schema), Phase 2 (RAG) | Enable vector extension       |
| Vercel Blob                 | Phase 0                         | Document storage              |
| Vercel Workflow             | Phase 1                         | Async staff execution         |
| Vercel Sandbox              | Phase 1                         | File/shell ops                |
| Google OAuth credentials    | Phase 0                         | Better Auth provider          |
| Pixel art assets            | Phase 1                         | Can defer with emoji fallback |

---

## Related docs

- [PRD.md](PRD.md) — Requirements and success criteria
- [ARCHITECTURE.md](ARCHITECTURE.md) — Technical implementation
- [AGENT-SYSTEM.md](AGENT-SYSTEM.md) — Supervision, checkpoints, multi-worker
- [EVAL-FRAMEWORK.md](EVAL-FRAMEWORK.md) — Worker quality metrics and tests
- [VOICE-CHAT.md](VOICE-CHAT.md) — Voice input/output plan for RPG dialogue
- [UI-UX.md](UI-UX.md) — Design phases
