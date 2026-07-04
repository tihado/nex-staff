import { tool } from "ai";
import { z } from "zod";
import { TaskDispatchError, TaskValidationError } from "@/lib/tasks/errors";
import { delegateTask } from "@/lib/tasks/service";
import { delegateTaskToolInputSchema } from "@/lib/tasks/validation";

export const taskToolContextSchema = z.object({
  chatId: z.string().uuid().optional(),
  userId: z.string().uuid(),
});

export const delegateTaskTool = tool({
  description:
    "Delegate a task to a staff member. They will work in the background.",
  inputSchema: delegateTaskToolInputSchema,
  contextSchema: taskToolContextSchema,
  execute: async (input, { context }) => {
    try {
      return await delegateTask(context.userId, {
        ...input,
        chatId: context.chatId,
      });
    } catch (error) {
      if (
        error instanceof TaskValidationError ||
        error instanceof TaskDispatchError
      ) {
        throw new Error(error.message);
      }

      throw error;
    }
  },
});
