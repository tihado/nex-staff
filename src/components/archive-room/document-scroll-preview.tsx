"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { DocumentPdfScroll } from "@/components/archive-room/document-pdf-scroll";
import { FantasyScrollFrame } from "@/components/archive-room/fantasy-scroll-frame";
import { PixelButton, PixelCloseButton } from "@/components/pixel";
import { fetchDocumentText, resolvePreviewKind } from "@/lib/documents/preview";
import type { DocumentSummary } from "@/lib/documents/types";
import { cn } from "@/lib/utils";

interface DocumentScrollPreviewProps {
  document: DocumentSummary;
  onClose: () => void;
}

export function DocumentScrollPreview({
  document,
  onClose,
}: DocumentScrollPreviewProps) {
  const previewKind = resolvePreviewKind(document.mimeType);
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(
    previewKind === "markdown" || previewKind === "text"
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (previewKind !== "markdown" && previewKind !== "text") {
      return;
    }

    let cancelled = false;

    const loadContent = async () => {
      setLoading(true);
      setError(null);

      try {
        const text = await fetchDocumentText(document.blobUrl);

        if (!cancelled) {
          setContent(text);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to open scroll."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadContent().catch(() => {
      /* handled above */
    });

    return () => {
      cancelled = true;
    };
  }, [document.blobUrl, previewKind]);

  return (
    <div
      aria-labelledby="scroll-preview-title"
      aria-modal="true"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(20,12,8,0.72)] p-4"
      role="dialog"
    >
      <div className="flex max-h-[min(96vh,900px)] w-full max-w-4xl flex-col items-center gap-4">
        <div className="flex w-full max-w-[640px] items-start justify-end">
          <PixelCloseButton
            aria-label="Close scroll preview"
            onClick={onClose}
          />
        </div>

        <FantasyScrollFrame className="w-full px-2 sm:px-0">
          <div
            className={cn(
              "relative w-full px-8 py-8 sm:px-12 sm:py-10",
              previewKind === "pdf"
                ? "max-h-[min(72vh,680px)] overflow-y-auto"
                : "max-h-[min(72vh,680px)] min-h-[380px] overflow-y-auto"
            )}
          >
            <p
              className="mb-4 border-[#C4A574] border-b pb-3 text-center font-[family-name:var(--font-pixel)] text-[#6B4E2E] text-[9px] uppercase tracking-[0.18em]"
              id="scroll-preview-title"
            >
              {document.filename}
            </p>

            {loading ? (
              <p className="text-center font-[family-name:var(--font-body)] text-[#5C4A2E] text-[20px]">
                Unrolling scroll…
              </p>
            ) : null}

            {error ? (
              <p
                className="text-center font-[family-name:var(--font-body)] text-[20px] text-alert"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            {previewKind === "pdf" ? (
              <DocumentPdfScroll blobUrl={document.blobUrl} />
            ) : null}

            {!(loading || error) && previewKind === "markdown" && content ? (
              <div
                className={cn(
                  "font-[family-name:var(--font-body)] text-[#4A2E1A] text-[length:var(--font-size-dialogue)] leading-relaxed",
                  "[&_code]:rounded-sm [&_code]:bg-[#E8D5A8] [&_code]:px-1",
                  "[&_h1]:mt-0 [&_h1]:text-center [&_h1]:font-[family-name:var(--font-pixel)] [&_h1]:text-[11px] [&_h1]:uppercase",
                  "[&_h2]:font-[family-name:var(--font-pixel)] [&_h2]:text-[10px] [&_h2]:uppercase",
                  "[&_pre]:overflow-x-auto [&_pre]:border [&_pre]:border-[#C4A574] [&_pre]:bg-[#F4E4BC] [&_pre]:p-3"
                )}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content}
                </ReactMarkdown>
              </div>
            ) : null}

            {!(loading || error) && previewKind === "text" && content ? (
              <pre className="whitespace-pre-wrap font-[family-name:var(--font-body)] text-[#4A2E1A] text-[length:var(--font-size-dialogue)] leading-relaxed">
                {content}
              </pre>
            ) : null}

            {!(loading || error) && previewKind === "unsupported" ? (
              <p className="text-center font-[family-name:var(--font-body)] text-[#5C4A2E] text-[20px]">
                This scroll cannot be read here. Open the original file instead.
              </p>
            ) : null}
          </div>
        </FantasyScrollFrame>

        <div className="flex flex-wrap justify-center gap-2">
          <a
            className="pixel-wood-btn inline-flex min-h-9 cursor-pointer select-none items-center justify-center px-5 py-2 font-[family-name:var(--font-pixel)] text-[length:var(--font-size-nameplate)] uppercase no-underline transition-none focus-visible:outline-2 focus-visible:outline-pixel-accent focus-visible:outline-offset-2"
            href={document.blobUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            Open original
          </a>
          <PixelButton onClick={onClose}>Roll up</PixelButton>
        </div>
      </div>
    </div>
  );
}
