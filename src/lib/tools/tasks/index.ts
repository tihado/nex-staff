import { tool } from "ai";
import { z } from "zod";
import {
  getDeliverableForUser,
  getTaskEventsForUser,
  getTaskPreviewForUser,
  getTaskStatusForUser,
  listActiveTasksForUser,
} from "@/lib/tasks/service";
import {
  delegateTaskTool,
  taskToolContextSchema,
} from "@/lib/tools/tasks/delegate-task";
import { steerTaskTool } from "@/lib/tools/tasks/steer-task";
import { stopTaskTool } from "@/lib/tools/tasks/stop-task";

export const checkTaskStatusTool = tool({
  description:
    "Check status, progress, and partial results of a delegated task",
  inputSchema: z.object({
    taskId: z.string().uuid(),
  }),
  contextSchema: taskToolContextSchema,
  execute: async ({ taskId }, { context }) => {
    const status = await getTaskStatusForUser(context.userId, taskId);

    if (!status) {
      throw new Error("Task not found for this user.");
    }

    return status;
  },
});

export const listActiveTasksTool = tool({
  description:
    "List all running tasks and recently completed tasks awaiting notification",
  inputSchema: z.object({}),
  contextSchema: taskToolContextSchema,
  execute: async (_input, { context }) =>
    listActiveTasksForUser(context.userId),
});

export const getTaskEventsTool = tool({
  description: "Get detailed event log for a task",
  inputSchema: z.object({
    taskId: z.string().uuid(),
    limit: z.number().int().positive().default(20),
  }),
  contextSchema: taskToolContextSchema,
  execute: async ({ taskId, limit }, { context }) => {
    const events = await getTaskEventsForUser(context.userId, taskId, limit);

    if (!events) {
      throw new Error("Task not found for this user.");
    }

    return { taskId, events };
  },
});

export const getTaskPreviewTool = tool({
  description: "Get partial/draft output from a running task",
  inputSchema: z.object({
    taskId: z.string().uuid(),
  }),
  contextSchema: taskToolContextSchema,
  execute: async ({ taskId }, { context }) => {
    const preview = await getTaskPreviewForUser(context.userId, taskId);

    if (!preview) {
      throw new Error("Task not found for this user.");
    }

    return { taskId, ...preview };
  },
});

export const getDeliverableTool = tool({
  description: "Get the deliverable from a completed task",
  inputSchema: z.object({
    taskId: z.string().uuid(),
  }),
  contextSchema: taskToolContextSchema,
  execute: async ({ taskId }, { context }) => {
    const deliverable = await getDeliverableForUser(context.userId, taskId);

    if (!deliverable) {
      throw new Error("Deliverable not found for this task.");
    }

    return deliverable;
  },
});

export const taskTools = {
  delegate_task: delegateTaskTool,
  check_task_status: checkTaskStatusTool,
  list_active_tasks: listActiveTasksTool,
  get_task_events: getTaskEventsTool,
  get_task_preview: getTaskPreviewTool,
  get_deliverable: getDeliverableTool,
  stop_task: stopTaskTool,
  steer_task: steerTaskTool,
} as const;
