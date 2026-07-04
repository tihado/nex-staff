# Roadmap — Nex Staff

## Tổng quan

| Phase | Tên        | Timeline | Mục tiêu                        |
| ----- | ---------- | -------- | ------------------------------- |
| 0     | Foundation | 2 tuần   | Auth, chat, basic assistant     |
| 1     | MVP        | 3-4 tuần | Hire, delegate, async, 8-bit UI |
| 1.5   | Supervision| 1-2 tuần | Checkpoints, verify, multi-worker orchestration |
| 2     | v1.0       | 3 tuần   | RAG, task history, polish       |
| 3     | v1.5       | TBD      | Custom staff, MCP, HarnessAgent |
| 4     | v2.0       | TBD      | Team, marketplace, billing      |

---

## Phase 0 — Foundation (2 tuần)

**Mục tiêu:** Có thể login, chat với Assistant, upload file.

### Deliverables

- [ ] Init Next.js 16 project với TypeScript, Tailwind CSS v4
- [ ] Install packages: `ai`, `@ai-sdk/react`, `@ai-sdk/google`, `workflow`, `@workflow/ai`, `@ai-sdk/sandbox-vercel`
- [ ] Better Auth setup (Google OAuth)
- [ ] Drizzle ORM + Neon Postgres schema (core tables)
- [ ] Vercel Blob integration cho document upload
- [ ] Workspace screen: tilemap grid, desk zones, player movement (CSS grid fallback)
- [ ] RPG dialogue overlay: DialogueBox + typewriter
- [ ] Assistant `ToolLoopAgent` với tools: chat, `web_research`
- [ ] Document upload endpoint + Blob storage
- [ ] Auto-create Assistant on first login

### Exit Criteria

- User login → chat với Assistant → nhận streaming response
- Upload file → lưu Blob → Assistant biết file đã upload
- Deploy lên Vercel preview

### Không làm trong Phase 0

- Hire/delegate flow
- Staff agents
- 8-bit UI skin
- RAG/pgvector

---

## Phase 1 — MVP (3-4 tuần)

**Mục tiêu:** Full hire → delegate → async → notify loop với 8-bit UI.

### Deliverables

- [ ] Hiring flow hoàn chỉnh (assistant-driven, inline chat)
- [ ] 3 preset staff templates: Writer, Researcher, Analyst
- [ ] `staff` table + `hire_staff` tool
- [ ] `DurableAgent` + `staffTaskWorkflow` (Vercel Workflow)
- [ ] `delegate_task` tool — fire-and-forget
- [ ] Vercel Sandbox cho staff với `useSandbox: true`
- [ ] Task observability: `task_event`, `task_preview`, `notification` tables
- [ ] `reportProgress` trong staffTaskWorkflow + SSE `task.progress`
- [ ] Assistant tools: `list_active_tasks`, `get_task_events`, `get_task_preview`
- [ ] Enhanced `check_task_status` với progress + preview
- [ ] Deliverable preview inline trong chat
- [ ] Archive Room + Task Board overlays
- [ ] 8-bit tilemap assets, desk sprites, archive shelves
- [ ] Staff roster overlay (`/staff`)
- [ ] Typing indicator pixel animation
- [ ] Eval harness MVP: routing runner + 5 deliverable scenarios (see [EVAL-FRAMEWORK.md](EVAL-FRAMEWORK.md))

### Exit Criteria

- User: "viết blog về X" → Assistant hire Writer (nếu chưa có) → delegate → user tiếp tục chat → nhận notification khi xong → xem deliverable
- 3 staff types hoạt động end-to-end
- UI có 8-bit aesthetic

### Milestones

| Tuần | Focus                                     |
| ---- | ----------------------------------------- |
| 1    | Staff schema, hire flow, preset templates |
| 2    | Workflow + DurableAgent + delegate        |
| 3    | Sandbox integration, notifications        |
| 4    | 8-bit UI, polish, testing                 |

---

## Phase 1.5 — Supervision (1-2 tuần)

**Mục tiêu:** Assistant giám sát worker qua planned checkpoints; multi-worker orchestration; eval integration.

### Deliverables

- [ ] `task_checkpoint` table + checkpoint events trong `task_event`
- [ ] `delegate_task` extended: `checkpoints[]`, `acceptanceCriteria`, `parentGroupId`, `dependsOn`
- [ ] Worker tool `report_checkpoint` trong staffTaskWorkflow
- [ ] Assistant tools: `verify_checkpoint`, `review_deliverable`, `revise_task`, `list_queued_tasks`
- [ ] Task queue semantics: FIFO per staff, 1 running + 3 pending
- [ ] Multi-task orchestration: task groups + dependency gating
- [ ] `progressPercent` từ verified checkpoints (fallback step-based)
- [ ] SSE `task.checkpoint` event
- [ ] Eval harness: checkpoint pass rate metric

### Exit Criteria

