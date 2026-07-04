import { del, put } from "@vercel/blob";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { document, staff, staffDocument } from "@/db/schema";
import { buildBlobPath, sanitizeFilename } from "@/lib/documents/constants";
import type {
  DocumentDetail,
  DocumentSummary,
  DocumentUploadResult,
} from "@/lib/documents/types";

function toIsoString(value: Date): string {
  return value.toISOString();
}

function mapDocumentSummary(
  row: typeof document.$inferSelect,
  linkedStaffIds: string[]
): DocumentSummary {
  return {
    id: row.id,
    filename: row.filename,
    mimeType: row.mimeType,
    status: row.status,
    uploadedAt: toIsoString(row.uploadedAt),
    linkedStaffIds,
  };
}

async function getLinkedStaffIdsByDocument(
  documentIds: string[]
): Promise<Map<string, string[]>> {
  const linkedStaffIdsByDocument = new Map<string, string[]>();

  if (documentIds.length === 0) {
    return linkedStaffIdsByDocument;
  }

  const links = await db.query.staffDocument.findMany({
    where: (staffDocumentTable, { inArray }) =>
      inArray(staffDocumentTable.documentId, documentIds),
    columns: {
      documentId: true,
      staffId: true,
    },
  });

  for (const link of links) {
    const existing = linkedStaffIdsByDocument.get(link.documentId) ?? [];
    existing.push(link.staffId);
    linkedStaffIdsByDocument.set(link.documentId, existing);
  }

  return linkedStaffIdsByDocument;
}

export async function uploadDocument(
  userId: string,
  file: File,
  mimeType: string
): Promise<DocumentUploadResult> {
  const documentId = crypto.randomUUID();
  const filename = sanitizeFilename(file.name);
  const pathname = buildBlobPath(userId, documentId, filename);

  const blob = await put(pathname, file, {
    access: "public",
    addRandomSuffix: false,
    contentType: mimeType,
  });

  try {
    const [row] = await db
      .insert(document)
      .values({
        id: documentId,
        userId,
        filename,
        mimeType,
        blobUrl: blob.url,
        status: "ready",
      })
      .returning();

    if (!row) {
      throw new Error("Failed to persist uploaded document.");
    }

    return {
      id: row.id,
      filename: row.filename,
      mimeType: row.mimeType,
      status: row.status,
      uploadedAt: toIsoString(row.uploadedAt),
    };
  } catch (error) {
    await del(blob.url).catch(() => undefined);
    throw error;
  }
}

export async function createDocumentFromContent(
  userId: string,
  input: {
    content: string;
    filename: string;
    mimeType: string;
  }
): Promise<DocumentUploadResult> {
  const documentId = crypto.randomUUID();
  const filename = sanitizeFilename(input.filename);
  const pathname = buildBlobPath(userId, documentId, filename);

  const blob = await put(pathname, input.content, {
    access: "public",
    addRandomSuffix: false,
    contentType: input.mimeType,
  });

  try {
    const [row] = await db
      .insert(document)
      .values({
        id: documentId,
        userId,
        filename,
        mimeType: input.mimeType,
        blobUrl: blob.url,
        status: "ready",
      })
      .returning();

    if (!row) {
      throw new Error("Failed to persist created document.");
    }

    return {
      id: row.id,
      filename: row.filename,
      mimeType: row.mimeType,
      status: row.status,
      uploadedAt: toIsoString(row.uploadedAt),
    };
  } catch (error) {
    await del(blob.url).catch(() => undefined);
    throw error;
  }
}

export async function listDocuments(
  userId: string,
  options: { staffId?: string } = {}
): Promise<DocumentSummary[]> {
  if (options.staffId) {
    const staffRow = await db.query.staff.findFirst({
      where: and(eq(staff.id, options.staffId), eq(staff.userId, userId)),
      columns: { id: true },
    });

    if (!staffRow) {
      return [];
    }

    const rows = await db
      .select({ document })
      .from(document)
      .innerJoin(staffDocument, eq(staffDocument.documentId, document.id))
      .where(
        and(eq(document.userId, userId), eq(staffDocument.staffId, staffRow.id))
      )
      .orderBy(desc(document.uploadedAt));

    return rows.map(({ document: row }) =>
      mapDocumentSummary(row, [staffRow.id])
    );
  }

  const rows = await db.query.document.findMany({
    where: eq(document.userId, userId),
    orderBy: desc(document.uploadedAt),
  });

  const linkedStaffIdsByDocument = await getLinkedStaffIdsByDocument(
    rows.map((row) => row.id)
  );

  return rows.map((row) =>
    mapDocumentSummary(row, linkedStaffIdsByDocument.get(row.id) ?? [])
  );
}

export async function getDocumentById(
  userId: string,
  documentId: string
): Promise<DocumentDetail | null> {
  const row = await db.query.document.findFirst({
    where: and(eq(document.id, documentId), eq(document.userId, userId)),
  });

  if (!row) {
    return null;
  }

  const linkedStaffIdsByDocument = await getLinkedStaffIdsByDocument([row.id]);

  return {
    ...mapDocumentSummary(row, linkedStaffIdsByDocument.get(row.id) ?? []),
    blobUrl: row.blobUrl,
  };
}

export async function deleteDocument(
  userId: string,
  documentId: string
): Promise<boolean> {
  const row = await db.query.document.findFirst({
    where: and(eq(document.id, documentId), eq(document.userId, userId)),
    columns: {
      id: true,
      blobUrl: true,
    },
  });

  if (!row) {
    return false;
  }

  await del(row.blobUrl).catch(() => undefined);

  await db.delete(document).where(eq(document.id, row.id));

  return true;
}
