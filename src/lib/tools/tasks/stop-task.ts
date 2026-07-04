import { tool } from "ai";
import { z } from "zod";
import { TaskCancelError, TaskNotFoundError } from "@/lib/tasks/errors";
import { cancelTaskForUser } from "@/lib/tasks/service";
import { taskToolContextSchema } from "@/lib/tools/tasks/delegate-task";

export const stopTaskTool = tool({
  description:
    "Stop and cancel a pending or running delegated task. Confirm with the user before calling unless they explicitly asked to stop it.",
  inputSchema: z.object({
    taskId: z.string().uuid(),
    reason: z.string().optional(),
  }),
  contextSchema: taskToolContextSchema,
  execute: async ({ taskId, reason }, { context }) => {
    try {
      return await cancelTaskForUser(context.userId, taskId, reason);
    } catch (error) {
      if (
        error instanceof TaskCancelError ||
        error instanceof TaskNotFoundError
      ) {
        throw new Error(error.message);
      }

      throw error;
    }
  },
});
