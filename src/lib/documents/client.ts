import type { DocumentSummary } from "@/lib/documents/types";
import type { StaffDetail } from "@/lib/staff/types";

interface DocumentsResponse {
  documents: DocumentSummary[];
}

export async function listDocuments(): Promise<DocumentSummary[]> {
  const response = await fetch("/api/documents");

  if (!response.ok) {
    throw new Error("Failed to load documents.");
  }

  const data = (await response.json()) as DocumentsResponse;
  return data.documents;
}

export async function deleteDocument(id: string): Promise<void> {
  const response = await fetch(`/api/documents/${id}`, {
    method: "DELETE",
  });

  if (response.status === 404) {
    throw new Error("Document not found.");
  }

  if (!response.ok) {
    throw new Error("Failed to delete document.");
  }
}

export async function getStaffMember(staffId: string): Promise<StaffDetail> {
  const response = await fetch(`/api/staff/${staffId}`);

  if (!response.ok) {
    throw new Error("Failed to load staff member.");
  }

  return (await response.json()) as StaffDetail;
}

export async function assignDocumentToStaff(
  staffId: string,
  documentId: string
): Promise<StaffDetail> {
  const staffMember = await getStaffMember(staffId);
  const documentIds = [...new Set([...staffMember.documentIds, documentId])];

  const response = await fetch(`/api/staff/${staffId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ documentIds }),
  });

  const payload = (await response.json()) as StaffDetail & { error?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? "Failed to assign document to staff.");
  }

  return payload;
}
