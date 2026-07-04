"use client";

import { type RefObject, useRef } from "react";
import { PixelButton, PixelDialogueBox, PixelIcon } from "@/components/pixel";
import type { DialogueLine } from "@/hooks/use-dialogue-engine";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import type { DialogueChoice } from "@/lib/dialogue/types";
import { cn } from "@/lib/utils";
import { ChoiceMenu } from "./choice-menu";
import { DialogueInput } from "./dialogue-input";
import { DialogueLog } from "./dialogue-log";
import { DialogueMarkdown } from "./dialogue-markdown";
import { DialoguePortrait } from "./dialogue-portrait";

interface DialogueOverlayPanelViewProps {
  avatarSprite?: string;
  choices: DialogueChoice[];
  displayText: string;
  inputDisabled: boolean;
  isAnimating: boolean;
  isPanel: boolean;
  isThinking: boolean;
  log: DialogueLine[];
  logOpen: boolean;
  onClose: () => void;
  onCloseLog: () => void;
  onOpenLog: () => void;
  onSelectChoice: (choiceId: string) => void;
  onSubmitInput: (payload: { text: string }) => void;
  playerName: string;
  portraitIcon?: string;
  scrollRef: RefObject<HTMLDivElement | null>;
  showChoices: boolean;
  showInput: boolean;
  showNpcBox: boolean;
  speakerId: string;
  speakerName: string;
}

export function DialogueOverlayPanelView({
  speakerName,
  speakerId,
  portraitIcon,
  avatarSprite,
  displayText,
  isThinking,
  isAnimating,
  showNpcBox,
  showInput,
  showChoices,
  choices,
  inputDisabled,
  playerName,
  scrollRef,
  isPanel,
  onClose,
  onOpenLog,
  onCloseLog,
  logOpen,
  log,
  onSelectChoice,
  onSubmitInput,
}: DialogueOverlayPanelViewProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useFocusTrap(dialogRef, { active: !isPanel });

  return (
    <div
      aria-label={`Dialogue with ${speakerName}`}
      aria-modal={isPanel ? undefined : true}
      className={cn(
        "flex flex-col",
        isPanel ? "min-h-0 flex-1 bg-bg-dialogue" : "fixed inset-0 z-20"
      )}
      ref={dialogRef}
      role="dialog"
    >
      {isPanel ? null : (
        <button
          aria-label="Close dialogue"
          className="absolute inset-0 cursor-default bg-black/50"
          onClick={onClose}
          tabIndex={-1}
          type="button"
        />
      )}

      <div
        className={cn(
          "z-10 flex gap-2",
          isPanel
            ? "shrink-0 justify-end border-wood border-b-2 bg-panel/80 p-2"
            : "absolute top-3 right-3"
        )}
      >
        <PixelButton onClick={onOpenLog}>
          <span className="flex items-center gap-1">
            <PixelIcon name="list" size={12} /> Log
          </span>
        </PixelButton>
        <PixelButton aria-label="Close (Esc)" onClick={onClose}>
          <PixelIcon name="close" size={12} />
        </PixelButton>
      </div>

      <div
        className={cn(
          "relative flex min-h-0 flex-col gap-3 p-4 sm:p-6",
          isPanel ? "flex-1 justify-end" : "mt-auto"
        )}
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
          {showNpcBox ? (
            <div className="flex items-end gap-3 sm:gap-4">
              <DialoguePortrait
                avatarSprite={avatarSprite}
                icon={portraitIcon}
                speakerId={speakerId}
              />

              <div className="min-w-0 flex-1">
                <PixelDialogueBox
                  scrollRef={scrollRef}
                  speakerName={speakerName}
                >
                  {isThinking ? (
                    <span className="advance-indicator text-pixel-text-muted">
                      …
                    </span>
                  ) : (
                    <DialogueMarkdown
                      content={displayText}
                      isAnimating={isAnimating}
                    />
                  )}
                </PixelDialogueBox>
              </div>
            </div>
          ) : null}

          {showInput ? (
            <div
              className={cn(
                "flex items-end gap-3 sm:gap-4",
                showNpcBox && "flex-row-reverse"
              )}
            >
              <DialoguePortrait
                className="bg-panel text-leaf-dark"
                icon="human"
                speakerId="boss"
              />

              <div className="min-w-0 flex-1">
                <DialogueInput
                  disabled={inputDisabled}
                  onSubmit={onSubmitInput}
                  playerName={playerName}
                />
              </div>
            </div>
          ) : null}
        </div>

        {showChoices ? (
          <div className="mx-auto flex w-full max-w-3xl justify-end pr-0 sm:pr-28">
            <div className="w-full sm:max-w-sm">
              <ChoiceMenu choices={choices} onSelect={onSelectChoice} />
            </div>
          </div>
        ) : null}
      </div>

      {logOpen ? <DialogueLog lines={log} onClose={onCloseLog} /> : null}
    </div>
  );
}
