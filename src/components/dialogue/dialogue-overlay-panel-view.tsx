"use client";

import type { RefObject } from "react";
import { PixelButton, PixelDialogueBox, PixelIcon } from "@/components/pixel";
import type { DialogueLine } from "@/hooks/use-dialogue-engine";
import type { DialogueChoice } from "@/lib/dialogue/types";
import { cn } from "@/lib/utils";
import type { VoiceInputState } from "@/lib/voice/types";
import { ChoiceMenu } from "./choice-menu";
import { DialogueInput } from "./dialogue-input";
import { DialogueLog } from "./dialogue-log";
import { DialogueMarkdown } from "./dialogue-markdown";
import { DialoguePortrait } from "./dialogue-portrait";
import { VoiceControl } from "./voice-control";

interface DialogueChoiceVoiceProps {
  disabled?: boolean;
  error?: string | null;
  isSupported?: boolean;
  onToggle: () => void;
  state: VoiceInputState;
}

function DialogueChoiceVoiceSection({
  choiceVoice,
  choices,
  onSelectChoice,
}: {
  choiceVoice?: DialogueChoiceVoiceProps;
  choices: DialogueChoice[];
  onSelectChoice: (choiceId: string) => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-end gap-2 pr-0 sm:pr-28">
      {choiceVoice?.isSupported ? (
        <div className="flex items-center gap-2">
          <VoiceControl
            disabled={choiceVoice.disabled}
            isSupported
            onToggle={choiceVoice.onToggle}
            state={choiceVoice.state}
          />
          <span className="font-pixel text-[9px] text-ink-muted uppercase tracking-widest">
            Tap to pick by voice
          </span>
        </div>
      ) : null}
      {choiceVoice?.error ? (
        <p className="font-pixel text-[9px] text-alert">{choiceVoice.error}</p>
      ) : null}
      <div className="w-full sm:max-w-sm">
        <ChoiceMenu choices={choices} onSelect={onSelectChoice} />
      </div>
    </div>
  );
}

interface DialogueOverlayPanelViewProps {
  avatarSprite?: string;
  chatId?: string;
  choices: DialogueChoice[];
  choiceVoice?: DialogueChoiceVoiceProps;
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
  onToggleVoiceOutput?: () => void;
  playerName: string;
  portraitIcon?: string;
  scrollRef: RefObject<HTMLDivElement | null>;
  showChoices: boolean;
  showInput: boolean;
  showNpcBox: boolean;
  speakerId: string;
  speakerName: string;
  voiceLocale?: string;
  voiceOutputEnabled?: boolean;
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
  chatId,
  voiceLocale,
  voiceOutputEnabled = false,
  onToggleVoiceOutput,
  choiceVoice,
}: DialogueOverlayPanelViewProps) {
  return (
    <div
      aria-label={`Dialogue with ${speakerName}`}
      className={cn(
        "flex flex-col",
        isPanel ? "min-h-0 flex-1 bg-bg-dialogue" : "fixed inset-0 z-20"
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
        {onToggleVoiceOutput ? (
          <PixelButton
            aria-label={
              voiceOutputEnabled
                ? "Disable NPC voice readback"
                : "Enable NPC voice readback"
            }
            aria-pressed={voiceOutputEnabled}
            onClick={onToggleVoiceOutput}
          >
            <PixelIcon
              label={voiceOutputEnabled ? "Voice on" : "Voice off"}
              name={voiceOutputEnabled ? "volume-high" : "volume-off"}
              size={12}
            />
          </PixelButton>
        ) : null}
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
                  chatId={chatId}
                  disabled={inputDisabled}
                  onSubmit={onSubmitInput}
                  playerName={playerName}
                  voiceDisabled={inputDisabled}
                  voiceLocale={voiceLocale}
                />
              </div>
            </div>
          ) : null}
        </div>

        {showChoices ? (
          <DialogueChoiceVoiceSection
            choices={choices}
            choiceVoice={choiceVoice}
            onSelectChoice={onSelectChoice}
          />
        ) : null}
      </div>

      {logOpen ? <DialogueLog lines={log} onClose={onCloseLog} /> : null}
    </div>
  );
}
