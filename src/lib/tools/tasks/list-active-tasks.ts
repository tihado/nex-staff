import { tool } from "ai";
import { z } from "zod";
import { runToolSafely } from "@/lib/assistant/errors";
import { listActiveTasks } from "@/lib/tasks/service";
import { taskToolContextSchema } from "@/lib/tools/tasks/context";

export const listActiveTasksTool = tool({
  description:
    "List all running tasks and recently completed tasks awaiting user notification.",
  inputSchema: z.object({}),
  contextSchema: taskToolContextSchema,
  execute: async (_input, { context }) =>
    runToolSafely("list_active_tasks", async () => {
      const { running, awaitingNotification } = await listActiveTasks(
        context.userId
      );

      const mapTask = (taskRow: (typeof running)[number]) => ({
        taskId: taskRow.id,
        brief: taskRow.brief,
        status: taskRow.status,
        progressPercent: taskRow.progressPercent,
        currentStep: taskRow.currentStep,
        staffId: taskRow.staffId,
        staffName: taskRow.staff.name,
        staffRole: taskRow.staff.role,
        startedAt: taskRow.startedAt,
        completedAt: taskRow.completedAt,
      });

      return {
        running: running.map(mapTask),
        awaitingNotification: awaitingNotification.map(mapTask),
        totalActive: running.length,
      };
    }),
});
