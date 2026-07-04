"use client";

import { useEffect, useRef, useState } from "react";
import { PixelButton, PixelIcon } from "@/components/pixel";

interface DialogueInputProps {
  disabled?: boolean;
  onSubmit: (text: string) => void;
  playerName: string;
}

/**
 * Free-text input embedded inside the dialogue box (state `player-input`).
 * No separate bottom input bar — this replaces it (docs/UI-UX.md anti-patterns).
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

  return (
    <div className="relative">
      <div className="absolute -top-[14px] left-4 z-10 flex items-center gap-1 border-[3px] border-border-dialogue bg-nameplate-bg px-3 py-1 font-pixel text-[10px] text-sun uppercase tracking-widest [text-shadow:1px_1px_0_#5c3a1a]">
        <PixelIcon name="chevron-down" size={12} /> {playerName}
      </div>
      <div className="pixel-frame bg-bg-dialogue px-5 pt-6 pb-4">
        <label className="sr-only" htmlFor="dialogue-input">
          Message {playerName}
        </label>
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
          placeholder="Bạn muốn nói gì?..."
          ref={textareaRef}
          rows={2}
          value={value}
        />
        <div className="flex items-center justify-end gap-2 pt-2">
          <PixelButton
            aria-label="Đính kèm tệp"
            className="px-2"
            disabled
            title="Đính kèm (sắp có)"
          >
            <PixelIcon name="paperclip" size={14} />
          </PixelButton>
          <PixelButton disabled={disabled || !value.trim()} onClick={submit}>
            <span className="flex items-center gap-1">
              Gửi <PixelIcon name="send" size={14} />
            </span>
          </PixelButton>
        </div>
      </div>
    </div>
  );
}
