import type { SDKMessage } from "@cursor/sdk";
import type { ProgressInput } from "@/lib/tasks/types";

function statusProgressPercent(
  status: SDKMessage & { type: "status" }
): number | undefined {
  switch (status.status) {
    case "CREATING":
      return 5;
    case "RUNNING":
      return 20;
    case "FINISHED":
      return 95;
    default:
      return;
  }
}

function statusLabel(message: SDKMessage & { type: "status" }): string {
  if (message.status === "CREATING") {
    return "Preparing cloud workspace...";
  }

  if (message.status === "RUNNING") {
    return "Coding...";
  }

  return message.message ?? message.status;
}

export function mapCursorMessageToProgress(
  message: SDKMessage
): ProgressInput | null {
  if (message.type === "status") {
    return {
      type:
        message.status === "CREATING"
          ? "sandbox.creating"
          : "agent.step_started",
      label: statusLabel(message),
      progressPercent: statusProgressPercent(message),
      payload: { cursorStatus: message.status },
    };
  }

  if (message.type === "tool_call") {
    return {
      type: "agent.tool_called",
      label: message.name,
      payload: {
        toolName: message.name,
        toolCallId: message.call_id,
        status: message.status,
      },
    };
  }

  if (message.type === "assistant") {
    const text = message.message.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    if (!text) {
      return null;
    }

    return {
      type: "agent.text_delta",
      label: "Writing update...",
      payload: { length: text.length, text },
    };
  }

  return null;
}
