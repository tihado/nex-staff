import type { Run } from "@cursor/sdk";
import { mapCursorMessageToProgress } from "@/lib/cursor/map-cursor-events";
import { appendTaskPreview } from "@/lib/tasks/service";
import type { ProgressInput } from "@/lib/tasks/types";

export async function streamCursorRunProgress(input: {
  onProgress: (event: ProgressInput) => Promise<void>;
  run: Run;
  taskId: string;
}): Promise<void> {
  for await (const message of input.run.stream()) {
    const progress = mapCursorMessageToProgress(message);
    if (!progress) {
      continue;
    }

    await input.onProgress(progress);

    if (progress.type !== "agent.text_delta") {
      continue;
    }

    const text = progress.payload?.text;
    if (typeof text === "string" && text.trim()) {
      await appendTaskPreview(input.taskId, text);
    }
  }
}
