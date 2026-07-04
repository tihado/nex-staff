"use client";

import { useEffect, useRef, useState } from "react";
import { PixelButton, PixelIcon } from "@/components/pixel";
import { DialogueMarkdown } from "./dialogue-markdown";

const MARKDOWN_SYNTAX_PATTERN =
  /(\*\*|__|`+|^#{1,6}\s|^\s*[-*+]\s|^\s*\d+\.\s|\[.+\]\(.+\)|^>\s)/m;

/** Show live preview only when markdown would render differently from plain text. */
function hasMarkdownSyntax(text: string): boolean {
  return MARKDOWN_SYNTAX_PATTERN.test(text);
}

interface DialogueInputProps {
  disabled?: boolean;
  onSubmit: (text: string) => void;
  playerName: string;
}

/**
 * Free-text input embedded inside the dialogue box (state `player-input`).
 * Supports Markdown — live preview appears only when markdown syntax is used.
 */
export function DialogueInput({
  playerName,
  disabled = false,
  onSubmit,
}: DialogueInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const submit = () => {
    const text = value.trim();

    if (!text || disabled) {
      return;
    }

    onSubmit(text);
    setValue("");
  };

  const showPreview = value.trim().length > 0 && hasMarkdownSyntax(value);

  return (
    <div className="relative">
      <div className="absolute -top-[14px] left-4 z-10 flex items-center gap-1 border-[3px] border-border-dialogue bg-nameplate-bg px-3 py-1 font-pixel text-[10px] text-sun uppercase tracking-widest [text-shadow:1px_1px_0_#5c3a1a]">
        <PixelIcon name="chevron-down" size={12} /> {playerName}
      </div>
      <div className="pixel-frame bg-bg-dialogue px-5 pt-6 pb-4">
        <label className="sr-only" htmlFor="dialogue-input">
          Message {playerName}
        </label>

        {showPreview ? (
          <section
            aria-label="Markdown preview"
            className="mb-3 max-h-[min(24vh,10rem)] overflow-y-auto border-border-dialogue border-b-[2px] pb-3"
          >
            <DialogueMarkdown content={value} variant="user" />
          </section>
        ) : null}

        <textarea
          className="min-h-[4rem] w-full resize-none bg-transparent font-pixel text-[11px] text-pixel-text leading-[1.8] outline-none placeholder:text-pixel-text-muted"
          disabled={disabled}
          id="dialogue-input"
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          placeholder="What do you want to say?..."
          ref={textareaRef}
          rows={2}
          value={value}
        />
        <div className="flex items-center justify-end gap-2 pt-2">
          <PixelButton
            aria-label="Attach file"
            className="px-2"
            disabled
            title="Attach (coming soon)"
          >
            <PixelIcon name="paperclip" size={14} />
          </PixelButton>
          <PixelButton disabled={disabled || !value.trim()} onClick={submit}>
            <span className="flex items-center gap-1">
              Send <PixelIcon name="send" size={14} />
            </span>
          </PixelButton>
        </div>
      </div>
    </div>
  );
}
