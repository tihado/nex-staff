# Eval Framework — Nex Staff

This document answers: **how do we evaluate worker agent quality?** — metrics, test types, and eval harness structure.

Related: [PRD.md § Evaluation Strategy](PRD.md), [ROADMAP.md § Success Metrics](ROADMAP.md), [AGENT-SYSTEM.md § Supervision](AGENT-SYSTEM.md).

---

## Mapping to existing docs

| Component | Source file | Evaluation scope |
|-----------|-------------|------------------|
| **Routing accuracy** ≥ 90% | PRD, ROADMAP | Assistant picks correct staff — does **not** measure worker output |
| **Deliverable quality** ≥ 7/10 human eval | PRD | **Final output** quality |
| **Task completion rate** ≥ 80% | ROADMAP Phase 2 | Worker **reliability** |
| **RAG citation accuracy** ≥ 85% | ROADMAP Phase 2 | **Tool usage** quality (research staff) |
| **20-scenario benchmark** | PRD, ROADMAP risks | End-to-end test suite for Assistant + worker |
| **Latency KPIs** | PRD | first token < 1s; notification < 30s |

This doc adds **per-staff metrics**, **detailed test types**, and **eval harness structure** — not yet covered in PRD/ROADMAP.

---

## Three evaluation layers

```mermaid
flowchart TB
    subgraph L1 [Layer 1 — Routing]
        R[Routing eval]
    end
    subgraph L2 [Layer 2 — Execution]
        C[Checkpoint pass rate]
        T[Tool error rate]
        CR[Completion rate]
    end
    subgraph L3 [Layer 3 — Output]
        D[Deliverable eval]
        RV[review_deliverable]
    end
    R --> C
    C --> D
    D --> RV
```

| Layer | Question | When to run |
|-------|----------|-------------|
| **Routing** | Does Assistant delegate to the correct staff? | On every delegate; CI routing suite |
| **Execution** | Does the worker complete the process correctly? | While task runs (checkpoints) + after task |
| **Output** | Is the deliverable usable? | After `workflow.completed` |

---

## A. Per-staff metrics (per-staff dashboard)

Aggregated from DB + eval harness. Displayed on `/staff` or internal admin (Phase 2+).

| Metric | Formula | Data source |
|--------|---------|-------------|
| `completion_rate` | `completed / (completed + failed)` | `task.status` WHERE `staff_id` |
| `avg_duration_ms` | `AVG(completedAt - startedAt)` | `task` |
| `retry_rate` | tasks with `metadata.retryCount > 0` / total | `task.metadata` |
| `deliverable_score` | LLM-judge or human rubric 1–10 | eval harness / `review_deliverable` |
| `checkpoint_pass_rate` | checkpoints `verified` / total checkpoints | `task_checkpoint` |
| `tool_error_rate` | `agent.tool_result` with error / total tool calls | `task_event` |
| `routing_accuracy` | correct staff delegated / total scenarios | eval harness routing runner |

**Reference targets** (from PRD/ROADMAP):

| Metric | Target | Phase |
|--------|--------|-------|
| Routing accuracy | ≥ 90% | 1 |
| Deliverable score (human) | ≥ 7/10 | 1 |
| Task completion rate | ≥ 80% | 2 |
| RAG citation accuracy | ≥ 85% | 2 |
| Checkpoint pass rate | ≥ 85% | 1.5 |

---

## B. Test types

### 1. Routing eval

**Purpose:** Assistant picks the correct staff or suggests an appropriate hire.

**Input:** User message + existing roster (mock DB).

**Assert:**
- `delegate_task.staffId` matches expected role, or
- `hire_staff.role` matches expected role when roster is empty

**Scenarios:** 20 PRD scenarios — 5 new hires, 10 delegate existing, 5 edge cases.

Example scenario YAML:

```yaml
id: routing-01
userMessage: "Write an 800-word blog post about AI agents for startup founders"
roster:
  - { name: Alex, role: Content Writer, status: idle }
expected:
  action: delegate_task
  staffRole: Content Writer
```

### 2. Deliverable eval

**Purpose:** Output is usable without major edits.

**Rubric dimensions** (1–10 per dimension, weighted average):

| Dimension | Weight | Description |
|-----------|--------|-------------|
| Relevance | 30% | Answers the brief correctly |
| Completeness | 25% | Meets required content |
| Tone | 15% | Matches tone in brief/metadata |
| Citations | 20% | Research tasks: valid sources present |
| Format | 10% | Markdown/structure meets requirements |

**Pass threshold:** weighted score ≥ 7.0 (matches PRD).

**Methods:**
- **LLM-as-judge** — automated in CI (fast, noisy)
- **Human spot-check** — 10% sample each sprint (ground truth)

