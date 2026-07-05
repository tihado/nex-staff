# Nex Staff

**Hire AI staff for your project.**

Nex Staff is a web-based platform for solo founders — chat with an Assistant, hire specialized agents as staff, and delegate work for them to complete independently in the background.

## Concept

```
You (Boss)
    │
    ▼
Assistant ──► chat, save documents, research
    │
    ├── hire ──► New staff (Writer, Researcher, Analyst...)
    │
    └── delegate ──► Staff work async (no waiting)
                        │
                        ▼
                   Deliverable + notification
```

## Key features

- **Assistant agent** — single entry point: chat about your project, upload documents, search, research
- **Hire staff** — Assistant proposes and hires specialized agents on demand
- **Delegate async** — assign work and keep chatting while staff work in the background
- **Company knowledge** — documents stored and retrieved via RAG
- **Workspace** — pixel office floor: staff desks, Archive Room, task board
- **NPC dialogue** — RPG-style conversation when clicking an agent (overlay on workspace)
- **8-bit UI** — unified design system (pixel fonts, panels, not a chat-app UI)

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

## Documentation

| Document                             | Description                                   |
| ------------------------------------ | --------------------------------------------- |
| [PRD](docs/PRD.md)                   | Product Requirements Document                 |
| [Architecture](docs/ARCHITECTURE.md) | Technical architecture                        |
| [Agent System](docs/AGENT-SYSTEM.md) | Hiring, delegation, supervision, checkpoints |
| [Eval Framework](docs/EVAL-FRAMEWORK.md) | Worker quality metrics, tests, eval harness |
| [Data Model](docs/DATA-MODEL.md)     | Database schema                               |
| [API](docs/API.md)                   | REST endpoints, tools, events                 |
| [UI/UX](docs/UI-UX.md)               | Workspace tilemap + NPC dialogue 8-bit          |
| [Voice Chat](docs/VOICE-CHAT.md)     | Voice STT/TTS plan for RPG dialogue (Phase 2+)  |
| [Roadmap](docs/ROADMAP.md)           | MVP → v2 roadmap                              |

## Status

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
- `BETTER_AUTH_URL` (optional on Vercel — auto-detected from `VERCEL_URL`)
- `BLOB_READ_WRITE_TOKEN`
- `GOOGLE_GENERATIVE_AI_API_KEY`

Enable **Sandbox OIDC** in the Vercel project settings so `@ai-sdk/sandbox-vercel` can authenticate in preview/production. Verify with `GET /api/staging/sandbox-oidc` after deploy (remove that route once confirmed).

For **local development**, set `SANDBOX_DISABLED=true` in `.env.local` so staff tasks use an in-memory workspace instead of Vercel Sandbox (no OIDC required). Delegate a task to a Writer staff member to exercise the full `staffTaskWorkflow` + `DurableAgent` path.

| Command | Purpose |
| ------- | ------- |
| `pnpm exec tsx scripts/test-delegate-workflow.ts` | Sign in, delegate to staff, poll task status (local smoke test) |

## Audience

Solo founders — one person managing multiple AI agents as a virtual staff team.
