import { and, asc, count, desc, eq, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import { staff, staffDocument, task } from "@/db/schema";
import { getDocumentById } from "@/lib/documents/service";
import { pickRandomAvatarSprite } from "@/lib/staff/avatars";
import { DEFAULT_STAFF_MODEL, MAX_STAFF_PER_USER } from "@/lib/staff/constants";
import { StaffLimitError, StaffValidationError } from "@/lib/staff/errors";
import { resolveStaffProfile } from "@/lib/staff/templates";
import type {
  HireStaffInput,
  HireStaffResult,
  StaffDetail,
  StaffStatus,
  StaffSummary,
  UpdateStaffInput,
  UpdateStaffResult,
} from "@/lib/staff/types";

function toIsoString(value: Date): string {
  return value.toISOString();
}

async function getActiveTaskCountsByStaff(
  staffIds: string[]
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();

  if (staffIds.length === 0) {
    return counts;
  }

  const rows = await db
    .select({
      activeTasks: count(),
      staffId: task.staffId,
    })
    .from(task)
    .where(
      and(
        inArray(task.staffId, staffIds),
        or(eq(task.status, "pending"), eq(task.status, "running"))
      )
    )
    .groupBy(task.staffId);

  for (const row of rows) {
    counts.set(row.staffId, Number(row.activeTasks));
  }

  return counts;
}

function resolveDisplayStatus(
  storedStatus: StaffStatus,
  activeTasks: number
): StaffStatus {
  if (activeTasks > 0) {
    return "working";
  }

  return storedStatus;
}

function mapStaffSummary(
  row: typeof staff.$inferSelect,
  activeTasks: number
): StaffSummary {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    avatarSprite: row.avatarSprite,
    status: resolveDisplayStatus(row.status, activeTasks),
    useSandbox: row.useSandbox,
    hiredAt: toIsoString(row.hiredAt),
    activeTasks,
  };
}

async function getDocumentIdsForStaff(staffId: string): Promise<string[]> {
  const links = await db.query.staffDocument.findMany({
    where: eq(staffDocument.staffId, staffId),
    columns: { documentId: true },
  });

  return links.map((link) => link.documentId);
}

async function replaceStaffDocuments(
  staffId: string,
  documentIds: string[]
): Promise<void> {
  await db.delete(staffDocument).where(eq(staffDocument.staffId, staffId));

  if (documentIds.length === 0) {
    return;
  }

  await db.insert(staffDocument).values(
    documentIds.map((documentId) => ({
      staffId,
      documentId,
    }))
  );
}

async function validateDocumentIds(
  userId: string,
  documentIds: string[] | undefined
): Promise<string[]> {
  if (!documentIds || documentIds.length === 0) {
    return [];
  }

  const uniqueIds = [...new Set(documentIds)];

  for (const documentId of uniqueIds) {
    const doc = await getDocumentById(userId, documentId);
    if (!doc) {
      throw new StaffValidationError(
        `Document ${documentId} was not found for this user.`
      );
    }
  }

  return uniqueIds;
}

async function assertStaffLimit(userId: string): Promise<void> {
  const [result] = await db
    .select({ total: count() })
    .from(staff)
    .where(eq(staff.userId, userId));

  const total = Number(result?.total ?? 0);

  if (total >= MAX_STAFF_PER_USER) {
    throw new StaffLimitError(MAX_STAFF_PER_USER);
  }
}

async function findDuplicateNameWarning(
  userId: string,
  name: string,
  excludeStaffId?: string
): Promise<string | undefined> {
  const existing = await db.query.staff.findFirst({
    where: and(eq(staff.userId, userId), eq(staff.name, name)),
    columns: { id: true },
  });

  if (!existing || existing.id === excludeStaffId) {
    return;
  }

  return `Staff named "${name}" already exists.`;
}

export async function listStaff(
  userId: string,
  options: { status?: StaffStatus } = {}
): Promise<StaffSummary[]> {
  const rows = await db.query.staff.findMany({
    where: eq(staff.userId, userId),
    orderBy: asc(staff.hiredAt),
  });

  const activeTaskCounts = await getActiveTaskCountsByStaff(
    rows.map((row) => row.id)
  );

  const summaries = rows.map((row) =>
    mapStaffSummary(row, activeTaskCounts.get(row.id) ?? 0)
  );

  if (!options.status) {
    return summaries;
  }

  return summaries.filter((summary) => summary.status === options.status);
}