- Assistant delegate blog task với 4 checkpoints → verify từng checkpoint → review deliverable trước khi báo user
- Multi-worker flow: Researcher → Writer dependency chain hoạt động end-to-end
- Checkpoint pass rate ≥ 85% trên eval scenarios

### Không làm trong Phase 1.5

- Workflow signal `query_worker` (Phase 2)
- Per-staff quality dashboard (Phase 2)

---

## Phase 2 — v1.0 (3 tuần)

**Mục tiêu:** Production-ready với RAG, task history, error handling.

### Deliverables

- [ ] pgvector setup + `document_chunk` embedding pipeline
- [ ] `search_documents` tool (RAG) cho Assistant và Staff
- [ ] Staff document linking (`staff_document` table)
- [ ] Task history view (`/tasks` command)
- [ ] Deliverable preview nâng cao (markdown render, copy, download)
- [ ] Slash commands: `/staff`, `/tasks`, `/docs`, `/status`, `/help`
- [ ] Error handling + retry logic cho failed tasks
- [ ] Workflow status polling endpoint
- [ ] Chat persistence (`chat_event` event sourcing)
- [ ] Chat sidebar (list conversations)
- [ ] **Voice V1:** push-to-talk STT + optional NPC TTS readback in dialogue (see [VOICE-CHAT.md](VOICE-CHAT.md))
- [ ] Workflow signal `query_worker` — Assistant dynamic query tới worker đang chạy
- [ ] Regression eval golden tasks (see [EVAL-FRAMEWORK.md](EVAL-FRAMEWORK.md))
- [ ] Per-staff quality metrics dashboard

### Exit Criteria

- Upload PDF → chunk + embed → Assistant/Staff tra cứu được với citation
- User xem lại toàn bộ task history và deliverables
- Failed task → Assistant đề xuất retry
- Chat history persist qua refresh

---

## Phase 3 — v1.5 (TBD)

**Mục tiêu:** Power features cho advanced users.

### Deliverables

- [ ] Custom staff (user-defined role + skills + instructions)
- [ ] MCP tool integrations (Notion, Linear, GitHub) via AI SDK MCP Apps
- [ ] `HarnessAgent` cho coding staff (Claude Code / Codex trong Sandbox)
- [ ] Staff "level up" — học từ user feedback, cập nhật instructions
- [ ] Chiptune sound effects (hire, complete, notification)
- [ ] **Voice V2:** streaming STT, sentence-chunk TTS, mic SFX, user voice prefs (see [VOICE-CHAT.md](VOICE-CHAT.md))
- [ ] `create_document` tool — lưu output thành company doc
- [ ] Provider skill uploads (`uploadSkill` API)

### Considerations

- MCP Apps cần sandbox iframe — evaluate security
- HarnessAgent APIs experimental — pin versions
- "Level up" cần eval framework để tránh drift

---

## Phase 4 — v2.0 (TBD)

**Mục tiêu:** Mở rộng beyond solo founder (nếu product-market fit).

### Potential Deliverables

- [ ] Team workspace (nhiều user, shared staff)
- [ ] Role-based access (admin, member, viewer)
- [ ] Agent marketplace (share/discover staff templates)
- [ ] Billing / usage tracking
- [ ] Rate limiting / usage quotas
- [ ] Mobile PWA
- [ ] Audit log

### Gate

Chỉ proceed nếu:

- Phase 1-2 có traction (retention, engagement metrics)
- User feedback yêu cầu team features
- Unit economics work với LLM + Sandbox costs

---

## Technical Risks

| Risk                        | Impact                     | Likelihood | Mitigation                                                |
| --------------------------- | -------------------------- | ---------- | --------------------------------------------------------- |
| Sandbox cold start (10-30s) | UX delay khi delegate      | High       | Pixel "staff đang chuẩn bị..." animation; set expectation |
| Vercel Sandbox cost         | Chi phí per sandbox-minute | Medium     | Destroy ngay sau task; monitor usage trên Vercel            |
| Workflow cold start         | Delay trên hobby tier      | Medium     | Optimize step caching; set user expectation               |
| LLM API cost                | Nhiều tasks = nhiều calls  | High       | `maxSteps` limit per task                                 |
| RAG quality                 | Staff trả lời sai từ docs  | Medium     | Citation required; chunking eval benchmark                |
| 8-bit assets delay          | UI không có identity       | Medium     | Emoji fallback trong Phase 0-1                            |
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

## Tài liệu liên quan

- [PRD.md](PRD.md) — Requirements và success criteria
- [ARCHITECTURE.md](ARCHITECTURE.md) — Technical implementation
- [AGENT-SYSTEM.md](AGENT-SYSTEM.md) — Supervision, checkpoints, multi-worker
- [EVAL-FRAMEWORK.md](EVAL-FRAMEWORK.md) — Worker quality metrics and tests
- [VOICE-CHAT.md](VOICE-CHAT.md) — Voice input/output plan for RPG dialogue
- [UI-UX.md](UI-UX.md) — Design phases
