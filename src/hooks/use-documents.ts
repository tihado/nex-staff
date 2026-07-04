"use client";

import { useCallback, useState } from "react";
import {
  assignDocumentToStaff,
  deleteDocument,
  listDocuments,
} from "@/lib/documents/client";
import type { DocumentSummary } from "@/lib/documents/types";
import { uploadDocument } from "@/lib/documents/upload-client";

export interface UseDocumentsResult {
  assignToStaff: (documentId: string, staffId: string) => Promise<void>;
  documents: DocumentSummary[];
  error: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
  remove: (id: string) => Promise<void>;
  upload: (file: File) => Promise<void>;
}

export function useDocuments(): UseDocumentsResult {
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const nextDocuments = await listDocuments();
      setDocuments(nextDocuments);
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "Failed to load documents."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const upload = useCallback(async (file: File) => {
    setError(null);

    const uploaded = await uploadDocument(file);
    const optimisticDocument: DocumentSummary = {
      id: uploaded.id,
      filename: uploaded.filename,
      mimeType: uploaded.mimeType,
      blobUrl: uploaded.blobUrl,
      status: "ready",
      uploadedAt: new Date().toISOString(),
      linkedStaffIds: [],
    };

    setDocuments((current) => [optimisticDocument, ...current]);
  }, []);

  const remove = useCallback(async (id: string) => {
    setError(null);

    let previousDocuments: DocumentSummary[] = [];
    setDocuments((current) => {
      previousDocuments = current;
      return current.filter((document) => document.id !== id);
    });

    try {
      await deleteDocument(id);
    } catch (removeError) {
      setDocuments(previousDocuments);
      throw removeError;
    }
  }, []);

  const assignToStaff = useCallback(
    async (documentId: string, staffId: string) => {
      setError(null);

      await assignDocumentToStaff(staffId, documentId);

      setDocuments((current) =>
        current.map((document) => {
          if (document.id !== documentId) {
            return document;
          }

          if (document.linkedStaffIds.includes(staffId)) {
            return document;
          }

          return {
            ...document,
            linkedStaffIds: [...document.linkedStaffIds, staffId],
          };
        })
      );
    },
    []
  );

  return {
    documents,
    loading,
    error,
    refresh,
    upload,
    remove,
    assignToStaff,
  };
}
