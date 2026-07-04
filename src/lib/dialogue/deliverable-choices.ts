import type { AssistantUIMessage } from "@/lib/agents/assistant";
import { DELIVERABLE_TOOL_CHOICES } from "@/lib/dialogue/completion-choices";
import type { DialogueChoice } from "@/lib/dialogue/types";

interface ToolPartLike {
  output?: unknown;
  state?: string;
  type: string;
}

function readTaskIdFromOutput(output: unknown): string | undefined {
  if (!output || typeof output !== "object") {
    return;
  }

  const taskId = (output as { taskId?: unknown }).taskId;

  if (typeof taskId === "string" && taskId.length > 0) {
    return taskId;
  }

  return;
}

export function extractDeliverableToolChoices(
  message: AssistantUIMessage | undefined
): DialogueChoice[] {
  if (!message) {
    return [];
  }

  const part = (message.parts as ToolPartLike[]).find(
    (entry) =>
      entry.type === "tool-get_deliverable" &&
      entry.state === "output-available"
  );

  if (!part) {
    return [];
  }

  const taskId = readTaskIdFromOutput(part.output);

  if (!taskId) {
    return [];
  }

  return DELIVERABLE_TOOL_CHOICES;
}

export function readDeliverableTaskIdFromMessage(
  message: AssistantUIMessage | undefined
): string | undefined {
  if (!message) {
    return;
  }

  const part = (message.parts as ToolPartLike[]).find(
    (entry) =>
      entry.type === "tool-get_deliverable" &&
      entry.state === "output-available"
  );

  if (!part) {
    return;
  }

  return readTaskIdFromOutput(part.output);
}
