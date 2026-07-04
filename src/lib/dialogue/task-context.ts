import type { TaskSummary } from "@/lib/tasks/types";

export interface TaskDialogueContext {
  brief: string;
  currentStep: string | null;
  progressPercent: number;
  staffName: string;
  taskId: string;
}

export function buildTaskDialogueGreeting(
  assistantName: string,
  context: TaskDialogueContext
): string {
  const step = context.currentStep
    ? ` Current step: ${context.currentStep}.`
    : "";

  return `${assistantName} here. You're reviewing "${context.brief}" — ${context.staffName} has it at ${context.progressPercent}% complete.${step} Is there anything you need related to this task?`;
}

export function buildTaskDialogueContextFromSummary(
  task: TaskSummary
): TaskDialogueContext {
  return {
    taskId: task.id,
    brief: task.brief,
    staffName: task.staff.name,
    progressPercent: task.progressPercent,
    currentStep: task.currentStep,
  };
}
