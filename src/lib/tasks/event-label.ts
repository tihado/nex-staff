import type { TaskEventRecord, TaskStatus } from "@/lib/tasks/types";

const HIDDEN_EVENT_TYPES = new Set(["agent.text_delta"]);

const TECHNICAL_LABEL_RE =
  /\.(py|ts|tsx|js|json)["']|\[[\w'"]+\]|\/Users\/|result_final|tool_call|__pycache__|node_modules/i;

const MILESTONE_EVENT_TYPES = new Set([
  "workflow.started",
  "sandbox.creating",
  "sandbox.created",
  "agent.step_completed",
  "deliverable.saved",
  "workflow.completed",
  "workflow.failed",
  "workflow.cancelled",
]);

export function shouldShowTaskEvent(type: string): boolean {
  return !HIDDEN_EVENT_TYPES.has(type);
}

export function formatTaskStatusLabel(status: TaskStatus): string {
  switch (status) {
    case "pending":
      return "Queued";
    case "running":
      return "In Progress";
    case "completed":
      return "Complete";
    case "failed":
      return "Failed";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

function isTechnicalLabel(label: string): boolean {
  const trimmed = label.trim();

  if (trimmed.length === 0) {
    return true;
  }

  if (trimmed.length > 96) {
    return true;
  }

  return TECHNICAL_LABEL_RE.test(trimmed);
}

export function isUserFacingQuestEvent(event: TaskEventRecord): boolean {
  if (!shouldShowTaskEvent(event.type)) {
    return false;
  }

  const label = event.payload.label;

  if (typeof label === "string" && label.trim()) {
    return !isTechnicalLabel(label);
  }

  return (
    MILESTONE_EVENT_TYPES.has(event.type) ||
    event.type === "agent.step_started" ||
    event.type === "agent.tool_called"
  );
}

export function buildQuestLogEvents(
  events: TaskEventRecord[],
  maxEntries = 10
): TaskEventRecord[] {
  const userFacing = events.filter(isUserFacingQuestEvent);
  const deduped: TaskEventRecord[] = [];

  for (const event of userFacing) {
    const label = formatTaskEventLabel(event);
    const previous = deduped.at(-1);

    if (previous && formatTaskEventLabel(previous) === label) {
      continue;
    }

    deduped.push(event);
  }

  return deduped.slice(-maxEntries);
}

export function formatTaskEventLabel(event: TaskEventRecord): string {
  const label = event.payload.label;

  if (typeof label === "string" && label.trim() && !isTechnicalLabel(label)) {
    return label;
  }

  switch (event.type) {
    case "workflow.started":
      return "Quest accepted";
    case "sandbox.creating":
      return "Preparing workspace…";
    case "sandbox.created":
      return "Workspace ready";
    case "agent.step_started":
      return "Working on next step…";
    case "agent.tool_called": {
      const toolName = event.payload.toolName;
      return typeof toolName === "string"
        ? `Using ${toolName.replaceAll("_", " ")}`
        : "Running a tool";
    }
    case "agent.step_completed":
      return "Step complete";
    case "deliverable.saved":
      return "Deliverable secured";
    case "workflow.completed":
      return "Quest complete!";
    case "workflow.failed":
      return "Quest failed";
    case "workflow.cancelled":
      return "Quest cancelled";
    default:
      return event.type;
  }
}
