# Nex Staff

**Build a team. Ship your project. Stay in the game.**

Nex Staff is a web platform for **solo founders** who need a company-sized skill set on a one-person budget — without the grind of juggling a dozen AI tools alone.

---

## The problem

Solo founders wear every hat: product, marketing, content, research, coding, ops. Most can't afford a real team. Generic AI chat helps in the moment, but it doesn't feel like *having people* — you still wait, context-switch, and carry the mental load yourself.

That leads to a familiar spiral:

| Struggle | What it feels like |
| -------- | ------------------ |
| **No depth in every field** | You need a blog, a landing page, and a data pull — but you're strong in none of them |
| **Low budget** | Contractors and agencies are out of reach; every tool is another subscription |
| **No time** | Side project nights disappear into research rabbit holes and half-finished drafts |
| **Boredom** | The journey gets lonely and repetitive — no team energy, no wins to celebrate |

Current AI products treat you like a power user in a terminal. Nex Staff treats you like a **boss with a staff**.

---

## Who this is for

**Solo founders** — indie hackers, first-time builders, side-project operators — who:

- Have an idea or product in motion and need output across multiple disciplines
- Want to **delegate**, not prompt-engineer every task from scratch
- Prefer conversation and a sense of progress over dashboards and API keys
- Need the journey to stay **engaging**, not another tab they dread opening

---

## How we solve it

You run a **pixel office**. An **Assistant** is your coordinator — you talk about the project, upload briefs, and decide what to do next. When work needs a specialist, you **hire** staff (Writer, Researcher, Coder, …) and **delegate** tasks. Staff work **async in the background**; you keep chatting, exploring the workspace, and get notified when deliverables land.

```
You (Boss)
    │
    ▼
Assistant ──► chat, documents, research, coordination
    │
    ├── hire ──► Specialist staff join your roster
    │
    └── delegate ──► Staff work async (you don't wait)
                        │
                        ▼
                   Deliverable + notification
```

**AI agents, not one chat thread.** Each staff member has a role, tools, and access to your company knowledge. The Assistant routes work, tracks progress, and reports back — so you're managing a team, not babysitting a model.

**Documents as company memory.** Upload specs, notes, and references to the Archive Room. Staff and the Assistant pull from the same knowledge base so work stays on-brief.

**Real coding staff via Cursor SDK.** Coder staff run on [Cursor Cloud Agent](https://cursor.com) (`@cursor/sdk`) against your GitHub repo — open PRs, preview sites, ship changes without you living in the IDE.

**Quality you can trust — eval harness.** Worker output is measured, not assumed. Routing benchmarks, deliverable rubrics, and checkpoint verification ([Eval Framework](docs/EVAL-FRAMEWORK.md)) keep staff reliable as you add roles and scale delegation.

**RPG-style UX on purpose.** Workspace, desks, NPC dialogue, and quest-complete moments exist so building a company feels like a game — not another boring SaaS form.

---

## Features

| Area | What you get |
| ---- | ------------ |
| **Assistant** | Single entry point — project chat, document upload, hire/delegate orchestration |
| **Hire staff** | On-demand specialists (Writer, Researcher, Coder, …) with role-specific tools |
| **Delegate async** | Background workflows; progress on the Task Board; ask "how's Alex doing?" anytime |
| **Documents** | Archive Room + RAG — briefs and references linked to staff |
| **Coder staff** | Cursor SDK Cloud Agent on your repo; PRs and website previews when done |
| **Workspace** | Top-down pixel office — desks, idle/working/done states, Archive Room, Task Board |
| **NPC dialogue** | RPG overlay for talking to Assistant and staff (not a scrollable chat app) |
| **Eval harness** | Metrics and test runners for routing accuracy and deliverable quality |

---

## Tech (high level)

| Layer | Technology |
| ----- | ---------- |
| **Agents** | AI SDK 7 — `ToolLoopAgent` (Assistant), `DurableAgent` + Vercel Workflow (staff tasks) |
| **Coder staff** | `@cursor/sdk` Cloud Agent on `CODER_GITHUB_REPO_URL` |
| **Documents** | Vercel Blob storage + Neon Postgres / pgvector for search |
| **Harness** | Eval framework — routing scenarios, deliverable rubrics, checkpoint gates ([docs](docs/EVAL-FRAMEWORK.md)) |
| **Sandbox** | Vercel Sandbox for Writer deliverables (`@ai-sdk/sandbox-vercel`) |
| **Models** | Google Gemini (`@ai-sdk/google`) |
| **App** | Next.js 16, React 19, Tailwind CSS v4, Better Auth |

Full stack and data flow: [Architecture](docs/ARCHITECTURE.md).

---

## Documentation

| Document | Description |
| -------- | ----------- |
| [PRD](docs/PRD.md) | Product requirements and user stories |
| [Architecture](docs/ARCHITECTURE.md) | Technical architecture |
| [Agent System](docs/AGENT-SYSTEM.md) | Hiring, delegation, supervision, checkpoints |
| [Eval Framework](docs/EVAL-FRAMEWORK.md) | Worker quality metrics, tests, eval harness |
| [Data Model](docs/DATA-MODEL.md) | Database schema |
| [API](docs/API.md) | REST endpoints, tools, events |
| [UI/UX](docs/UI-UX.md) | Workspace tilemap + NPC dialogue |
| [Voice Chat](docs/VOICE-CHAT.md) | Voice STT/TTS plan (Phase 2+) |
| [Roadmap](docs/ROADMAP.md) | MVP → v2 roadmap |

---

## Status

Foundation is in place — auth, database, health check, deploy scaffolding, workplace UI, and core agent flows. See [Roadmap](docs/ROADMAP.md) for what's next.
