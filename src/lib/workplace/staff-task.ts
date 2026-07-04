import type { WorkspaceDesk } from "@/components/workplace/workspace-layout";
import type { TaskSummary } from "@/lib/tasks/types";

export function findStaffTask(
  desk: WorkspaceDesk,
  tasks: TaskSummary[]
): TaskSummary | null {
  if (!desk.staffId) {
    return null;
  }

  if (desk.pendingTaskId) {
    const pendingTask = tasks.find((task) => task.id === desk.pendingTaskId);

    if (pendingTask) {
      return pendingTask;
    }
  }

  const staffTasks = tasks.filter((task) => task.staffId === desk.staffId);

  const activeTask = staffTasks.find(
    (task) => task.status === "running" || task.status === "pending"
  );

  if (activeTask) {
    return activeTask;
  }

  const completedTasks = staffTasks
    .filter((task) => task.status === "completed")
    .sort((left, right) => {
      const leftTime = left.completedAt ?? left.createdAt;
      const rightTime = right.completedAt ?? right.createdAt;
      return rightTime.localeCompare(leftTime);
    });

  return completedTasks[0] ?? null;
}
