import { tool } from "ai";
import { z } from "zod";
import { pendingToolExecute } from "@/lib/tools/pending";
import { checkTaskStatusTool } from "@/lib/tools/tasks/check-task-status";
import { getTaskEventsTool } from "@/lib/tools/tasks/get-task-events";
import { getTaskPreviewTool } from "@/lib/tools/tasks/get-task-preview";
import { listActiveTasksTool } from "@/lib/tools/tasks/list-active-tasks";

export const delegateTaskTool = tool({
  description:
    "Delegate a task to a staff member. They will work in the background.",
  inputSchema: z.object({
    staffId: z.string().uuid(),
    brief: z.string(),
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
  }),
  execute: pendingToolExecute,
});

export const getDeliverableTool = tool({
  description: "Get the deliverable from a completed task",
  inputSchema: z.object({
    taskId: z.string().uuid(),
  }),
  execute: pendingToolExecute,
});

export const taskTools = {
  delegate_task: delegateTaskTool,
  check_task_status: checkTaskStatusTool,
  list_active_tasks: listActiveTasksTool,
  get_task_events: getTaskEventsTool,
  get_task_preview: getTaskPreviewTool,
  get_deliverable: getDeliverableTool,
} as const;
