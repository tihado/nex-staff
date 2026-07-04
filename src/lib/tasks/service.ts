import { and, count, desc, eq, gt, gte, inArray, lt, or } from "drizzle-orm";
import { start } from "workflow/api";
import { db } from "@/db";
import {
  chat,
  deliverable,
  notification,
  staff,
  type TaskMetadata,
  task,
  taskEvent,
  taskPreview,
} from "@/db/schema";
import { mergePullRequest } from "@/lib/github/merge-pull-request";
import { createNotification } from "@/lib/notifications/service";
import {
  getCoderPrUrl,
  getCoderWebsitePreviewUrl,
  isCoderPrMerged,
} from "@/lib/tasks/coder-preview";
import {
  DEFAULT_TASK_EVENTS_LIMIT,
  DEFAULT_TASK_LIST_LIMIT,
  PREVIEW_EXCERPT_LENGTH,
  RECENTLY_COMPLETED_WINDOW_MS,
  TASK_START_STEP,
} from "@/lib/tasks/constants";
import {
  TaskCancelError,
  TaskCancelledError,
  TaskDispatchError,
  TaskMergeError,
  TaskNotFoundError,
  TaskValidationError,
} from "@/lib/tasks/errors";
import { publishTaskProgress } from "@/lib/tasks/sse";
import type {
  ActiveTaskSummary,
  DelegateTaskInput,
  DelegateTaskResult,
  DeliverableRecord,
  ProgressInput,
  RecentlyCompletedTaskSummary,
  TaskCompletedSsePayload,
  TaskDetail,
  TaskEventRecord,
  TaskFailedSsePayload,
  TaskPreviewRecord,
  TaskProgressSsePayload,
  TaskStaffSummary,
  TaskStatus,
  TaskStatusSnapshot,
  TaskSummary,
} from "@/lib/tasks/types";
import { staffTaskWorkflow } from "@/lib/workflows/staff-task";

function toIsoString(value: Date): string {
  return value.toISOString();
}

function mapTaskEvent(row: typeof taskEvent.$inferSelect): TaskEventRecord {
  return {
    id: row.id,
    type: row.type,
    payload: row.payload ?? {},
    createdAt: toIsoString(row.createdAt),
  };
}

