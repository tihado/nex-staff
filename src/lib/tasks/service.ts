import { and, desc, eq, gt, inArray, lt, or } from "drizzle-orm";
import { db } from "@/db";
import {
  deliverable,
  notification,
  staff,
  task,
  taskEvent,
  taskPreview,
} from "@/db/schema";
import { createNotification } from "@/lib/notifications/service";
import {
  DEFAULT_TASK_EVENTS_LIMIT,
  DEFAULT_TASK_LIST_LIMIT,
  TASK_EVENT_LABELS,
  TASK_PREVIEW_EXCERPT_LENGTH,
} from "@/lib/tasks/constants";
import { TaskNotFoundError } from "@/lib/tasks/errors";
import type {
  ReportTaskProgressInput,
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

function toIsoString(value: Date | null | undefined): string | null {
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

function buildPreviewExcerpt(content: string): string {
  const normalized = content.trim();

  if (normalized.length <= TASK_PREVIEW_EXCERPT_LENGTH) {
    return normalized;
  }

  return `${normalized.slice(0, TASK_PREVIEW_EXCERPT_LENGTH - 1).trimEnd()}…`;
}

export function resolveTaskEventLabel(
  type: string,
  label?: string | null
): string {
  if (label && label.trim().length > 0) {
    return label.trim();
  }

  return TASK_EVENT_LABELS[type] ?? type;
}

function mapTaskEvent(row: typeof taskEvent.$inferSelect): TaskEventRecord {
  return {
    id: row.id,
    type: row.type,
    payload: row.payload ?? {},
    createdAt: toIsoString(row.createdAt) ?? new Date().toISOString(),
  };
}

function mapStaffSummary(row: typeof staff.$inferSelect): TaskStaffSummary {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
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
    lastEventAt: toIsoString(row.lastEventAt),
    workflowRunId: row.workflowRunId,
    startedAt: toIsoString(row.startedAt),
    completedAt: toIsoString(row.completedAt),
    createdAt: toIsoString(row.createdAt) ?? new Date().toISOString(),
    staffId: row.staffId,
    staff: staffMember,
    deliverable: deliverableRow
      ? {
          id: deliverableRow.id,
          title: deliverableRow.title,
          contentType: deliverableRow.contentType,
        }
      : null,
  };
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
    excerpt: buildPreviewExcerpt(content),
    updatedAt: toIsoString(preview.updatedAt) ?? new Date().toISOString(),
  };
}

export async function getTaskStatusSnapshot(
  userId: string,
  taskId: string
): Promise<TaskStatusSnapshot | null> {
  const detail = await getTaskById(userId, taskId);

  if (!detail) {
    return null;
  }

  const { events } = await listTaskEvents(userId, taskId, { limit: 5 });
  const preview = await getTaskPreviewRecord(userId, taskId);

  return {
    taskId: detail.id,
    status: detail.status,
    progressPercent: detail.progressPercent,
    currentStep: detail.currentStep,
    startedAt: detail.startedAt,
    lastEventAt: detail.lastEventAt,
    staff: detail.staff,
    recentEvents: events,
    hasPreview: Boolean(preview?.content.trim()),
    previewExcerpt: preview?.excerpt ?? null,
  };
}

