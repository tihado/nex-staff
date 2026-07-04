import type { documentStatusEnum } from "@/db/schema";

export type DocumentStatus = (typeof documentStatusEnum.enumValues)[number];

export interface DocumentSummary {
  filename: string;
  id: string;
  linkedStaffIds: string[];
  mimeType: string;
  status: DocumentStatus;
  uploadedAt: string;
}

export interface DocumentDetail extends DocumentSummary {
  blobUrl: string;
}

export interface DocumentUploadResult {
  filename: string;
  id: string;
  mimeType: string;
  status: DocumentStatus;
  uploadedAt: string;
}
