# Nex Staff

**Tuyển dụng AI nhân viên cho dự án của bạn.**

Nex Staff là nền tảng web-based cho solo founder — nơi bạn trò chuyện với một Assistant, tuyển dụng các agent chuyên biệt như nhân viên, và giao việc cho họ làm độc lập trong nền.

## Concept

```
Bạn (Boss)
    │
    ▼
Assistant ──► trò chuyện, lưu tài liệu, research
    │
    ├── hire ──► Staff mới (Writer, Researcher, Analyst...)
    │
    └── delegate ──► Staff làm việc async (không cần chờ)
                        │
                        ▼
                   Deliverable + thông báo
```

## Tính năng chính

- **Assistant agent** — cửa ngõ duy nhất: chat về dự án, upload tài liệu, tra cứu, research
- **Hire staff** — Assistant đề xuất và tuyển agent chuyên biệt theo nhu cầu
- **Delegate async** — giao việc, tiếp tục chat trong khi nhân viên làm nền
- **Company knowledge** — tài liệu được lưu trữ và tra cứu qua RAG
- **Workspace** — sàn làm việc pixel: bàn staff, phòng lưu tài liệu, task board
- **NPC dialogue** — hội thoại kiểu RPG khi click vào agent (overlay trên workspace)

## Tech Stack

| Layer           | Technology                                 |
| --------------- | ------------------------------------------ |
| Frontend        | Next.js 16, React 19, Tailwind CSS v4      |
| Agent framework | AI SDK 7 (`ToolLoopAgent`, `DurableAgent`) |
| Async execution | Vercel Workflow                            |
| Sandbox         | Vercel Sandbox (`@ai-sdk/sandbox-vercel`)  |
| Database        | Neon Postgres + Drizzle ORM + pgvector     |
| Auth            | Better Auth (Google OAuth)                 |
| Storage         | Vercel Blob                                |

## Tài liệu

| Tài liệu                             | Mô tả                                         |
| ------------------------------------ | --------------------------------------------- |
| [PRD](docs/PRD.md)                   | Product Requirements Document                 |
| [Architecture](docs/ARCHITECTURE.md) | Kiến trúc kỹ thuật                            |
| [Agent System](docs/AGENT-SYSTEM.md) | Hiring, delegation, supervision, checkpoints |
| [Eval Framework](docs/EVAL-FRAMEWORK.md) | Worker quality metrics, tests, eval harness |
| [Data Model](docs/DATA-MODEL.md)     | Database schema                               |
| [API](docs/API.md)                   | REST endpoints, tools, events                 |
| [UI/UX](docs/UI-UX.md)               | Workspace tilemap + NPC dialogue 8-bit          |
| [Roadmap](docs/ROADMAP.md)           | Lộ trình MVP → v2                             |

## Trạng thái

**Planning** — dự án đang ở giai đoạn thiết kế. Chưa có implementation.

## Đối tượng

Solo founder — một người quản lý nhiều AI agent như đội ngũ nhân viên ảo.
