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
  | "workflow.failed";

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