Detailed rubrics: `eval/rubrics/` (see § C).

### 3. Regression eval

**Purpose:** Staff does not drift after prompt/model changes.

**Golden tasks:** 5–10 fixed briefs per staff template, re-run after each deploy.

**Assert:** `deliverable_score` does not drop > 1 point vs baseline snapshot.

### 4. Tool eval

**Purpose:** RAG/sandbox tools work correctly.

**Example RAG test:**
- Seed mock document with known facts
- Delegate research task
- Assert deliverable cites document ID + fact matches

**Example sandbox test:**
- Delegate analyst task with CSV fixture
- Assert output file exists + chart generated

### 5. Integration eval

**Purpose:** Full workflow hire → delegate → deliver.

**Trigger:** CI nightly against Vercel preview.

**Flow:**
1. Create test user + Assistant
2. Run hire scenario (if needed)
3. Delegate + poll `check_task_status` until terminal
4. Run deliverable eval + checkpoint pass rate assert

---

## C. Eval harness (design)

Not yet implemented — proposed structure:

```
eval/
  scenarios/
    routing/           # YAML: user message, roster, expected action
    deliverable/       # YAML: brief, staff template, rubric ref
    integration/       # YAML: full E2E flows
  runners/
    routing.ts         # assert delegate target
    deliverable.ts     # LLM-as-judge + score aggregation
    integration.ts     # poll task + run deliverable eval
  rubrics/
    blog-post.md       # scoring criteria for Content Writer
    research-report.md # scoring criteria for Researcher
    data-analysis.md   # scoring criteria for Analyst
  fixtures/
    documents/         # mock PDFs/MD for RAG tests
    csv/               # sample data for Analyst
  baseline/
    golden-scores.json # regression baseline per scenario
```

### Runner interface (sketch)

```typescript
interface EvalScenario {
  id: string;
  type: "routing" | "deliverable" | "integration";
  input: Record<string, unknown>;
  expected: Record<string, unknown>;
  rubric?: string; // path to rubrics/*.md
}

interface EvalResult {
  scenarioId: string;
  passed: boolean;
  score?: number;
  details: Record<string, unknown>;
}
```

### CI integration

| Job | Trigger | Scenarios |
|-----|---------|-----------|
| `eval:routing` | Every PR | 20 routing scenarios (mock, no LLM worker) |
| `eval:deliverable` | Nightly | 5 deliverable scenarios (full worker run) |
| `eval:regression` | Pre-release | Golden tasks vs baseline |

---

## D. Sample rubrics

### blog-post.md (Content Writer)

```markdown
# Blog Post Rubric

## Relevance (30%)
- [ ] Addresses the topic in the brief
- [ ] Target audience appropriate
- [ ] No major off-topic sections

## Completeness (25%)
- [ ] Meets word count if specified
- [ ] Has intro, body, conclusion
- [ ] Covers key points from brief

## Tone (15%)
- [ ] Matches requested tone (casual/formal/technical)

## Format (10%)
- [ ] Valid markdown
- [ ] Headings hierarchy sensible
- [ ] No broken formatting

Score: average of dimension scores (1-10 each).
Pass: ≥ 7.0 weighted.
```

---

## E. Link to Supervision Loop

Assistant evaluates workers **at runtime** via tools (not just offline eval):

| Tool | Eval layer | Doc |
|------|------------|-----|
| `verify_checkpoint` | Execution | [AGENT-SYSTEM.md § Task Checkpoints](AGENT-SYSTEM.md) |
| `review_deliverable` | Output | [AGENT-SYSTEM.md § Supervision](AGENT-SYSTEM.md) |
| `check_task_status` | Execution (observability) | [AGENT-SYSTEM.md § Task Observability](AGENT-SYSTEM.md) |

Offline eval harness (this doc) adds **regression + benchmark** for CI; runtime tools add **per-task quality gate**.

---

## F. Eval roadmap

| Phase | Deliverable |
|-------|-------------|
| 1 | Eval harness MVP: routing runner + 5 deliverable scenarios |
| 1.5 | Checkpoint pass rate metric; `verify_checkpoint` integration tests |
| 2 | Regression golden tasks; RAG tool eval; per-staff dashboard |
| 3 | Eval-driven "level up" — only update staff instructions when score ≥ baseline |

Timeline details: [ROADMAP.md](ROADMAP.md).

---

## Related docs

- [PRD.md](PRD.md) — Evaluation Strategy, KPIs
- [ROADMAP.md](ROADMAP.md) — Success metrics by phase
- [AGENT-SYSTEM.md](AGENT-SYSTEM.md) — Supervision, checkpoints
- [API.md](API.md) — `review_deliverable`, `verify_checkpoint` tool specs
