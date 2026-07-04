import { desc, eq } from "drizzle-orm";
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
  type: string;
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
    payload: row.payload ?? {},
    createdAt: toIsoString(row.createdAt),
  };
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

export function formatSseEvent(
  type: string,
  payload: Record<string, unknown>
): string {
  return `event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`;
}
