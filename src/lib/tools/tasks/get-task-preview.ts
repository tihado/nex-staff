import { tool } from "ai";
import { z } from "zod";
import { runToolSafely } from "@/lib/assistant/errors";
import { getTaskPreviewRecord } from "@/lib/tasks/service";
import { taskToolContextSchema } from "@/lib/tools/tasks/context";

export const getTaskPreviewTool = tool({
  description: "Get partial/draft output from a running task.",
  inputSchema: z.object({
    taskId: z.string().uuid(),
  }),
  contextSchema: taskToolContextSchema,
  execute: async ({ taskId }, { context }) =>
    runToolSafely("get_task_preview", async () => {
      const preview = await getTaskPreviewRecord(context.userId, taskId);

      if (!preview) {
        return {
          taskId,
          hasPreview: false,
          content: null,
          excerpt: null,
        };
      }

      return {
        taskId,
        hasPreview: preview.content.trim().length > 0,
        content: preview.content,
        excerpt: preview.excerpt,
        updatedAt: preview.updatedAt,
      };
    }),
});
