import { tool } from "ai";
import { z } from "zod";
import { STEER_TASK_ISSUE_URL } from "@/lib/tasks/steer-task";
import { taskToolContextSchema } from "@/lib/tools/tasks/delegate-task";

export const steerTaskTool = tool({
  description:
    "Add instructions or details to steer an in-progress delegated task. Not yet implemented — returns a placeholder response.",
  inputSchema: z.object({
    taskId: z.string().uuid(),
    detail: z.string().min(1),
  }),
  contextSchema: taskToolContextSchema,
  execute: async ({ taskId, detail }) => ({
    status: "not_implemented" as const,
    taskId,
    detail,
    message: `Steering in-progress tasks is not available yet. Tracked in ${STEER_TASK_ISSUE_URL}.`,
  }),
});
