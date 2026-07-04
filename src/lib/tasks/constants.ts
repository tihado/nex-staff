export const DEFAULT_TASK_LIST_LIMIT = 20;

export const DEFAULT_TASK_EVENTS_LIMIT = 20;

export const MAX_TASK_EVENTS_LIMIT = 100;

export const TASK_PREVIEW_EXCERPT_LENGTH = 280;

export const SSE_POLL_INTERVAL_MS = 2000;

export const SSE_KEEPALIVE_INTERVAL_MS = 15_000;

export const ACTIVE_TASK_STATUSES = ["pending", "running"] as const;

export const TASK_EVENT_LABELS: Record<string, string> = {
  "agent.step_completed": "Đang xử lý...",
  "agent.step_started": "Đang xử lý...",
  "sandbox.created": "Workspace sẵn sàng",
  "sandbox.creating": "Chuẩn bị workspace...",
  "workflow.completed": "Hoàn thành",
  "workflow.failed": "Thất bại",
  "workflow.started": "Bắt đầu công việc",
};
