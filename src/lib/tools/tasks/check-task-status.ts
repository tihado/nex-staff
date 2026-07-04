import { tool } from "ai";
import { z } from "zod";
import { runToolSafely } from "@/lib/assistant/errors";
import { getTaskStatusSnapshot } from "@/lib/tasks/service";
import { taskToolContextSchema } from "@/lib/tools/tasks/context";

export const checkTaskStatusTool = tool({
  description:
    "Check status, progress, and partial results of a delegated task.",
  inputSchema: z.object({
    taskId: z
      .string()
      .uuid()
      .describe("Task ID from delegate_task or list_active_tasks"),
  }),
  contextSchema: taskToolContextSchema,
  execute: async ({ taskId }, { context }) =>
    runToolSafely("check_task_status", async () => {
      const snapshot = await getTaskStatusSnapshot(context.userId, taskId);

      if (!snapshot) {
        return { error: "Task not found." };
      }

      return {
        taskId: snapshot.taskId,
        status: snapshot.status,
        progressPercent: snapshot.progressPercent,
        currentStep: snapshot.currentStep,
        startedAt: snapshot.startedAt,
        lastEventAt: snapshot.lastEventAt,
        staffName: snapshot.staff.name,
        staffRole: snapshot.staff.role,
        hasPreview: snapshot.hasPreview,
        previewExcerpt: snapshot.previewExcerpt,
        recentEvents: snapshot.recentEvents.map((event) => ({
          type: event.type,
          createdAt: event.createdAt,
          payload: event.payload,
        })),
      };
    }),
});
