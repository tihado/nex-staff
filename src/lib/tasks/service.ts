import { and, count, desc, eq, gte, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import {
  deliverable,
  notification,
  staff,
  type TaskMetadata,
  task,
  taskEvent,
  taskPreview,
} from "@/db/schema";
import { createNotification } from "@/lib/notifications/service";
import {
  PREVIEW_EXCERPT_LENGTH,
  RECENTLY_COMPLETED_WINDOW_MS,
} from "@/lib/tasks/constants";
import { publishTaskProgress } from "@/lib/tasks/sse";
import type {
  ActiveTaskSummary,
  DelegateTaskInput,
  DeliverableRecord,
  ProgressInput,
  RecentlyCompletedTaskSummary,
  TaskEventRecord,
  TaskStatus,
  TaskStatusSnapshot,
} from "@/lib/tasks/types";

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

  const [row] = await db
    .insert(task)
    .values({
      userId,
      staffId: input.staffId,
      chatId: input.chatId,
      brief: input.brief,
      status: "pending",
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
      label: "Đã lưu kết quả",
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
    label: "Đã lưu kết quả",
    payload: { deliverableId: row.id },
  });

  return row.id;
}

export async function markTaskFailed(
  taskId: string,
  error: unknown
): Promise<void> {
  const message =
    error instanceof Error ? error.message : "Task execution failed.";

  const taskRow = await db.query.task.findFirst({
    where: eq(task.id, taskId),
    columns: { metadata: true },
  });

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
    columns: { userId: true, staffId: true },
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

  await createNotification({
    userId: taskRow.userId,
    taskId,
    type: "task.completed",
    payload: {
      staffName: staffRow?.name ?? "Staff",
      staffRole: staffRow?.role ?? "",
      deliverableId: deliverableRow?.id ?? null,
      deliverableTitle: deliverableRow?.title ?? null,
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
