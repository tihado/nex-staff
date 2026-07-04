import type { ProgressInput } from "@/lib/tasks/types";

/**
 * Hook for #14 task.progress SSE. No-op until SSE endpoint is implemented.
 */
export function publishTaskProgress(
  _taskId: string,
  _event: ProgressInput
): void {
  // Intentionally empty — wired in issue #14.
}