export async function listActiveTasks(userId: string): Promise<{
  awaitingNotification: TaskSummary[];
  running: TaskSummary[];
}> {
  const running = await listTasks(userId, {
    status: ["pending", "running"],
    limit: DEFAULT_TASK_LIST_LIMIT,
  });

  const completedRows = await db
    .select({
      notificationId: notification.id,
      taskId: notification.taskId,
    })
    .from(notification)
    .where(
      and(
        eq(notification.userId, userId),
        eq(notification.status, "pending"),
        eq(notification.type, "task.completed")
      )
    )
    .orderBy(desc(notification.createdAt))
    .limit(DEFAULT_TASK_LIST_LIMIT);

  const taskIds = completedRows
    .map((row) => row.taskId)
    .filter((value): value is string => Boolean(value));

  let awaitingNotification: TaskSummary[] = [];

  if (taskIds.length > 0) {
    const rows = await db.query.task.findMany({
      where: and(eq(task.userId, userId), inArray(task.id, taskIds)),
      orderBy: desc(task.createdAt),
    });

    const staffMap = await getStaffMap(rows.map((row) => row.staffId));
    const deliverableMap = await getDeliverableMap(rows.map((row) => row.id));

    awaitingNotification = rows.flatMap((row) => {
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

  return {
    running,
    awaitingNotification,
  };
}

export async function appendTaskPreview(
  taskId: string,
  content: string
): Promise<void> {
  const trimmed = content.trim();

  if (!trimmed) {
    return;
  }

  const existing = await db.query.taskPreview.findFirst({
    where: eq(taskPreview.taskId, taskId),
    columns: { id: true, content: true },
  });

  if (existing) {
    await db
      .update(taskPreview)
      .set({
        content: `${existing.content}${content}`,
        updatedAt: new Date(),
      })
      .where(eq(taskPreview.id, existing.id));
    return;
  }

  await db.insert(taskPreview).values({
    taskId,
    content,
  });
}

function resolveStatusFromEventType(type: string): TaskStatus | undefined {
  if (type === "workflow.completed") {
    return "completed";
  }

  if (type === "workflow.failed") {
    return "failed";
  }

  if (type === "workflow.started") {
    return "running";
  }

  return;
}

export async function reportTaskProgress(
  taskId: string,
  event: ReportTaskProgressInput
): Promise<TaskSummary> {
  const row = await db.query.task.findFirst({
    where: eq(task.id, taskId),
  });

  if (!row) {
    throw new TaskNotFoundError();
  }

  const label = resolveTaskEventLabel(event.type, event.label);
  const now = new Date();
  const nextStatus = resolveStatusFromEventType(event.type) ?? row.status;
  const payload = {
    ...(event.payload ?? {}),
    ...(event.label ? { label: event.label } : {}),
  };

  await db.insert(taskEvent).values({
    taskId,
    type: event.type,
    payload,
  });

  const updateValues: Partial<typeof task.$inferInsert> = {
    currentStep: label,
    lastEventAt: now,
    lastEventType: event.type,
    status: nextStatus,
  };

  if (event.progressPercent !== undefined) {
    updateValues.progressPercent = Math.min(
      Math.max(event.progressPercent, 0),
      100
    );
  }

  if (event.type === "workflow.started") {
    updateValues.startedAt = now;
    updateValues.status = "running";
  }

  if (event.type === "workflow.completed") {
    updateValues.completedAt = now;
    updateValues.progressPercent = 100;
    updateValues.status = "completed";
  }

  if (event.type === "workflow.failed") {
    updateValues.completedAt = now;
    updateValues.status = "failed";
  }

  const [updated] = await db
    .update(task)
    .set(updateValues)
    .where(eq(task.id, taskId))
    .returning();

  if (!updated) {
    throw new TaskNotFoundError();
  }

  if (event.type === "workflow.completed") {
    const deliverableId =
      typeof event.payload?.deliverableId === "string"
        ? event.payload.deliverableId
        : undefined;

    await createNotification({
      userId: updated.userId,
      taskId: updated.id,
      type: "task.completed",
      payload: {
        deliverableId: deliverableId ?? null,
        staffId: updated.staffId,
        title: truncateBrief(updated.brief, 120),
        preview: null,
      },
    });
  }

  const staffMember = await db.query.staff.findFirst({
    where: eq(staff.id, updated.staffId),
  });

  if (!staffMember) {
    throw new Error("Staff member not found for task.");
  }

  const deliverableRow = await db.query.deliverable.findFirst({
    where: eq(deliverable.taskId, updated.id),
  });

  return mapTaskSummary(updated, mapStaffSummary(staffMember), deliverableRow);
}

export function buildTaskProgressSsePayload(
  taskRow: TaskSummary
): TaskProgressSsePayload {
  return {
    type: "task.progress",
    taskId: taskRow.id,
    staffId: taskRow.staffId,
    progressPercent: taskRow.progressPercent,
    currentStep:
      taskRow.currentStep ?? resolveTaskEventLabel("workflow.started"),
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
  error: string
): TaskFailedSsePayload {
  return {
    type: "task.failed",
    taskId: taskRow.id,
    staffId: taskRow.staffId,
    error,
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

export { buildPreviewExcerpt, truncateBrief };
