"use client";

import { DocumentItem } from "@/components/archive-room/document-item";
import { LibraryShelfRow } from "@/components/archive-room/library-shelf-row";
import { UploadSlot } from "@/components/archive-room/upload-slot";
import { PixelBookshelfWall } from "@/components/workplace/office-sprites";
import type { DocumentSummary } from "@/lib/documents/types";
import { cn } from "@/lib/utils";

interface DocumentShelfProps {
  documents: DocumentSummary[];
  onSelect: (documentId: string) => void;
  onUpload: (file: File) => void;
  selectedId: string | null;
  uploadDisabled?: boolean;
}

const DOCUMENTS_PER_SHELF = 7;

function chunkDocuments<T>(items: T[], size: number): T[][] {
  if (items.length === 0) {
    return [[]];
  }

  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

export function DocumentShelf({
  documents,
  onSelect,
  onUpload,
  selectedId,
  uploadDisabled = false,
}: DocumentShelfProps) {
  const shelves = chunkDocuments(documents, DOCUMENTS_PER_SHELF);

  return (
    <div
      className={cn(
        "archive-library relative flex-1 overflow-y-auto rounded-sm border-2 border-wood-dark bg-bg-dialogue/60 p-4",
        uploadDisabled ? "opacity-70" : undefined
      )}
    >
      <PixelBookshelfWall
        className="pointer-events-none absolute top-4 right-4 opacity-30"
        size={88}
      />
      <PixelBookshelfWall
        className="pointer-events-none absolute bottom-6 left-4 opacity-20"
        size={72}
      />

      <div className="relative flex flex-col gap-5">
        {shelves.map((shelfDocuments, shelfIndex) => {
          const isLastShelf = shelfIndex === shelves.length - 1;
          const shelfLabel = `Shelf ${String.fromCharCode(65 + shelfIndex)}`;

          return (
            <LibraryShelfRow key={shelfLabel} label={shelfLabel}>
              {shelfDocuments.map((document, documentIndex) => (
                <DocumentItem
                  filename={document.filename}
                  key={document.id}
                  mimeType={document.mimeType}
                  onSelect={() => onSelect(document.id)}
                  selected={selectedId === document.id}
                  stackIndex={documentIndex % 3}
                />
              ))}
              {isLastShelf ? (
                <UploadSlot disabled={uploadDisabled} onUpload={onUpload} />
              ) : null}
            </LibraryShelfRow>
          );
        })}
      </div>
    </div>
  );
}
