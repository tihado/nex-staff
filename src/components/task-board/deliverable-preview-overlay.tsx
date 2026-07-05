"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DialogueMarkdown } from "@/components/dialogue/dialogue-markdown";
import { PixelButton, PixelCloseButton, PixelPanel } from "@/components/pixel";
import { CoderPrActionButtons } from "@/components/task-board/coder-pr-action-buttons";

import { uiStrings } from "@/lib/i18n/ui";

interface DeliverablePreviewOverlayProps {
  content: string;
  contentType: string;
  onClose: () => void;
  prMerged?: boolean;
  prUrl?: string | null;
  taskId?: string;
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

const LEADING_NEWLINES_RE = /^\n+/;

/** Avoid showing the same title twice when body repeats the heading line. */
function bodyForPreview(title: string, content: string): string {
  const trimmedTitle = title.trim();
  const trimmedContent = content.trim();

  if (!(trimmedTitle && trimmedContent.startsWith(trimmedTitle))) {
    return content;
  }

  const remainder = trimmedContent.slice(trimmedTitle.length).trimStart();

  if (remainder.startsWith("\n") || remainder.startsWith("#")) {
    return remainder.replace(LEADING_NEWLINES_RE, "");
  }

  return content;
}

export function DeliverablePreviewOverlay({
  title,
  content,
  contentType,
  onClose,
  taskId,
  websitePreviewUrl,
  prUrl,
  prMerged,
}: DeliverablePreviewOverlayProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle"
  );

  const previewBody = useMemo(
    () => bodyForPreview(title, content),
    [content, title]
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
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[var(--overlay-backdrop)] p-3 sm:p-4"
      role="dialog"
    >
      <PixelPanel
        className="flex max-h-[min(92vh,760px)] w-full max-w-3xl flex-col overflow-hidden"
        contentClassName="flex min-h-0 flex-1 flex-col overflow-hidden p-4 sm:p-5"
        title={uiStrings.deliverable.title}
        titleInset
      >
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
          <div className="flex shrink-0 items-start justify-between gap-3">
            <h2
              className="min-w-0 flex-1 font-body text-[20px] text-ink leading-snug sm:text-[22px]"
              id="deliverable-preview-title"
            >
              {title}
            </h2>
            <PixelCloseButton
              aria-label={uiStrings.deliverable.closePreview}
              className="shrink-0"
              onClick={onClose}
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-sm border-[3px] border-wood bg-[#fff9c4]/40 p-3 sm:p-4">
            <DialogueMarkdown content={previewBody} parseMarkdown />
          </div>

          <div className="pixel-button-row shrink-0 border-wood border-t-[3px] pt-3">
            <CoderPrActionButtons
              prMerged={prMerged}
              prUrl={prUrl}
              taskId={taskId}
              websitePreviewUrl={websitePreviewUrl}
            />
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
        </div>
      </PixelPanel>
    </div>
  );
}
