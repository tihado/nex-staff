"use client";

import { useCallback, useEffect, useState } from "react";
import { DialogueMarkdown } from "@/components/dialogue/dialogue-markdown";
import { PixelButton, PixelCloseButton, PixelPanel } from "@/components/pixel";

import { uiStrings } from "@/lib/i18n/ui";

interface DeliverablePreviewOverlayProps {
  content: string;
  contentType: string;
  onClose: () => void;
  title: string;
  websitePreviewUrl?: string | null;
}

function downloadFilename(title: string, contentType: string): string {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 64);

  if (contentType.includes("markdown") || contentType.includes("text")) {
    return `${base || "deliverable"}.md`;
  }

  return base || "deliverable.txt";
}

function copyButtonLabel(state: "idle" | "copied" | "error"): string {
  if (state === "copied") {
    return uiStrings.deliverable.copied;
  }

  if (state === "error") {
    return uiStrings.deliverable.copyFailed;
  }

  return uiStrings.deliverable.copy;
}

export function DeliverablePreviewOverlay({
  title,
  content,
  contentType,
  onClose,
  websitePreviewUrl,
}: DeliverablePreviewOverlayProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle"
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }, [content]);

  useEffect(() => {
    if (copyState === "idle") {
      return;
    }

    const timer = window.setTimeout(() => {
      setCopyState("idle");
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [copyState]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = downloadFilename(title, contentType);
    anchor.click();
    URL.revokeObjectURL(url);
  }, [content, contentType, title]);

  return (
    <div
      aria-labelledby="deliverable-preview-title"
      aria-modal="true"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[var(--overlay-backdrop)] p-4"
      role="dialog"
    >
      <PixelPanel
        className="flex max-h-[min(90vh,720px)] min-h-0 w-full max-w-3xl flex-col overflow-hidden p-4 sm:p-6"
        contentClassName="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden pt-4"
        title={uiStrings.deliverable.title}
      >
        <div className="flex shrink-0 items-start justify-between gap-3">
          <h2
            className="font-body text-[22px] text-ink leading-snug"
            id="deliverable-preview-title"
          >
            {title}
          </h2>
          <PixelCloseButton
            aria-label={uiStrings.deliverable.closePreview}
            onClick={onClose}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain border-2 border-wood bg-panel p-4">
          <DialogueMarkdown content={content} />
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {websitePreviewUrl ? (
            <PixelButton
              onClick={() => {
                window.open(websitePreviewUrl, "_blank", "noopener,noreferrer");
              }}
              type="button"
            >
              Mở website preview
            </PixelButton>
          ) : null}
          <PixelButton onClick={handleCopy} type="button">
            {copyButtonLabel(copyState)}
          </PixelButton>
          <PixelButton onClick={handleDownload} type="button">
            {uiStrings.deliverable.download}
          </PixelButton>
          <PixelButton onClick={onClose} type="button">
            {uiStrings.close}
          </PixelButton>
        </div>
      </PixelPanel>
    </div>
  );
}
