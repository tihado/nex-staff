import type { taskStatusEnum } from "@/db/schema";

export type TaskStatus = (typeof taskStatusEnum.enumValues)[number];

export interface TaskStaffSummary {
  id: string;
  name: string;
  role: string;
}

export interface TaskDeliverableSummary {
  contentType: string;
  id: string;
  title: string;
}

export interface TaskSummary {
  brief: string;
  completedAt: string | null;
  createdAt: string;
  currentStep: string | null;
  deliverable: TaskDeliverableSummary | null;
  id: string;
  lastEventAt: string | null;
  progressPercent: number;
  staff: TaskStaffSummary;
  staffId: string;
  startedAt: string | null;
  status: TaskStatus;
  workflowRunId: string | null;
}

export interface TaskDetail extends TaskSummary {
  deliverable: (TaskDeliverableSummary & { content: string }) | null;
  metadata: Record<string, unknown>;
}

export interface TaskEventRecord {
  createdAt: string;
  id: string;
  payload: Record<string, unknown>;
  type: string;
}

export interface TaskPreviewRecord {
  content: string;
  excerpt: string;
  taskId: string;
  updatedAt: string;
}

export interface TaskStatusSnapshot {
  currentStep: string | null;
  hasPreview: boolean;
  lastEventAt: string | null;
  previewExcerpt: string | null;
  progressPercent: number;
  recentEvents: TaskEventRecord[];
  staff: TaskStaffSummary;
  startedAt: string | null;
  status: TaskStatus;
  taskId: string;
}

export interface ReportTaskProgressInput {
  label?: string;
  payload?: Record<string, unknown>;
  progressPercent?: number;
  type: string;
}

export interface TaskProgressSsePayload {
  currentStep: string;
  progressPercent: number;
  staffId: string;
  taskId: string;
  type: "task.progress";
}

export interface TaskCompletedSsePayload {
  deliverableId: string | null;
  preview: string | null;
  staffId: string;
  taskId: string;
  title: string;
  type: "task.completed";
}

export interface TaskFailedSsePayload {
  error: string;
  staffId: string;
  taskId: string;
  type: "task.failed";
}

export type TaskSsePayload =
  | TaskCompletedSsePayload
  | TaskFailedSsePayload
  | TaskProgressSsePayload;
