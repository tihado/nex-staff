import { tool } from "ai";
import { z } from "zod";
import { runToolSafely } from "@/lib/assistant/errors";
import { listTaskEvents } from "@/lib/tasks/service";
import { taskToolContextSchema } from "@/lib/tools/tasks/context";

export const getTaskEventsTool = tool({
  description: "Get detailed event log for a task.",
  inputSchema: z.object({
    taskId: z.string().uuid(),
    limit: z
      .number()
      .int()
      .positive()
      .max(100)
      .optional()
      .describe("Maximum number of events to return"),
  }),
  contextSchema: taskToolContextSchema,
  execute: async ({ taskId, limit }, { context }) =>
    runToolSafely("get_task_events", async () => {
      const result = await listTaskEvents(context.userId, taskId, { limit });

      return {
        taskId,
        events: result.events,
        nextCursor: result.nextCursor,
      };
    }),
});
