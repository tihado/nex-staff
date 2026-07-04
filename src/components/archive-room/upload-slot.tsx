"use client";

import { useRef } from "react";
import { PixelIcon } from "@/components/pixel";
import { cn } from "@/lib/utils";

interface UploadSlotProps {
  disabled?: boolean;
  onUpload: (file: File) => void;
}

export function UploadSlot({ disabled = false, onUpload }: UploadSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (file) {
      onUpload(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLButtonElement>) => {
    event.preventDefault();

    if (disabled) {
      return;
    }

    const file = event.dataTransfer.files.item(0);
    if (file) {
      onUpload(file);
    }
  };

  return (
    <>
      <button
        aria-label="Upload document to library"
        className={cn(
          "group relative flex h-[104px] w-10 shrink-0 cursor-pointer flex-col items-center justify-end transition-none focus-visible:outline-2 focus-visible:outline-pixel-accent focus-visible:outline-offset-2",
          disabled ? "cursor-not-allowed opacity-50" : "hover:-translate-y-0.5"
        )}
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        type="button"
      >
        <span className="relative flex h-[96px] w-9 flex-col items-center justify-center gap-1 border-2 border-wood-dark border-dashed bg-choice-bg/70 px-0.5 shadow-[2px_2px_0_rgba(122,74,36,0.2)] group-hover:border-pixel-accent group-hover:bg-choice-hover/60">
          <PixelIcon className="text-ink" name="plus" size={18} />
          <span className="font-[family-name:var(--font-pixel)] text-[7px] text-ink uppercase leading-none">
            Add
          </span>
        </span>
      </button>
      <input
        accept=".pdf,.md,.markdown,.txt,application/pdf,text/markdown,text/plain"
        className="sr-only"
        disabled={disabled}
        onChange={handleFileChange}
        ref={inputRef}
        type="file"
      />
    </>
  );
}
