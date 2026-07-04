import type { taskStatusEnum } from "@/db/schema";

export type TaskStatus = (typeof taskStatusEnum.enumValues)[number];

export type TaskEventType =
  | "workflow.started"
  | "sandbox.creating"
  | "sandbox.created"
  | "agent.step_started"
  | "agent.tool_called"
  | "agent.text_delta"
  | "agent.step_completed"
  | "deliverable.saved"
  | "workflow.completed"
  | "workflow.failed"
  | "workflow.cancelled";

export interface ProgressInput {
  label?: string;
  payload?: Record<string, unknown>;
  progressPercent?: number;
  type: TaskEventType;
}

export interface DelegateTaskInput {
  acceptanceCriteria?: string;
  brief: string;
  chatId?: string;
  checkpoints?: Array<{
    criteria: string;
    label: string;
    order: number;
  }>;
  dependsOn?: string[];
  documentIds?: string[];
  parentGroupId?: string;
  staffId: string;
}

export interface DelegateTaskResult {
  message: string;
  staffId: string;
  staffName: string;
  status: TaskStatus;
  taskId: string;
  workflowRunId: string;
}

export interface TaskEventRecord {
  createdAt: string;
  id: string;
  payload: Record<string, unknown>;
  type: string;
}

export interface TaskStatusSnapshot {
  brief: string;
  completedAt: string | null;
  createdAt: string;
  currentStep: string | null;
  hasDeliverable: boolean;
  hasPreview: boolean;
  id: string;
  lastEventAt: string | null;
  lastEventType: string | null;
  previewExcerpt: string | null;
  progressPercent: number;
  recentEvents: TaskEventRecord[];
  staffId: string;
  staffName: string;
  staffRole: string;
  startedAt: string | null;
  status: TaskStatus;
  workflowRunId: string | null;
}

export interface ActiveTaskSummary {
  currentStep: string | null;
  progressPercent: number;
  staffName: string;
  status: TaskStatus;
  taskId: string;
}

export interface RecentlyCompletedTaskSummary {
  completedAt: string;
  deliverableId: string | null;
  staffName: string;
  taskId: string;
}

export interface DeliverableRecord {
  content: string;
  contentType: string;
  createdAt: string;
  id: string;
  taskId: string;
  title: string;
}

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

export interface TaskPreviewRecord {
  content: string;
  excerpt: string;
  taskId: string;
  updatedAt: string;
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
