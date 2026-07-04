import { tool } from "ai";
import { start } from "workflow/api";
import { z } from "zod";
import { getStaffById } from "@/lib/staff/service";
import { createDelegatedTask, markTaskRunning } from "@/lib/tasks/service";
import { staffTaskWorkflow } from "@/lib/workflows/staff-task";

export const taskToolContextSchema = z.object({
  chatId: z.string().uuid().optional(),
  userId: z.string().uuid(),
});

export const delegateTaskTool = tool({
  description:
    "Delegate a task to a staff member. They will work in the background.",
  inputSchema: z.object({
    staffId: z.string().uuid(),
    brief: z.string().min(1),
    acceptanceCriteria: z.string().optional(),
    checkpoints: z
      .array(
        z.object({
          label: z.string(),
          criteria: z.string(),
          order: z.number(),
        })
      )
      .optional(),
    parentGroupId: z.string().uuid().optional(),
    dependsOn: z.array(z.string().uuid()).optional(),
    documentIds: z.array(z.string().uuid()).optional(),
  }),
  contextSchema: taskToolContextSchema,
  execute: async (input, { context }) => {
    const staffMember = await getStaffById(context.userId, input.staffId);

    if (!staffMember) {
      throw new Error("Staff member not found for this user.");
    }

    const task = await createDelegatedTask(context.userId, {
      staffId: input.staffId,
      brief: input.brief,
      chatId: context.chatId,
      acceptanceCriteria: input.acceptanceCriteria,
      parentGroupId: input.parentGroupId,
      dependsOn: input.dependsOn,
      documentIds: input.documentIds,
    });

    const run = await start(staffTaskWorkflow, [task.id]);
    await markTaskRunning(task.id, run.runId);

    return {
      taskId: task.id,
      staffId: staffMember.id,
      staffName: staffMember.name,
      workflowRunId: run.runId,
      message: `Đã giao việc cho ${staffMember.name}. Bạn có thể tiếp tục chat.`,
    };
  },
});
