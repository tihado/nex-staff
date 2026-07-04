"use client";

import { useId } from "react";
import { PixelButton, PixelPanel } from "@/components/pixel";
import type { DialogueLine } from "@/hooks/use-dialogue-engine";
import { DialogueMarkdown } from "./dialogue-markdown";

interface DialogueLogProps {
  lines: DialogueLine[];
  onClose: () => void;
}

/**
 * Optional history overlay — the ONLY place the full conversation is shown as a
 * scrollable list (docs/UI-UX.md). Hidden by default to preserve RPG immersion.
 */
export function DialogueLog({ lines, onClose }: DialogueLogProps) {
  const titleId = useId();

  return (
    <div
      aria-labelledby={titleId}
      aria-modal="true"
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
    >
      <PixelPanel
        className="flex max-h-[80vh] w-full max-w-2xl flex-col"
        title="Log"
      >
        <div className="flex items-center justify-between border-border-dialogue border-b-[3px] px-4 py-2">
          <span
            className="font-pixel text-[10px] text-pixel-text-muted"
            id={titleId}
          >
            Dialogue history
          </span>
          <PixelButton
            aria-label="Close log"
            className="px-2"
            onClick={onClose}
          >
            X
          </PixelButton>
        </div>
        <ul className="flex flex-col gap-3 overflow-y-auto px-4 py-3">
          {lines.map((line, index) => (
            <li
              className="font-pixel text-[11px] text-pixel-text leading-[1.8]"
              // biome-ignore lint/suspicious/noArrayIndexKey: log lines are append-only and have no stable id
              key={`${line.speakerId}-${index}`}
            >
              <span className="text-pixel-accent">{line.speakerName}:</span>
              <div className="mt-1">
                <DialogueMarkdown
                  content={line.text}
                  variant={line.speakerId === "boss" ? "user" : "assistant"}
                />
              </div>
            </li>
          ))}
        </ul>
      </PixelPanel>
    </div>
  );
}
