import { getTaskForWorkflow, reportProgress } from "@/lib/tasks/service";
import type { ProgressInput } from "@/lib/tasks/types";

export interface RunCursorStaffTaskResult {
  deliverableContent: string;
  deliverableId: string;
}

export async function runCursorStaffTaskStep(
  taskId: string
): Promise<RunCursorStaffTaskResult> {
  "use step";

  const { task, staff } = await getTaskForWorkflow(taskId);
  const { runCursorStaffTask } = await import("@/lib/cursor/run-staff-task");

  return await runCursorStaffTask({
    task,
    staff,
    onProgress: async (event: ProgressInput) => {
      await reportProgress(taskId, event);
    },
  });
}
