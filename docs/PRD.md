# Product Requirements Document — Nex Staff

## 1. Executive Summary

### Problem Statement

Solo founder phải tự làm mọi thứ — research, viết content, phân tích, coding. Các AI chat tool hiện tại không có khái niệm "nhân viên chuyên biệt" làm việc độc lập; mọi tương tác đều qua một assistant chung và user phải chờ kết quả.

### Proposed Solution

Nex Staff là nền tảng web cho phép solo founder tạo đội ngũ AI agents như nhân viên thật. Mỗi agent có role, skills, tools, và access tới company knowledge base. User trò chuyện với Assistant — Assistant hire, delegate, và điều phối công việc mà không block user.

### Success Criteria

| KPI                 | Target                                                   |
| ------------------- | -------------------------------------------------------- |
| Time-to-first-hire  | User hire agent đầu tiên trong < 5 phút sau onboarding   |
| Delegation accuracy | Assistant delegate đúng staff ≥ 90% khi có agent phù hợp |
| Async completion    | Hired agent hoàn thành task mà user không cần chờ        |
| Time-to-deliverable | Deliverable đầu tiên trong < 10 phút sau khi giao việc   |

---

## 2. User Experience & Functionality

### User Personas

**Solo Founder**

- Có ý tưởng hoặc dự án đang chạy
- Cần "đội ngũ" ảo: research, viết content, phân tích data, marketing, coding
- Không có thời gian quản lý nhiều tool AI riêng lẻ
- Thích giao tiếp tự nhiên qua chat hơn dashboard phức tạp

### User Stories

| ID    | Story                                                                                 | Acceptance Criteria                                                                 |
| ----- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| US-01 | Là user mới, tôi được gặp Assistant ngay khi đăng nhập để bắt đầu trò chuyện về dự án | Assistant tự động tạo; greeting message hiện trong < 2s sau login                   |
| US-02 | Là user, tôi upload tài liệu (PDF, MD, URL) và Assistant lưu trữ + tra cứu được       | Upload qua chat; file lưu Blob; `search_documents` trả kết quả có citation          |
| US-03 | Là user, tôi nói "tôi cần ai đó viết blog" và Assistant đề xuất hire Content Writer   | Assistant nhận diện intent; đề xuất role cụ thể nếu chưa có staff phù hợp           |
| US-04 | Là user, tôi xác nhận hire và Assistant hỏi thêm yêu cầu, skills, tone                | Hire flow qua chat (không form); tối thiểu 2-3 câu hỏi clarify trước khi tạo staff  |
| US-05 | Là user, tôi giao việc cho Assistant và nó delegate cho agent phù hợp                 | Task được tạo; `workflow_run_id` assigned; user nhận confirmation ngay              |
| US-06 | Là user, tôi tiếp tục chat trong khi agent đang làm việc nền                          | Assistant response không block; user có thể gửi message mới ngay                    |
| US-07 | Là user, tôi nhận thông báo khi agent hoàn thành công việc                            | SSE trigger cutscene: staff NPC walk-in + dialogue "đã xong" + choice [Xem kết quả] |
| US-08 | Là user, tôi xem lại lịch sử công việc và deliverables của từng nhân viên             | Task Board trên workspace; click desk xem history; Archive Room cho documents        |
| US-09 | Là user, tôi khám phá workspace và thấy staff đang làm gì                               | Top-down office view; desk states idle/working/done; click zone để tương tác         |

### Non-Goals (MVP)

- Multi-user workspace / team collaboration
- Marketplace agent công khai
- Billing / subscription
- Mobile native app
- Voice interface
- Rate limiting / usage quotas (deferred — ship without, add when scaling)

---

## 3. AI System Requirements

### Assistant Tools

| Tool                | Mô tả                                       |
| ------------------- | ------------------------------------------- |
| `search_documents`  | RAG query trên company documents (pgvector) |
| `create_document`   | Tạo tài liệu mới từ nội dung agent generate |
| `web_research`      | Search + summarize từ internet              |
| `hire_staff`        | Tạo staff profile mới trong DB              |
| `delegate_task`     | Tạo task + `start(staffTaskWorkflow)`       |
| `list_staff`        | Trả về roster staff của user                |
| `check_task_status` | Poll task status theo ID                    |
| `get_deliverable`   | Fetch completed work                        |

### Evaluation Strategy

- **Benchmark**: 20 kịch bản hire + delegate (5 hire mới, 10 delegate existing, 5 edge cases)
- **Routing accuracy**: ≥ 90% delegate đúng staff hoặc đề xuất hire phù hợp
- **Deliverable quality**: Human eval trên 10 deliverables — ≥ 7/10 usable without major edits
- **Latency**: Assistant first token < 1s; task notification < 30s sau workflow complete

---

## 4. Technical Specifications

### Architecture Overview

- **Sync layer**: `ToolLoopAgent` cho Assistant — streaming real-time
- **Async layer**: `DurableAgent` trong Vercel Workflow cho Staff tasks
- **Sandbox**: Vercel Sandbox per-task khi `staff.useSandbox === true`
- **Data**: Neon Postgres + pgvector; Vercel Blob cho files

Chi tiết: [ARCHITECTURE.md](ARCHITECTURE.md)

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

- Staff và documents scoped per `userId` — không cross-tenant access
- Sandbox isolated per task, destroyed sau khi complete
- OAuth tokens encrypted at rest (Better Auth)
- Documents không share giữa users
- API routes require authenticated session

---

## 5. Risks & Roadmap

### Phased Rollout

| Phase    | Scope                                   | Timeline  |
| -------- | --------------------------------------- | --------- |
| Phase 0  | Foundation: auth, chat, basic assistant | 2 tuần    |
| Phase 1  | MVP: hire, delegate, async, 8-bit UI    | 3-4 tuần  |
| Phase 2  | v1.0: RAG, task history, slash commands | 3 tuần    |
| Phase 3+ | Custom staff, MCP, HarnessAgent         | Tương lai |

Chi tiết: [ROADMAP.md](ROADMAP.md)

### Technical Risks

| Risk                        | Mitigation                                           |
| --------------------------- | ---------------------------------------------------- |
| Sandbox cold start (10-30s) | Pixel "staff đang chuẩn bị..." animation             |
| LLM cost per task           | `maxSteps` limit; `useSandbox: false` cho text staff |
| RAG hallucination           | Citation required; chunking eval benchmark           |
| AI SDK 7 experimental APIs  | Pin versions; monitor changelog                      |
