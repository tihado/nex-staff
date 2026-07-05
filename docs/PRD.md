# Product Requirements Document — Nex Staff

## 1. Executive Summary

### Problem Statement

Solo founders must do everything themselves — research, content writing, analysis, coding. Current AI chat tools have no concept of specialized "staff" working independently; every interaction goes through one shared assistant and the user must wait for results.

### Proposed Solution

Nex Staff is a web platform that lets solo founders build a team of AI agents like real staff. Each agent has a role, skills, tools, and access to the company knowledge base. The user talks to the Assistant — the Assistant hires, delegates, and coordinates work without blocking the user.

### Success Criteria

| KPI                 | Target                                                   |
| ------------------- | -------------------------------------------------------- |
| Time-to-first-hire  | User hires first agent within < 5 minutes after onboarding |
| Delegation accuracy | Assistant delegates to correct staff ≥ 90% when a matching agent exists |
| Async completion    | Hired agent completes task without user waiting            |
| Time-to-deliverable | First deliverable within < 10 minutes after delegation   |

---

## 2. User Experience & Functionality

### User Personas

**Solo Founder**

- Has an idea or a project in progress
- Needs a virtual "team": research, content writing, data analysis, marketing, coding
- No time to manage many separate AI tools
- Prefers natural chat over a complex dashboard

### User Stories

| ID    | Story                                                                                 | Acceptance Criteria                                                                 |
| ----- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| US-01 | As a new user, I meet the Assistant right after login to start talking about my project | Assistant auto-created; greeting message appears within < 2s after login            |
| US-02 | As a user, I upload documents (PDF, MD, URL) and the Assistant stores and retrieves them | Upload via chat; file stored in Blob; `search_documents` returns cited results      |
| US-03 | As a user, I say "I need someone to write a blog" and the Assistant proposes hiring a Content Writer | Assistant detects intent; proposes specific role if no matching staff exists |
| US-04 | As a user, I confirm hire and the Assistant asks for requirements, skills, and tone     | Hire flow via chat (no form); at least 2–3 clarifying questions before creating staff |
| US-05 | As a user, I assign work to the Assistant and it delegates to the right agent        | Task created; progress tracked via `task_event`; user can ask for status anytime    |
| US-10 | As a user, I ask "How far along is Alex?" and the Assistant reports specific progress | `check_task_status` returns progressPercent, currentStep, preview excerpt           |
| US-11 | As a user, I am notified as soon as staff complete work                              | SSE + notification queue; desk `!` emote; Assistant cutscene when notification pending |
| US-06 | As a user, I keep chatting while agents work in the background                       | Assistant response does not block; user can send new messages immediately           |
| US-07 | As a user, I receive notification when an agent finishes work                        | SSE triggers cutscene: staff NPC walk-in + dialogue "done" + choice [View result] |
| US-08 | As a user, I review task history and deliverables per staff member                   | Task Board on workspace; click desk for history; Archive Room for documents         |
| US-09 | As a user, I explore the workspace and see what staff are doing                      | Top-down office view; desk states idle/working/done; click zones to interact        |
| US-12 | As a user, the Assistant reports meaningful milestones (not just %)                    | Assistant creates checkpoints when delegating; verify via `verify_checkpoint`; progress by checkpoint |
| US-13 | As a user, I assign complex work needing multiple staff and the Assistant coordinates  | Multi-worker task_group; dependency chain; Assistant reports overall via `list_active_tasks` |
| US-14 | As a user, I talk to the Assistant by voice in the dialogue overlay                   | Push-to-talk STT → text message; optional NPC TTS; transcript in chat log — [VOICE-CHAT.md](VOICE-CHAT.md) |

### Non-Goals (MVP)

- Multi-user workspace / team collaboration
- Public agent marketplace
- Billing / subscription
- Mobile native app
- ~~Voice interface~~ → deferred to Phase 2+ ([VOICE-CHAT.md](VOICE-CHAT.md))
- Rate limiting / usage quotas (deferred — ship without, add when scaling)

