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
- **8-bit UI** — design system thống nhất (pixel fonts, panels, không chat app UI)

## Tech Stack

| Layer           | Technology                                 |
| --------------- | ------------------------------------------ |
| Frontend        | Next.js 16, React 19, Tailwind CSS v4      |
| Agent framework | AI SDK 7 (`ToolLoopAgent`, `DurableAgent`) |
| Async execution | Vercel Workflow                            |
| Sandbox         | Vercel Sandbox (`@ai-sdk/sandbox-vercel`)  |
| Model provider  | Google Gemini (`@ai-sdk/google`)           |
| Database        | Neon Postgres + Drizzle ORM + pgvector     |
| Auth            | Better Auth (email/password; Google OAuth later) |
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

**Foundation (issue #3)** — auth, database schema, health check, and Vercel deploy scaffolding are in place. Workplace UI and agent features follow in later issues.

## Local setup

1. Copy env template and fill in values:

```bash
cp .env.example .env.local
```

2. Create a [Neon](https://neon.tech) Postgres database and set `DATABASE_URL`.

3. Generate a random `BETTER_AUTH_SECRET` (32+ characters).

4. Add a [Google AI Studio](https://aistudio.google.com/apikey) API key as `GOOGLE_GENERATIVE_AI_API_KEY`.

5. Push the schema to Neon:

```bash
pnpm db:push
```

6. Start the dev server:

```bash
pnpm dev
```

Open `http://localhost:3000`, sign up or sign in with email/password, and confirm the placeholder home page shows your user and Assistant IDs.

### Useful commands

| Command | Purpose |
| ------- | ------- |
| `pnpm db:generate` | Generate SQL migrations from `src/db/schema.ts` |
| `pnpm db:migrate` | Apply migrations |
| `pnpm db:push` | Push schema directly (dev) |
| `pnpm db:seed` | Verify database connectivity |

### Health check

`GET /api/health` returns `{ ok: true, db: true }` when the app and database are reachable.

### Vercel deploy

Set these environment variables on Vercel:

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL` (production URL)
- `BLOB_READ_WRITE_TOKEN`
- `GOOGLE_GENERATIVE_AI_API_KEY`

Enable **Sandbox OIDC** in the Vercel project settings so `@ai-sdk/sandbox-vercel` can authenticate in preview/production. Verify with `GET /api/staging/sandbox-oidc` after deploy (remove that route once confirmed).

## Đối tượng

Solo founder — một người quản lý nhiều AI agent như đội ngũ nhân viên ảo.
