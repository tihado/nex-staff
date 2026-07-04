import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { notification } from "@/db/schema";

export interface StaffHiredPayload {
  avatarSprite: string;
  name: string;
  role: string;
  staffId: string;
}

export interface NotificationRecord {
  createdAt: string;
  id: string;
  payload: Record<string, unknown>;
  status: "delivered" | "pending";
  taskId: string | null;
  type: string;
}

export interface PendingTaskCompletion {
  deliverableId: string | null;
  notificationId: string;
  staffId: string;
  staffName: string;
  taskId: string;
  title: string;
  websitePreviewUrl: string | null;
}

function toIsoString(value: Date): string {
  return value.toISOString();
}

function mapNotification(
  row: typeof notification.$inferSelect
): NotificationRecord {
  return {
    id: row.id,
    type: row.type,
    status: row.status,
    taskId: row.taskId,
    payload: row.payload ?? {},
    createdAt: toIsoString(row.createdAt),
  };
}

function readPayloadString(
  payload: Record<string, unknown>,
  key: string
): string | null {
  const value = payload[key];

  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  return null;
}

export async function createNotification(input: {
  payload: Record<string, unknown>;
  taskId?: string;
  type: string;
  userId: string;
}): Promise<NotificationRecord> {
  const [row] = await db
    .insert(notification)
    .values({
      userId: input.userId,
      taskId: input.taskId,
      type: input.type,
      payload: input.payload,
      status: "pending",
    })
    .returning();

  if (!row) {
    throw new Error("Failed to create notification.");
  }

  return mapNotification(row);
}

export function createStaffHiredNotification(
  userId: string,
  payload: StaffHiredPayload
): Promise<NotificationRecord> {
  return createNotification({
    userId,
    type: "staff.hired",
    payload: { ...payload },
  });
}

export async function listPendingNotifications(
  userId: string
): Promise<NotificationRecord[]> {
  const rows = await db.query.notification.findMany({
    where: (notificationTable, { and, eq: equals }) =>
      and(
        equals(notificationTable.userId, userId),
        equals(notificationTable.status, "pending")
      ),
    orderBy: desc(notification.createdAt),
  });

  return rows.map(mapNotification);
}

export async function listPendingTaskCompletions(
  userId: string
): Promise<PendingTaskCompletion[]> {
  const rows = await db.query.notification.findMany({
    where: and(
      eq(notification.userId, userId),
      eq(notification.status, "pending"),
      eq(notification.type, "task.completed")
    ),
    orderBy: desc(notification.createdAt),
  });

  const taskIds = rows
    .map((row) => row.taskId)
    .filter((id): id is string => Boolean(id));

  const taskRows =
    taskIds.length > 0
      ? await db.query.task.findMany({
          where: (taskTable, { and: andOp, eq: equals, inArray: inArrayOp }) =>
            andOp(
              equals(taskTable.userId, userId),
              inArrayOp(taskTable.id, taskIds)
            ),
          columns: { id: true, staffId: true, brief: true },
        })
      : [];

  const taskById = new Map(taskRows.map((row) => [row.id, row]));

  return rows.flatMap((row) => {
    if (!row.taskId) {
      return [];
    }

    const taskRow = taskById.get(row.taskId);

    if (!taskRow) {
      return [];
    }

    const payload = row.payload ?? {};
    const title =
      readPayloadString(payload, "deliverableTitle") ??
      taskRow.brief.trim().split("\n")[0]?.slice(0, 120) ??
      "Task deliverable";
    const deliverableId = readPayloadString(payload, "deliverableId");
    const websitePreviewUrl = readPayloadString(payload, "websitePreviewUrl");

    return [
      {
        notificationId: row.id,
        taskId: row.taskId,
        staffId: taskRow.staffId,
        staffName: readPayloadString(payload, "staffName") ?? "Staff",
        title,
        deliverableId,
        websitePreviewUrl,
      },
    ];
  });
}

export async function markNotificationDelivered(
  userId: string,
  notificationId: string
): Promise<boolean> {
  const existing = await db.query.notification.findFirst({
    where: (notificationTable, { and, eq: equals }) =>
      and(
        equals(notificationTable.id, notificationId),
        equals(notificationTable.userId, userId)
      ),
    columns: { id: true },
  });

  if (!existing) {
    return false;
  }

  await db
    .update(notification)
    .set({
      status: "delivered",
      deliveredAt: new Date(),
    })
    .where(eq(notification.id, notificationId));

  return true;
}

export async function markTaskNotificationDelivered(
  userId: string,
  taskId: string
): Promise<boolean> {
  const rows = await db.query.notification.findMany({
    where: and(
      eq(notification.userId, userId),
      eq(notification.taskId, taskId),
      eq(notification.status, "pending"),
      eq(notification.type, "task.completed")
    ),
    columns: { id: true },
  });

  if (rows.length === 0) {
    return false;
  }

  for (const row of rows) {
    await markNotificationDelivered(userId, row.id);
  }

  return true;
}

export function formatSseEvent(
  type: string,
  payload: Record<string, unknown>
): string {
  return `event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`;
}
