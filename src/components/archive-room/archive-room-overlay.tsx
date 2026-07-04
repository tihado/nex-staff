"use client";

import { useEffect, useState } from "react";
import {
  DocumentDetail,
  type StaffOption,
} from "@/components/archive-room/document-detail";
import { DocumentScrollPreview } from "@/components/archive-room/document-scroll-preview";
import { DocumentShelf } from "@/components/archive-room/document-shelf";
import { PixelCloseButton, PixelPanel } from "@/components/pixel";
import { useDocuments } from "@/hooks/use-documents";
import type { DocumentSummary } from "@/lib/documents/types";
import { uiStrings } from "@/lib/i18n/ui";
import { cn } from "@/lib/utils";

interface ArchiveRoomOverlayProps {
  onClose: () => void;
  staffOptions: StaffOption[];
}

type DetailMode = "assignStaff" | "confirmDelete" | "idle";

export function ArchiveRoomOverlay({
  onClose,
  staffOptions,
}: ArchiveRoomOverlayProps) {
  const { assignToStaff, documents, error, loading, refresh, remove, upload } =
    useDocuments();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<DetailMode>("idle");
  const [actionError, setActionError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewDocument, setPreviewDocument] =
    useState<DocumentSummary | null>(null);

  const selectedDocument =
    documents.find((document) => document.id === selectedId) ?? null;

  useEffect(() => {
    refresh().catch(() => {
      /* handled by hook error state */
    });
  }, [refresh]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      if (previewDocument) {
        setPreviewDocument(null);
        return;
      }

      if (mode === "idle") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode, onClose, previewDocument]);

  useEffect(() => {
    const handleFocus = () => {
      refresh().catch(() => {
        /* handled by hook error state */
      });
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refresh]);

  useEffect(() => {
    if (
      selectedId &&
      !documents.some((document) => document.id === selectedId)
    ) {
      setSelectedId(null);
      setMode("idle");
    }
  }, [documents, selectedId]);

  const handleUpload = async (file: File) => {
    setActionError(null);
    setUploading(true);

    try {
      await upload(file);
      setSelectedId(null);
      setMode("idle");
    } catch (uploadError) {
      setActionError(
        uploadError instanceof Error
          ? uploadError.message
          : "Failed to upload document."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedDocument) {
      return;
    }

    setActionError(null);

    try {
      await remove(selectedDocument.id);
      setSelectedId(null);
      setMode("idle");
    } catch (deleteError) {
      setActionError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete document."
      );
      setMode("idle");
    }
  };

  const handleConfirmAssign = async (staffId: string) => {
    if (!selectedDocument) {
      return;
    }

    setActionError(null);

    try {
      await assignToStaff(selectedDocument.id, staffId);
      setMode("idle");
    } catch (assignError) {
      setActionError(
        assignError instanceof Error
          ? assignError.message
          : "Failed to assign document."
      );
      setMode("idle");
    }
  };

  return (
    <div
      aria-labelledby="archive-room-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-backdrop)] p-4"
      role="dialog"
    >
      <PixelPanel
        className={cn(
          "flex max-h-[min(90vh,680px)] w-full max-w-4xl flex-col gap-4 p-4 sm:p-6"
        )}
        title="Document Library"
      >
        <div className="flex items-start justify-end">
          <PixelCloseButton
            aria-label="Close document library"
            onClick={onClose}
          />
        </div>

        <p
          className="font-[family-name:var(--font-body)] text-[20px] text-text-muted"
          id="archive-room-title"
        >
          {uiStrings.archive.description}
        </p>

        {loading ? (
          <p className="font-[family-name:var(--font-body)] text-[20px] text-text-muted">
            Loading documents…
          </p>
        ) : null}

        {error ? (
          <p
            className="font-[family-name:var(--font-body)] text-[20px] text-alert"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        {uploading ? (
          <p className="font-[family-name:var(--font-body)] text-[20px] text-text-muted">
            Uploading…
          </p>
        ) : null}

        {actionError && !selectedDocument ? (
          <p
            className="font-[family-name:var(--font-body)] text-[20px] text-alert"
            role="alert"
          >
            {actionError}
          </p>
        ) : null}

        <DocumentShelf
          documents={documents}
          onSelect={(documentId) => {
            setSelectedId(documentId);
            setMode("idle");
            setActionError(null);
          }}
          onUpload={handleUpload}
          selectedId={selectedId}
          uploadDisabled={uploading}
        />

        {selectedDocument ? (
          <DocumentDetail
            actionError={actionError}
            document={selectedDocument}
            mode={mode}
            onAssignStaff={() => {
              setMode("assignStaff");
              setActionError(null);
            }}
            onCancelAction={() => {
              setMode("idle");
              setActionError(null);
            }}
            onConfirmAssign={handleConfirmAssign}
            onConfirmDelete={handleConfirmDelete}
            onDelete={() => {
              setMode("confirmDelete");
              setActionError(null);
            }}
            onView={() => {
              if (selectedDocument) {
                setPreviewDocument(selectedDocument);
              }
            }}
            staffOptions={staffOptions}
          />
        ) : null}

        {previewDocument ? (
          <DocumentScrollPreview
            document={previewDocument}
            onClose={() => setPreviewDocument(null)}
          />
        ) : null}
      </PixelPanel>
    </div>
  );
}