function excerpt(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trimEnd()}…`;
}

function resolveTaskStatusFromEvent(
  eventType: ProgressInput["type"],
  currentStatus: TaskStatus
): TaskStatus {
  if (eventType === "workflow.completed") {
    return "completed";
  }

  if (eventType === "workflow.failed") {
    return "failed";
  }

  if (eventType === "workflow.cancelled") {
    return "cancelled";
  }

  if (currentStatus === "pending") {
    return "running";
  }

  return currentStatus;
}

export async function createDelegatedTask(
  userId: string,
  input: DelegateTaskInput
): Promise<typeof task.$inferSelect> {
  const staffRow = await db.query.staff.findFirst({
    where: and(eq(staff.id, input.staffId), eq(staff.userId, userId)),
    columns: { id: true },
  });

  if (!staffRow) {
    throw new Error("Staff member not found for this user.");
  }

  const metadata: TaskMetadata = {};

  if (input.acceptanceCriteria) {
    metadata.acceptanceCriteria = input.acceptanceCriteria;
  }

  if (input.parentGroupId) {
    metadata.parentGroupId = input.parentGroupId;
  }

  if (input.dependsOn && input.dependsOn.length > 0) {
    metadata.dependsOn = input.dependsOn;
  }

  if (input.documentIds && input.documentIds.length > 0) {
    metadata.documentIds = [...new Set(input.documentIds)];
  }

  if (input.checkpoints && input.checkpoints.length > 0) {
    metadata.checkpoints = input.checkpoints;
  }

  const [row] = await db
    .insert(task)
    .values({
      userId,
      staffId: input.staffId,
      chatId: input.chatId,
      brief: input.brief,
      status: "pending",
      progressPercent: 0,
      currentStep: TASK_START_STEP,
      metadata,
    })
    .returning();

  if (!row) {
    throw new Error("Failed to create delegated task.");
  }

  await db.insert(taskPreview).values({
    taskId: row.id,
    content: "",
  });

  return row;
}

export async function markTaskRunning(
  taskId: string,
  workflowRunId: string
): Promise<void> {
  await db
    .update(task)
    .set({
      status: "running",
      workflowRunId,
      startedAt: new Date(),
    })
    .where(eq(task.id, taskId));
}

async function assertChatBelongsToUser(
  userId: string,
  chatId: string | undefined
): Promise<string | undefined> {
  if (!chatId) {
    return;
  }

  const existing = await db.query.chat.findFirst({
    where: and(eq(chat.id, chatId), eq(chat.userId, userId)),
    columns: { id: true },
  });

  if (!existing) {
    throw new TaskValidationError("Chat not found.");
  }

  return chatId;
}

export async function delegateTask(
  userId: string,
  input: DelegateTaskInput
): Promise<DelegateTaskResult> {
  const chatId = await assertChatBelongsToUser(userId, input.chatId);

  const staffRow = await db.query.staff.findFirst({
    where: and(eq(staff.id, input.staffId), eq(staff.userId, userId)),
  });

  if (!staffRow) {
    throw new TaskValidationError(
      "Staff member not found. Use list_staff to see your team."
    );
  }

  if (staffRow.status === "offline") {
    throw new TaskValidationError(
      `${staffRow.name} is currently offline and cannot receive tasks.`
    );
  }

  // MVP: allow delegation while staff is already working (simple parallel queue).

  const taskRow = await createDelegatedTask(userId, {
    ...input,
    chatId,
  });

  let workflowRunId: string;

  try {
    const run = await start(staffTaskWorkflow, [taskRow.id]);
    workflowRunId = run.runId;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to start workflow.";

    await markTaskFailed(taskRow.id, message);

    throw new TaskDispatchError(
      `Task was created but workflow failed to start: ${message}`
    );
  }

  await markTaskRunning(taskRow.id, workflowRunId);

  return {
    taskId: taskRow.id,
    staffId: staffRow.id,
    staffName: staffRow.name,
    status: "running",
    workflowRunId,
    message: `Task delegated to ${staffRow.name}. You can keep chatting.`,
  };
}

export async function getTaskForWorkflow(taskId: string): Promise<{
  staff: typeof staff.$inferSelect;
  task: typeof task.$inferSelect;
}> {
  const taskRow = await db.query.task.findFirst({
    where: eq(task.id, taskId),
  });

  if (!taskRow) {
    throw new Error(`Task ${taskId} not found.`);
  }

  const staffRow = await db.query.staff.findFirst({
    where: and(eq(staff.id, taskRow.staffId), eq(staff.userId, taskRow.userId)),
  });

  if (!staffRow) {
    throw new Error(`Staff for task ${taskId} not found.`);
  }

  return { task: taskRow, staff: staffRow };
}

export async function assertTaskNotCancelled(taskId: string): Promise<void> {
  const taskRow = await db.query.task.findFirst({
    where: eq(task.id, taskId),
    columns: { status: true },
  });

  if (!taskRow) {
    throw new Error(`Task ${taskId} not found.`);
  }

  if (taskRow.status === "cancelled") {
    throw new TaskCancelledError();
  }
}

export async function reportProgress(
  taskId: string,
  event: ProgressInput
): Promise<void> {
  const taskRow = await db.query.task.findFirst({
    where: eq(task.id, taskId),
    columns: { status: true },
  });

  if (!taskRow) {
    throw new Error(`Task ${taskId} not found.`);
  }

  if (taskRow.status === "cancelled") {
    throw new TaskCancelledError();
  }

  const payload: Record<string, unknown> = {
    ...(event.payload ?? {}),
  };

  if (event.label) {
    payload.label = event.label;
  }

  if (event.progressPercent !== undefined) {
    payload.progressPercent = event.progressPercent;
  }

  await db.insert(taskEvent).values({
    taskId,
    type: event.type,
    payload,
  });

  const nextStatus = resolveTaskStatusFromEvent(event.type, taskRow.status);

  await db
    .update(task)
    .set({
      status: nextStatus,
      currentStep: event.label ?? undefined,
      progressPercent: event.progressPercent ?? undefined,
      lastEventType: event.type,
      lastEventAt: new Date(),
      completedAt: event.type === "workflow.completed" ? new Date() : undefined,
    })
    .where(eq(task.id, taskId));

  publishTaskProgress(taskId, event);
}

export async function appendTaskPreview(
  taskId: string,
  text: string
): Promise<void> {
  if (!text.trim()) {
    return;
  }

  const existing = await db.query.taskPreview.findFirst({
    where: eq(taskPreview.taskId, taskId),
    columns: { id: true, content: true },
  });

  if (!existing) {
    await db.insert(taskPreview).values({
      taskId,
      content: text,
    });
    return;
  }

  const nextContent = existing.content ? `${existing.content}\n${text}` : text;

  await db
    .update(taskPreview)
    .set({
      content: nextContent,
      updatedAt: new Date(),
    })
    .where(eq(taskPreview.id, existing.id));
}

export async function saveDeliverable(
  taskId: string,
  input: { content: string; contentType?: string; title: string }
): Promise<string> {
  await assertTaskNotCancelled(taskId);

  const existing = await db.query.deliverable.findFirst({
    where: eq(deliverable.taskId, taskId),
    columns: { id: true },
  });

  if (existing) {
    await db
      .update(deliverable)
      .set({
        title: input.title,
        content: input.content,
        contentType: input.contentType ?? "text/markdown",
      })
      .where(eq(deliverable.id, existing.id));

    await reportProgress(taskId, {
      type: "deliverable.saved",
      label: "Result saved",
      payload: { deliverableId: existing.id },
    });

    return existing.id;
  }

  const [row] = await db
    .insert(deliverable)
    .values({
      taskId,
      title: input.title,
      content: input.content,
      contentType: input.contentType ?? "text/markdown",
    })
    .returning({ id: deliverable.id });

  if (!row) {
    throw new Error("Failed to save deliverable.");
  }

  await reportProgress(taskId, {
    type: "deliverable.saved",
    label: "Result saved",
    payload: { deliverableId: row.id },
  });

  return row.id;
}

export async function markTaskFailed(
  taskId: string,
  error: unknown
): Promise<void> {
  const taskRow = await db.query.task.findFirst({
    where: eq(task.id, taskId),
    columns: { metadata: true, status: true },
  });

  if (taskRow?.status === "cancelled") {
    return;
  }

  const message =
    error instanceof Error ? error.message : "Task execution failed.";

  const metadata: TaskMetadata = {
    ...(taskRow?.metadata ?? {}),
    error: message,
  };

  await db
    .update(task)
    .set({
      status: "failed",
      metadata,
      completedAt: new Date(),
    })
    .where(eq(task.id, taskId));
}

export async function updateTaskCoderMetadata(
  taskId: string,
  coder: NonNullable<TaskMetadata["coder"]>
): Promise<void> {
  const taskRow = await db.query.task.findFirst({
    where: eq(task.id, taskId),
    columns: { metadata: true },
  });

  const metadata: TaskMetadata = {
    ...(taskRow?.metadata ?? {}),
    coder,
  };

  await db
    .update(task)
    .set({
      metadata,
    })
    .where(eq(task.id, taskId));
}

export interface MergeCoderPullRequestResult {
  mergedAt: string;
  message: string;
  prUrl: string;
  taskId: string;
}

export async function mergeCoderPullRequestForUser(
  userId: string,
  taskId: string
): Promise<MergeCoderPullRequestResult> {
  const taskRow = await getOwnedTaskRow(userId, taskId);

  if (taskRow.status !== "completed") {
    throw new TaskMergeError("Only completed tasks can be merged.");
  }

  const metadata = (taskRow.metadata ?? {}) as TaskMetadata;
  const coder = metadata.coder;

  if (!(coder?.repoUrl && coder.prUrl)) {
    throw new TaskMergeError("This task has no pull request to merge.");
  }

  if (coder.prMergedAt) {
    throw new TaskMergeError("Pull request was already merged.");
  }

  await mergePullRequest({
    repoUrl: coder.repoUrl,
    prUrl: coder.prUrl,
  });

  const mergedAt = new Date().toISOString();
  const updatedCoder = {
    ...coder,
    prMergedAt: mergedAt,
  };

  await updateTaskCoderMetadata(taskId, updatedCoder);

  await db.insert(taskEvent).values({
    taskId,
    type: "deliverable.saved",
    payload: {
      label: "Changes published",
      prUrl: coder.prUrl,
      mergedAt,
    },
  });

  return {
    taskId,
    prUrl: coder.prUrl,
    mergedAt,
    message: "Changes published to your live website.",
  };
}

const NON_CANCELLABLE_STATUSES = new Set<TaskStatus>([
  "completed",
  "failed",
  "cancelled",
]);

export interface CancelTaskResult {
  message: string;
  status: "cancelled";
  taskId: string;
}

export async function cancelTaskForUser(
  userId: string,
  taskId: string,
  reason?: string
): Promise<CancelTaskResult> {
  const row = await getOwnedTaskRow(userId, taskId);

  if (NON_CANCELLABLE_STATUSES.has(row.status)) {
    throw new TaskCancelError(
      `Task is already ${row.status} and cannot be stopped.`
    );
  }

  const cancelReason = reason?.trim() || "Cancelled by user.";

  await db.insert(taskEvent).values({
    taskId,
    type: "workflow.cancelled",
    payload: {
      label: "Cancelled by user",
      reason: cancelReason,
    },
  });

  await db
    .update(task)
    .set({
      status: "cancelled",
      currentStep: "Cancelled",
      completedAt: new Date(),
      lastEventType: "workflow.cancelled",
      lastEventAt: new Date(),
    })
    .where(eq(task.id, taskId));

  await releaseStaffIfIdle(row.staffId);

  return {
    taskId,
    status: "cancelled",
    message: `Task stopped. ${cancelReason}`,
  };
}

export async function setStaffWorking(staffId: string): Promise<void> {
  await db
    .update(staff)
    .set({ status: "working", updatedAt: new Date() })
    .where(eq(staff.id, staffId));
}

export async function releaseStaffIfIdle(staffId: string): Promise<void> {
  const [result] = await db
    .select({ activeTasks: count() })
    .from(task)
    .where(
      and(
        eq(task.staffId, staffId),
        or(eq(task.status, "pending"), eq(task.status, "running"))
      )
    );

  const activeTasks = Number(result?.activeTasks ?? 0);

  if (activeTasks > 0) {
    return;
  }

  await db
    .update(staff)
    .set({ status: "idle", updatedAt: new Date() })
    .where(eq(staff.id, staffId));
}

export async function createTaskCompletedNotification(
  taskId: string
): Promise<void> {
  const taskRow = await db.query.task.findFirst({
    where: eq(task.id, taskId),
    columns: { metadata: true, userId: true, staffId: true },
  });

  if (!taskRow) {
    return;
  }

  const staffRow = await db.query.staff.findFirst({
    where: eq(staff.id, taskRow.staffId),
    columns: { name: true, role: true },
  });

  const deliverableRow = await db.query.deliverable.findFirst({
    where: eq(deliverable.taskId, taskId),
    columns: { id: true, title: true },
  });

  const websitePreviewUrl = getCoderWebsitePreviewUrl(
    (taskRow.metadata ?? {}) as TaskMetadata
  );
  const prUrl = getCoderPrUrl((taskRow.metadata ?? {}) as TaskMetadata);

  await createNotification({
    userId: taskRow.userId,
    taskId,
    type: "task.completed",
    payload: {
      staffName: staffRow?.name ?? "Staff",
      staffRole: staffRow?.role ?? "",
      deliverableId: deliverableRow?.id ?? null,
      deliverableTitle: deliverableRow?.title ?? null,
      websitePreviewUrl: websitePreviewUrl ?? null,
      prUrl: prUrl ?? null,
      prMerged: isCoderPrMerged((taskRow.metadata ?? {}) as TaskMetadata),
    },
  });
}

export async function getTaskStatusForUser(
  userId: string,
  taskId: string
): Promise<TaskStatusSnapshot | null> {
  const taskRow = await db.query.task.findFirst({
    where: and(eq(task.id, taskId), eq(task.userId, userId)),
  });

  if (!taskRow) {
    return null;
  }

  const staffRow = await db.query.staff.findFirst({
    where: eq(staff.id, taskRow.staffId),
    columns: { name: true, role: true },
  });

  const previewRow = await db.query.taskPreview.findFirst({
    where: eq(taskPreview.taskId, taskId),
    columns: { content: true },
  });

  const deliverableRow = await db.query.deliverable.findFirst({
    where: eq(deliverable.taskId, taskId),
    columns: { id: true },
  });

  const recentEvents = await db.query.taskEvent.findMany({
    where: eq(taskEvent.taskId, taskId),
    orderBy: desc(taskEvent.createdAt),
    limit: 10,
  });

  const previewContent = previewRow?.content ?? "";

  return {
    id: taskRow.id,
    staffId: taskRow.staffId,
    staffName: staffRow?.name ?? "Staff",
    staffRole: staffRow?.role ?? "",
    brief: taskRow.brief,
    status: taskRow.status,
    progressPercent: taskRow.progressPercent ?? 0,
    currentStep: taskRow.currentStep,
    startedAt: taskRow.startedAt ? toIsoString(taskRow.startedAt) : null,
    completedAt: taskRow.completedAt ? toIsoString(taskRow.completedAt) : null,
    lastEventAt: taskRow.lastEventAt ? toIsoString(taskRow.lastEventAt) : null,
    lastEventType: taskRow.lastEventType,
    workflowRunId: taskRow.workflowRunId,
    hasPreview: previewContent.length > 0,
    previewExcerpt: previewContent
      ? excerpt(previewContent, PREVIEW_EXCERPT_LENGTH)
      : null,
    hasDeliverable: Boolean(deliverableRow),
    recentEvents: recentEvents.map(mapTaskEvent),
    createdAt: toIsoString(taskRow.createdAt),
  };
}

export async function listActiveTasksForUser(userId: string): Promise<{
  active: ActiveTaskSummary[];
  recentlyCompleted: RecentlyCompletedTaskSummary[];
}> {
  const activeRows = await db.query.task.findMany({
    where: and(
      eq(task.userId, userId),
      or(eq(task.status, "pending"), eq(task.status, "running"))
    ),
    orderBy: desc(task.createdAt),
  });

  const staffIds = [...new Set(activeRows.map((row) => row.staffId))];
  const staffRows =
    staffIds.length > 0
      ? await db.query.staff.findMany({
          where: inArray(staff.id, staffIds),
          columns: { id: true, name: true },
        })
      : [];

  const staffNameById = new Map(staffRows.map((row) => [row.id, row.name]));

  const active: ActiveTaskSummary[] = activeRows.map((row) => ({
    taskId: row.id,
    staffName: staffNameById.get(row.staffId) ?? "Staff",
    status: row.status,
    progressPercent: row.progressPercent ?? 0,
    currentStep: row.currentStep,
  }));

  const cutoff = new Date(Date.now() - RECENTLY_COMPLETED_WINDOW_MS);

  const completedRows = await db.query.task.findMany({
    where: and(
      eq(task.userId, userId),
      eq(task.status, "completed"),
      gte(task.completedAt, cutoff)
    ),
    orderBy: desc(task.completedAt),
    limit: 20,
  });

  const completedStaffIds = [
    ...new Set(completedRows.map((row) => row.staffId)),
  ];
  const completedStaffRows =
    completedStaffIds.length > 0
      ? await db.query.staff.findMany({
          where: inArray(staff.id, completedStaffIds),
          columns: { id: true, name: true },
        })
      : [];

  const completedStaffNameById = new Map(
    completedStaffRows.map((row) => [row.id, row.name])
  );

  const completedTaskIds = completedRows.map((row) => row.id);
  const deliverables =
    completedTaskIds.length > 0
      ? await db.query.deliverable.findMany({
          where: inArray(deliverable.taskId, completedTaskIds),
          columns: { id: true, taskId: true },
        })
      : [];

  const deliverableByTaskId = new Map(
    deliverables.map((row) => [row.taskId, row.id])
  );

  const pendingNotifications = await db.query.notification.findMany({
    where: and(
      eq(notification.userId, userId),
      eq(notification.status, "pending"),
      eq(notification.type, "task.completed")
    ),
    columns: { taskId: true },
  });

  const pendingTaskIds = new Set(
    pendingNotifications
      .map((row) => row.taskId)
      .filter((id): id is string => Boolean(id))
  );

  const recentlyCompleted: RecentlyCompletedTaskSummary[] = completedRows
    .filter((row) => pendingTaskIds.has(row.id))
    .map((row) => ({
      taskId: row.id,
      staffName: completedStaffNameById.get(row.staffId) ?? "Staff",
      deliverableId: deliverableByTaskId.get(row.id) ?? null,
      completedAt: row.completedAt ? toIsoString(row.completedAt) : "",
    }));

  return { active, recentlyCompleted };
}

export async function getTaskEventsForUser(
  userId: string,
  taskId: string,
  limit: number
): Promise<TaskEventRecord[] | null> {
  const taskRow = await db.query.task.findFirst({
    where: and(eq(task.id, taskId), eq(task.userId, userId)),
    columns: { id: true },
  });

  if (!taskRow) {
    return null;
  }

  const rows = await db.query.taskEvent.findMany({
    where: eq(taskEvent.taskId, taskId),
    orderBy: desc(taskEvent.createdAt),
    limit,
  });

  return rows.map(mapTaskEvent);
}

export async function getTaskPreviewForUser(
  userId: string,
  taskId: string
): Promise<{ content: string; updatedAt: string } | null> {
  const taskRow = await db.query.task.findFirst({
    where: and(eq(task.id, taskId), eq(task.userId, userId)),
    columns: { id: true },
  });

  if (!taskRow) {
    return null;
  }

  const previewRow = await db.query.taskPreview.findFirst({
    where: eq(taskPreview.taskId, taskId),
  });

  if (!previewRow) {
    return { content: "", updatedAt: new Date().toISOString() };
  }

  return {
    content: previewRow.content,
    updatedAt: toIsoString(previewRow.updatedAt),
  };
}

export async function getDeliverableForUser(
  userId: string,
  taskId: string
): Promise<DeliverableRecord | null> {
  const taskRow = await db.query.task.findFirst({
    where: and(eq(task.id, taskId), eq(task.userId, userId)),
    columns: { id: true },
  });

  if (!taskRow) {
    return null;
  }

  const row = await db.query.deliverable.findFirst({
    where: eq(deliverable.taskId, taskId),
  });

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    taskId: row.taskId,
    title: row.title,
    content: row.content,
    contentType: row.contentType,
    createdAt: toIsoString(row.createdAt),
  };
}

export async function getTaskPreviewContent(taskId: string): Promise<string> {
  const previewRow = await db.query.taskPreview.findFirst({
    where: eq(taskPreview.taskId, taskId),
    columns: { content: true },
  });

  return previewRow?.content ?? "";
}

function toIsoStringOrNull(value: Date | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return value.toISOString();
}

function truncateBrief(brief: string, maxLength = 48): string {
  if (brief.length <= maxLength) {
    return brief;
  }

  return `${brief.slice(0, maxLength - 1).trimEnd()}…`;
}

function mapStaffSummary(row: typeof staff.$inferSelect): TaskStaffSummary {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    avatarSprite: row.avatarSprite,
  };
}

async function getStaffMap(
  staffIds: string[]
): Promise<Map<string, typeof staff.$inferSelect>> {
  const map = new Map<string, typeof staff.$inferSelect>();

  if (staffIds.length === 0) {
    return map;
  }

  const rows = await db.query.staff.findMany({
    where: (staffTable, { inArray: inArrayOp }) =>
      inArrayOp(staffTable.id, staffIds),
  });

  for (const row of rows) {
    map.set(row.id, row);
  }

  return map;
}

async function getDeliverableMap(
  taskIds: string[]
): Promise<Map<string, typeof deliverable.$inferSelect>> {
  const map = new Map<string, typeof deliverable.$inferSelect>();

  if (taskIds.length === 0) {
    return map;
  }

  const rows = await db.query.deliverable.findMany({
    where: (deliverableTable, { inArray: inArrayOp }) =>
      inArrayOp(deliverableTable.taskId, taskIds),
  });

  for (const row of rows) {
    map.set(row.taskId, row);
  }

  return map;
}

function extractFailureMessage(
  metadata: TaskMetadata | null | undefined
): string | null {
  if (!metadata?.error || typeof metadata.error !== "string") {
    return null;
  }

  const trimmed = metadata.error.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function mapTaskSummary(
  row: typeof task.$inferSelect,
  staffMember: TaskStaffSummary,
  deliverableRow: typeof deliverable.$inferSelect | undefined
): TaskSummary {
  return {
    id: row.id,
    brief: row.brief,
    status: row.status,
    progressPercent: row.progressPercent ?? 0,
    currentStep: row.currentStep,
    lastEventAt: toIsoStringOrNull(row.lastEventAt),
    workflowRunId: row.workflowRunId,
    startedAt: toIsoStringOrNull(row.startedAt),
    completedAt: toIsoStringOrNull(row.completedAt),
    createdAt: toIsoString(row.createdAt),
    staffId: row.staffId,
    staff: staffMember,
    failureMessage:
      row.status === "failed" ? extractFailureMessage(row.metadata) : null,
    deliverable: deliverableRow
      ? {
          id: deliverableRow.id,
          title: deliverableRow.title,
          contentType: deliverableRow.contentType,
        }
      : null,
  };
}

async function getOwnedTaskRow(userId: string, taskId: string) {
  const row = await db.query.task.findFirst({
    where: (taskTable, { and: andOp, eq: equals }) =>
      andOp(equals(taskTable.id, taskId), equals(taskTable.userId, userId)),
  });

  if (!row) {
    throw new TaskNotFoundError();
  }

  return row;
}

export async function listTasks(
  userId: string,
  options: {
    limit?: number;
    staffId?: string;
    status?: TaskStatus[];
  } = {}
): Promise<TaskSummary[]> {
  const limit = options.limit ?? DEFAULT_TASK_LIST_LIMIT;
  const conditions = [eq(task.userId, userId)];

  if (options.staffId) {
    conditions.push(eq(task.staffId, options.staffId));
  }

  if (options.status && options.status.length > 0) {
    conditions.push(inArray(task.status, options.status));
  }

  const rows = await db.query.task.findMany({
    where: and(...conditions),
    orderBy: desc(task.createdAt),
    limit,
  });

  const staffMap = await getStaffMap(rows.map((row) => row.staffId));
  const deliverableMap = await getDeliverableMap(rows.map((row) => row.id));

  return rows.flatMap((row) => {
    const staffMember = staffMap.get(row.staffId);

    if (!staffMember) {
      return [];
    }

    return [
      mapTaskSummary(
        row,
        mapStaffSummary(staffMember),
        deliverableMap.get(row.id)
      ),
    ];
  });
}

export async function getTaskById(
  userId: string,
  taskId: string
): Promise<TaskDetail | null> {
  const row = await db.query.task.findFirst({
    where: (taskTable, { and: andOp, eq: equals }) =>
      andOp(equals(taskTable.id, taskId), equals(taskTable.userId, userId)),
  });

  if (!row) {
    return null;
  }

  const staffMember = await db.query.staff.findFirst({
    where: eq(staff.id, row.staffId),
  });

  if (!staffMember) {
    return null;
  }

  const deliverableRow = await db.query.deliverable.findFirst({
    where: eq(deliverable.taskId, row.id),
  });

  const summary = mapTaskSummary(
    row,
    mapStaffSummary(staffMember),
    deliverableRow
  );

  return {
    ...summary,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    deliverable: deliverableRow
      ? {
          id: deliverableRow.id,
          title: deliverableRow.title,
          content: deliverableRow.content,
          contentType: deliverableRow.contentType,
        }
      : null,
  };
}

export async function listTaskEvents(
  userId: string,
  taskId: string,
  options: { cursor?: string; limit?: number } = {}
): Promise<{ events: TaskEventRecord[]; nextCursor: string | null }> {
  await getOwnedTaskRow(userId, taskId);

  const limit = options.limit ?? DEFAULT_TASK_EVENTS_LIMIT;
  let cursorCreatedAt: Date | undefined;

  if (options.cursor) {
    const cursorEvent = await db.query.taskEvent.findFirst({
      where: (taskEventTable, { and: andOp, eq: equals }) =>
        andOp(
          equals(taskEventTable.id, options.cursor ?? ""),
          equals(taskEventTable.taskId, taskId)
        ),
      columns: { createdAt: true },
    });

    if (cursorEvent) {
      cursorCreatedAt = cursorEvent.createdAt;
    }
  }

  const rows = await db.query.taskEvent.findMany({
    where: (taskEventTable, { and: andOp, eq: equals }) => {
      const filters = [equals(taskEventTable.taskId, taskId)];

      if (cursorCreatedAt) {
        filters.push(lt(taskEventTable.createdAt, cursorCreatedAt));
      }

      return andOp(...filters);
    },
    orderBy: desc(taskEvent.createdAt),
    limit: limit + 1,
  });

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? (page.at(-1)?.id ?? null) : null;

  return {
    events: page.map(mapTaskEvent),
    nextCursor,
  };
}

export async function getTaskPreviewRecord(
  userId: string,
  taskId: string
): Promise<TaskPreviewRecord | null> {
  await getOwnedTaskRow(userId, taskId);

  const preview = await db.query.taskPreview.findFirst({
    where: eq(taskPreview.taskId, taskId),
  });

  if (!preview) {
    return null;
  }

  const content = preview.content ?? "";

  return {
    taskId,
    content,
    excerpt: excerpt(content, PREVIEW_EXCERPT_LENGTH),
    updatedAt: toIsoString(preview.updatedAt),
  };
}

export function buildTaskProgressSsePayload(
  taskRow: TaskSummary
): TaskProgressSsePayload {
  return {
    type: "task.progress",
    taskId: taskRow.id,
    staffId: taskRow.staffId,
    progressPercent: taskRow.progressPercent,
    currentStep: taskRow.currentStep ?? "Starting task...",
  };
}

export function buildTaskCompletedSsePayload(
  taskRow: TaskSummary,
  preview: string | null
): TaskCompletedSsePayload {
  return {
    type: "task.completed",
    taskId: taskRow.id,
    staffId: taskRow.staffId,
    deliverableId: taskRow.deliverable?.id ?? null,
    title: taskRow.deliverable?.title ?? truncateBrief(taskRow.brief, 120),
    preview,
  };
}

export function buildTaskFailedSsePayload(
  taskRow: TaskSummary,
  fallbackError = "Task failed."
): TaskFailedSsePayload {
  return {
    type: "task.failed",
    taskId: taskRow.id,
    staffId: taskRow.staffId,
    error: taskRow.failureMessage ?? fallbackError,
  };
}

export async function listTasksUpdatedSince(
  userId: string,
  since: Date
): Promise<TaskSummary[]> {
  const rows = await db.query.task.findMany({
    where: and(
      eq(task.userId, userId),
      or(
        gt(task.lastEventAt, since),
        and(
          inArray(task.status, ["completed", "failed"]),
          gt(task.completedAt, since)
        )
      )
    ),
    orderBy: desc(task.lastEventAt),
    limit: DEFAULT_TASK_LIST_LIMIT,
  });

  const staffMap = await getStaffMap(rows.map((row) => row.staffId));
  const deliverableMap = await getDeliverableMap(rows.map((row) => row.id));

  return rows.flatMap((row) => {
    const staffMember = staffMap.get(row.staffId);

    if (!staffMember) {
      return [];
    }

    return [
      mapTaskSummary(
        row,
        mapStaffSummary(staffMember),
        deliverableMap.get(row.id)
      ),
    ];
  });
}