---

## 3. AI System Requirements

### Assistant Tools

| Tool                | Description                                 |
| ------------------- | ------------------------------------------- |
| `search_documents`  | RAG query on company documents (pgvector)   |
| `create_document`   | Create new document from agent-generated content |
| `web_research`      | Search + summarize from the internet        |
| `hire_staff`        | Create new staff profile in DB              |
| `delegate_task`     | Create task + `start(staffTaskWorkflow)`    |
| `list_staff`        | Return user's staff roster                  |
| `check_task_status` | Status + progress + preview for one task    |
| `list_active_tasks` | Running tasks + recently completed, undelivered |
| `get_task_events`   | Detailed event log                          |
| `get_task_preview`  | Draft output snapshot                       |
| `get_deliverable`   | Fetch completed work                        |
| `verify_checkpoint` | Verify planned checkpoint vs evidence       |
| `review_deliverable`| Score deliverable vs acceptanceCriteria     |
| `revise_task`       | Send feedback / spawn revision task         |
| `list_queued_tasks` | Pending backlog per staff                   |

### Evaluation Strategy

- **Benchmark**: 20 hire + delegate scenarios (5 new hires, 10 delegate to existing, 5 edge cases)
- **Routing accuracy**: ≥ 90% correct delegation or appropriate hire proposal
- **Deliverable quality**: Human eval on 10 deliverables — ≥ 7/10 usable without major edits
- **Checkpoint pass rate**: ≥ 85% checkpoints verified on first attempt (Phase 1.5)
- **Latency**: Assistant first token < 1s; task notification < 30s after workflow complete

Details on metrics, test types, eval harness: [EVAL-FRAMEWORK.md](EVAL-FRAMEWORK.md)

---

## 4. Technical Specifications

### Architecture Overview

- **Sync layer**: `ToolLoopAgent` for Assistant — real-time streaming
- **Async layer**: `DurableAgent` in Vercel Workflow for staff tasks
- **Sandbox**: Vercel Sandbox per-task when `staff.useSandbox === true`
- **Data**: Neon Postgres + pgvector; Vercel Blob for files

Details: [ARCHITECTURE.md](ARCHITECTURE.md)

### Integration Points

| Service           | Purpose                          |
| ----------------- | -------------------------------- |
| Vercel AI Gateway | Multi-provider model routing     |
| Neon Postgres     | Primary database + vector search |
| Vercel Blob       | Document storage                 |
| Vercel Workflow   | Durable async task execution     |
| Vercel Sandbox    | Isolated file/shell execution    |
| Better Auth       | Google OAuth authentication      |

### Security & Privacy

- Staff and documents scoped per `userId` — no cross-tenant access
- Sandbox isolated per task, destroyed after completion
- OAuth tokens encrypted at rest (Better Auth)
- Documents not shared between users
- API routes require authenticated session

---

## 5. Risks & Roadmap

### Phased Rollout

| Phase    | Scope                                   | Timeline  |
| -------- | --------------------------------------- | --------- |
| Phase 0  | Foundation: auth, chat, basic assistant | 2 weeks   |
| Phase 1  | MVP: hire, delegate, async, 8-bit UI    | 3–4 weeks |
| Phase 1.5| Supervision: checkpoints, multi-worker  | 1–2 weeks |
| Phase 2  | v1.0: RAG, task history, slash commands | 3 weeks   |
| Phase 3+ | Custom staff, MCP, HarnessAgent         | Future    |

Details: [ROADMAP.md](ROADMAP.md)

### Technical Risks

| Risk                        | Mitigation                                           |
| --------------------------- | ---------------------------------------------------- |
| Sandbox cold start (10–30s) | Pixel "staff preparing..." animation                 |
| LLM cost per task           | `maxSteps` limit; destroy sandbox after task complete |
| RAG hallucination           | Citation required; chunking eval benchmark           |
| AI SDK 7 experimental APIs  | Pin versions; monitor changelog                      |
