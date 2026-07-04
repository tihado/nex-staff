"use client";

import { useEffect, useRef, useState } from "react";
import { PixelButton, PixelIcon } from "@/components/pixel";
import type { DialogueSubmitPayload } from "@/hooks/use-dialogue-engine";
import { uploadDocument } from "@/lib/documents/upload-client";
import { cn } from "@/lib/utils";
import { DialogueMarkdown } from "./dialogue-markdown";

const MARKDOWN_SYNTAX_PATTERN =
  /(\*\*|__|`+|^#{1,6}\s|^\s*[-*+]\s|^\s*\d+\.\s|\[.+\]\(.+\)|^>\s)/m;

const ACCEPTED_FILE_TYPES =
  ".pdf,.md,.markdown,.txt,application/pdf,text/markdown,text/plain";

/** Show live preview only when markdown would render differently from plain text. */
function hasMarkdownSyntax(text: string): boolean {
  return MARKDOWN_SYNTAX_PATTERN.test(text);
}

interface PendingFileAttachment {
  file: File;
  id: string;
}

interface DialogueInputProps {
  align?: "left" | "right";
  compact?: boolean;
  disabled?: boolean;
  onSubmit: (payload: DialogueSubmitPayload) => void | Promise<void>;
  playerName: string;
}

/**
 * Free-text input embedded inside the dialogue box (state `player-input`).
 * Supports Markdown preview and document attachments.
 */
export function DialogueInput({
  playerName,
  disabled = false,
  compact = false,
  align = "left",
  onSubmit,
}: DialogueInputProps) {
  const [value, setValue] = useState("");
  const [pendingFiles, setPendingFiles] = useState<PendingFileAttachment[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const isBusy = disabled || isUploading;
  const canSend =
    (value.trim().length > 0 || pendingFiles.length > 0) && !isBusy;
  const showPreview = value.trim().length > 0 && hasMarkdownSyntax(value);

  const removePendingFile = (id: string) => {
    setPendingFiles((current) => current.filter((item) => item.id !== id));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const selectedFiles = input.files;

    if (!selectedFiles || selectedFiles.length === 0 || isBusy) {
      input.value = "";
      return;
    }

    const newAttachments = Array.from(selectedFiles).map((file) => ({
      id: crypto.randomUUID(),
      file,
    }));

    input.value = "";
    setUploadError(null);
    setPendingFiles((current) => [...current, ...newAttachments]);
  };

  const submit = async () => {
    const text = value.trim();
    const filesToUpload = pendingFiles;

    if ((!text && filesToUpload.length === 0) || isBusy) {
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      const uploadedFiles =
        filesToUpload.length > 0
          ? await Promise.all(
              filesToUpload.map((item) => uploadDocument(item.file))
            )
          : [];

      const messageText =
        text ||
        (uploadedFiles.length > 0 ? "Review the attached file(s)." : "");

      if (!messageText) {
        return;
      }

      await onSubmit({
        text: messageText,
        ...(uploadedFiles.length > 0
          ? {
              files: uploadedFiles.map((uploaded) => ({
                type: "file" as const,
                filename: uploaded.filename,
                mediaType: uploaded.mimeType,
                url: uploaded.blobUrl,
              })),
            }
          : {}),
      });

      setValue("");
      setPendingFiles([]);
    } catch (submitFailure) {
      setUploadError(
        submitFailure instanceof Error
          ? submitFailure.message
          : "Failed to send message with attachments."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = () => {
    submit().catch(() => {
      // submit() already surfaces errors via uploadError state.
    });
  };

  return (
    <div className="relative">
      {compact ? (
        <div
          className={cn(
            "mb-1.5 flex",
            align === "right" ? "justify-end" : "justify-start"
          )}
        >
          <div className="inline-flex items-center gap-1 border-2 border-border-dialogue bg-nameplate-bg px-2 py-0.5 font-pixel text-[8px] text-sun uppercase tracking-widest [text-shadow:1px_1px_0_#5c3a1a]">
            <PixelIcon name="chevron-down" size={10} /> {playerName}
          </div>
        </div>
      ) : (
        <div className="absolute -top-[14px] left-4 z-10 flex items-center gap-1 border-[3px] border-border-dialogue bg-nameplate-bg px-3 py-1 font-pixel text-[10px] text-sun uppercase tracking-widest [text-shadow:1px_1px_0_#5c3a1a]">
          <PixelIcon name="chevron-down" size={12} /> {playerName}
        </div>
      )}
      <div
        className={cn(
          "pixel-frame bg-bg-dialogue pb-4",
          compact ? "px-3 pt-2" : "px-5 pt-6"
        )}
      >
        <input
          accept={ACCEPTED_FILE_TYPES}
          className="sr-only"
          disabled={isBusy}
          id="dialogue-file-input"
          multiple
          onChange={handleFileChange}
          ref={fileInputRef}
          type="file"
        />

        <label className="sr-only" htmlFor="dialogue-input">
          Message {playerName}
        </label>

        {pendingFiles.length > 0 ? (
          <div className="mb-3 flex flex-wrap gap-2 border-border-dialogue border-b-[2px] pb-3">
            {pendingFiles.map((attachment) => (
              <span
                className="inline-flex max-w-full items-center gap-1 border-2 border-border-dialogue bg-panel px-2 py-1 font-pixel text-[9px] text-ink"
                key={attachment.id}
              >
                <PixelIcon aria-hidden name="file" size={12} />
                <span className="max-w-[12rem] truncate">
                  {attachment.file.name}
                </span>
                <button
                  aria-label={`Remove ${attachment.file.name}`}
                  className="inline-flex size-4 items-center justify-center text-ink-muted hover:text-ink disabled:opacity-50"
                  disabled={isBusy}
                  onClick={() => removePendingFile(attachment.id)}
                  type="button"
                >
                  <PixelIcon name="close" size={10} />
                </button>
              </span>
            ))}
          </div>
        ) : null}

        {showPreview ? (
          <section
            aria-label="Markdown preview"
            className="mb-3 max-h-[min(24vh,10rem)] overflow-y-auto border-border-dialogue border-b-[2px] pb-3"
          >
            <DialogueMarkdown content={value} variant="user" />
          </section>
        ) : null}

        <textarea
          className={cn(
            "w-full resize-none bg-transparent font-pixel text-pixel-text leading-[1.8] outline-none placeholder:text-pixel-text-muted disabled:cursor-not-allowed disabled:opacity-50",
            compact ? "min-h-[2.5rem] text-[10px]" : "min-h-[4rem] text-[11px]"
          )}
          disabled={isBusy}
          id="dialogue-input"
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="What do you want to say?..."
          ref={textareaRef}
          rows={2}
          value={value}
        />

        {uploadError ? (
          <p className="pt-2 font-pixel text-[9px] text-alert">{uploadError}</p>
        ) : null}

        <div className="flex items-center justify-end gap-2 pt-2">
          <PixelButton
            aria-label="Attach document"
            className="px-2"
            disabled={isBusy}
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            <PixelIcon name="paperclip" size={14} />
          </PixelButton>
          <PixelButton disabled={!canSend} onClick={handleSubmit}>
            <span className="flex items-center gap-1">
              {isUploading ? "Uploading..." : "Send"}{" "}
              <PixelIcon name="send" size={14} />
            </span>
          </PixelButton>
        </div>
      </div>
    </div>
  );
}