export async function hireStaff(
  userId: string,
  input: HireStaffInput
): Promise<HireStaffResult> {
  await assertStaffLimit(userId);

  const documentIds = await validateDocumentIds(userId, input.documentIds);
  const profile = resolveStaffProfile(input);
  const duplicateNameWarning = await findDuplicateNameWarning(
    userId,
    input.name
  );

  const [row] = await db
    .insert(staff)
    .values({
      userId,
      name: input.name,
      role: profile.role,
      avatarSprite: pickRandomAvatarSprite(),
      model: DEFAULT_STAFF_MODEL,
      instructions: profile.instructions,
      skills: profile.skills,
      tools: profile.tools,
      useSandbox: profile.useSandbox,
      status: "idle",
    })
    .returning();

  if (!row) {
    throw new Error("Failed to create staff member.");
  }

  if (documentIds.length > 0) {
    await replaceStaffDocuments(row.id, documentIds);
  }

  const { createStaffHiredNotification } = await import(
    "@/lib/notifications/service"
  );
  await createStaffHiredNotification(userId, {
    staffId: row.id,
    name: row.name,
    role: row.role,
    avatarSprite: row.avatarSprite,
  });

  return {
    ...mapStaffSummary(row, 0),
    duplicateNameWarning,
  };
}

export async function getStaffById(
  userId: string,
  staffId: string
): Promise<StaffDetail | null> {
  const row = await db.query.staff.findFirst({
    where: and(eq(staff.id, staffId), eq(staff.userId, userId)),
  });

  if (!row) {
    return null;
  }

  const activeTaskCounts = await getActiveTaskCountsByStaff([row.id]);
  const activeTasks = activeTaskCounts.get(row.id) ?? 0;
  const documentIds = await getDocumentIdsForStaff(row.id);

  const recentTasks = await db.query.task.findMany({
    where: and(eq(task.staffId, row.id), eq(task.userId, userId)),
    orderBy: desc(task.createdAt),
    limit: 10,
    columns: {
      id: true,
      brief: true,
      status: true,
      createdAt: true,
    },
  });

  return {
    ...mapStaffSummary(row, activeTasks),
    instructions: row.instructions,
    model: row.model,
    skills: row.skills ?? [],
    tools: row.tools ?? [],
    documentIds,
    recentTasks: recentTasks.map((taskRow) => ({
      id: taskRow.id,
      brief: taskRow.brief,
      status: taskRow.status,
      createdAt: toIsoString(taskRow.createdAt),
    })),
  };
}

export async function updateStaff(
  userId: string,
  staffId: string,
  input: UpdateStaffInput
): Promise<UpdateStaffResult | null> {
  const existing = await db.query.staff.findFirst({
    where: and(eq(staff.id, staffId), eq(staff.userId, userId)),
    columns: { id: true },
  });

  if (!existing) {
    return null;
  }

  let duplicateNameWarning: string | undefined;

  if (input.documentIds !== undefined) {
    const documentIds = await validateDocumentIds(userId, input.documentIds);
    await replaceStaffDocuments(staffId, documentIds);
  }

  const staffUpdates: Partial<typeof staff.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (input.name !== undefined) {
    staffUpdates.name = input.name;
    duplicateNameWarning = await findDuplicateNameWarning(
      userId,
      input.name,
      staffId
    );
  }

  if (input.role !== undefined) {
    staffUpdates.role = input.role;
  }

  if (input.instructions !== undefined) {
    staffUpdates.instructions = input.instructions;
  }

  if (input.skills !== undefined) {
    staffUpdates.skills = input.skills;
  }

  if (input.tools !== undefined) {
    staffUpdates.tools = input.tools;
  }

  if (input.useSandbox !== undefined) {
    staffUpdates.useSandbox = input.useSandbox;
  }

  if (input.model !== undefined) {
    staffUpdates.model = input.model;
  }

  const hasStaffFieldUpdates = Object.keys(staffUpdates).length > 1;

  if (hasStaffFieldUpdates) {
    await db.update(staff).set(staffUpdates).where(eq(staff.id, staffId));
  }

  const updated = await getStaffById(userId, staffId);

  if (!updated) {
    return null;
  }

  return {
    ...updated,
    duplicateNameWarning,
  };
}

export async function deleteStaff(
  userId: string,
  staffId: string
): Promise<boolean> {
  const existing = await db.query.staff.findFirst({
    where: and(eq(staff.id, staffId), eq(staff.userId, userId)),
    columns: { id: true },
  });

  if (!existing) {
    return false;
  }

  await db.delete(task).where(eq(task.staffId, staffId));
  await db.delete(staff).where(eq(staff.id, staffId));

  return true;
}
