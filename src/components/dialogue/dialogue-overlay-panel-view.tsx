"use client";

import type { RefObject } from "react";
import { PixelButton, PixelDialogueBox, PixelIcon } from "@/components/pixel";
import type { DialogueLine } from "@/hooks/use-dialogue-engine";
import type { DialogueChoice } from "@/lib/dialogue/types";
import { cn } from "@/lib/utils";
import { ChoiceMenu } from "./choice-menu";
import { DialogueInput } from "./dialogue-input";
import { DialogueLog } from "./dialogue-log";
import { DialogueMarkdown } from "./dialogue-markdown";
import { DialoguePortrait } from "./dialogue-portrait";

interface DialogueOverlayPanelViewProps {
  avatarSprite?: string;
  chatError?: string | null;
  choices: DialogueChoice[];
  displayText: string;
  embedded?: boolean;
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

function EmbeddedOppositeDialogue({
  avatarSprite,
  displayText,
  inputDisabled,
  isAnimating,
  isThinking,
  playerName,
  portraitIcon,
  scrollRef,
  showInput,
  showNpcBox,
  speakerId,
  speakerName,
  onSubmitInput,
}: {
  avatarSprite?: string;
  displayText: string;
  inputDisabled: boolean;
  isAnimating: boolean;
  isThinking: boolean;
  playerName: string;
  portraitIcon?: string;
  scrollRef: RefObject<HTMLDivElement | null>;
  showInput: boolean;
  showNpcBox: boolean;
  speakerId: string;
  speakerName: string;
  onSubmitInput: (payload: { text: string }) => void;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 pb-3">
      <div className="grid grid-cols-[3rem_1fr_3rem] items-start gap-x-2 gap-y-3">
        <div className="col-start-1 row-start-1 flex justify-center pt-0.5">
          {showNpcBox ? (
            <DialoguePortrait
              avatarSprite={avatarSprite}
              compact
              icon={portraitIcon}
              speakerId={speakerId}
            />
          ) : null}
        </div>

        <div className="col-start-2 row-start-1 min-w-0">
          {showNpcBox ? (
            <PixelDialogueBox
              compact
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
          ) : null}
        </div>

        <div className="col-start-3 row-start-1" />

        <div className="col-start-1 row-start-2" />

        <div className="col-start-2 row-start-2 min-w-0">
          {showInput ? (
            <DialogueInput
              align="right"
              compact
              disabled={inputDisabled}
              onSubmit={onSubmitInput}
              playerName={playerName}
            />
          ) : null}
        </div>

        <div className="col-start-3 row-start-2 flex justify-center pt-1">
          {showInput ? (
            <DialoguePortrait
              className="bg-panel text-leaf-dark"
              compact
              icon="human"
              speakerId="boss"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function DialogueChromeButtons({
  onClose,
  onOpenLog,
}: {
  onClose: () => void;
  onOpenLog: () => void;
}) {
  return (
    <>
      <PixelButton onClick={onOpenLog}>
        <span className="flex items-center gap-1">
          <PixelIcon name="list" size={12} /> Log
        </span>
      </PixelButton>
      <PixelButton aria-label="Close (Esc)" onClick={onClose}>
        <PixelIcon name="close" size={12} />
      </PixelButton>
    </>
  );
}

function StandardDialogueContent({
  avatarSprite,
  chatError,
  choices,
  displayText,
  inputDisabled,
  isAnimating,
  isPanel,
  isThinking,
  onSelectChoice,
  onSubmitInput,
  playerName,
  portraitIcon,
  scrollRef,
  showChoices,
  showInput,
  showNpcBox,
  speakerId,
  speakerName,
}: {
  avatarSprite?: string;
  chatError?: string | null;
  choices: DialogueChoice[];
  displayText: string;
  inputDisabled: boolean;
  isAnimating: boolean;
  isPanel: boolean;
  isThinking: boolean;
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
}) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-col gap-2 overflow-y-auto overscroll-contain",
        isPanel ? "min-h-0 flex-1 p-2 sm:p-3" : "mt-auto p-4 sm:p-6"
      )}
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
        {chatError ? (
          <p className="font-body text-[18px] text-alert" role="alert">
            {chatError}
          </p>
        ) : null}

        {showNpcBox ? (
          <div className="flex items-start gap-2 sm:gap-3">
            <DialoguePortrait
              avatarSprite={avatarSprite}
              icon={portraitIcon}
              speakerId={speakerId}
            />

            <div className="min-w-0 flex-1">
              <PixelDialogueBox scrollRef={scrollRef} speakerName={speakerName}>
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
          <div className="flex flex-row-reverse items-start gap-2 sm:gap-3">
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
  );
}

export function DialogueOverlayPanelView({
  speakerName,
  speakerId,
  portraitIcon,
  avatarSprite,
  displayText,
  chatError,
  embedded = false,
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
  const useOppositeLayout = embedded && isPanel;

  return (
    <div
      aria-label={`Dialogue with ${speakerName}`}
      aria-modal={isPanel ? undefined : "true"}
      className={cn(
        "flex min-h-0 flex-col overflow-hidden",
        isPanel ? "flex-1 bg-bg-dialogue" : "fixed inset-0 z-20"
      )}
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

      {isPanel && !embedded ? (
        <div className="flex shrink-0 justify-end gap-2 border-wood border-b-2 bg-panel/80 p-2">
          <DialogueChromeButtons onClose={onClose} onOpenLog={onOpenLog} />
        </div>
      ) : null}

      {isPanel ? null : (
        <div className="absolute top-3 right-3 z-10 flex gap-2">
          <DialogueChromeButtons onClose={onClose} onOpenLog={onOpenLog} />
        </div>
      )}

      {useOppositeLayout ? (
        <EmbeddedOppositeDialogue
          avatarSprite={avatarSprite}
          displayText={displayText}
          inputDisabled={inputDisabled}
          isAnimating={isAnimating}
          isThinking={isThinking}
          onSubmitInput={onSubmitInput}
          playerName={playerName}
          portraitIcon={portraitIcon}
          scrollRef={scrollRef}
          showInput={showInput}
          showNpcBox={showNpcBox}
          speakerId={speakerId}
          speakerName={speakerName}
        />
      ) : (
        <StandardDialogueContent
          avatarSprite={avatarSprite}
          chatError={chatError}
          choices={choices}
          displayText={displayText}
          inputDisabled={inputDisabled}
          isAnimating={isAnimating}
          isPanel={isPanel}
          isThinking={isThinking}
          onSelectChoice={onSelectChoice}
          onSubmitInput={onSubmitInput}
          playerName={playerName}
          portraitIcon={portraitIcon}
          scrollRef={scrollRef}
          showChoices={showChoices}
          showInput={showInput}
          showNpcBox={showNpcBox}
          speakerId={speakerId}
          speakerName={speakerName}
        />
      )}

      {useOppositeLayout && showChoices ? (
        <div className="shrink-0 border-wood border-t-2 p-2">
          <ChoiceMenu choices={choices} onSelect={onSelectChoice} />
        </div>
      ) : null}

      {logOpen ? <DialogueLog lines={log} onClose={onCloseLog} /> : null}
    </div>
  );
}
