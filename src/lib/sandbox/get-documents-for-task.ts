import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import type { TaskMetadata } from "@/db/schema";
import { document, staffDocument } from "@/db/schema";

export interface TaskDocumentRow {
  blobUrl: string;
  filename: string;
  id: string;
  mimeType: string;
}

export async function getDocumentsForTask(input: {
  metadata: TaskMetadata | null;
  staffId: string;
  userId: string;
}): Promise<TaskDocumentRow[]> {
  const staffLinks = await db.query.staffDocument.findMany({
    where: eq(staffDocument.staffId, input.staffId),
    columns: { documentId: true },
  });

  const metadataIds = input.metadata?.documentIds ?? [];
  const documentIds = [
    ...new Set([...staffLinks.map((link) => link.documentId), ...metadataIds]),
  ];

  if (documentIds.length === 0) {
    return [];
  }

  const rows = await db.query.document.findMany({
    where: and(
      eq(document.userId, input.userId),
      inArray(document.id, documentIds)
    ),
    columns: {
      id: true,
      filename: true,
      mimeType: true,
      blobUrl: true,
      status: true,
    },
  });

  return rows
    .filter((row) => row.status === "ready")
    .map((row) => ({
      id: row.id,
      filename: row.filename,
      mimeType: row.mimeType,
      blobUrl: row.blobUrl,
    }));
}
