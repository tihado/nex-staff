import type { TaskEventRecord } from "@/lib/tasks/types";

const HIDDEN_EVENT_TYPES = new Set(["agent.text_delta"]);

export function shouldShowTaskEvent(type: string): boolean {
  return !HIDDEN_EVENT_TYPES.has(type);
}

export function formatTaskEventLabel(event: TaskEventRecord): string {
  const label = event.payload.label;

  if (typeof label === "string" && label.trim()) {
    return label;
  }

  switch (event.type) {
    case "workflow.started":
      return "Workflow started";
    case "sandbox.creating":
      return "Creating sandbox";
    case "sandbox.created":
      return "Sandbox ready";
    case "agent.step_started":
      return "Step started";
    case "agent.tool_called": {
      const toolName = event.payload.toolName;
      return typeof toolName === "string" ? `Tool: ${toolName}` : "Tool called";
    }
    case "agent.step_completed":
      return "Step completed";
    case "deliverable.saved":
      return "Deliverable saved";
    case "workflow.completed":
      return "Task completed";
    case "workflow.failed":
      return "Task failed";
    case "workflow.cancelled":
      return "Task cancelled";
    default:
      return event.type;
  }
}
