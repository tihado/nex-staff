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
import { DialogueThinkingIndicator } from "./dialogue-thinking-indicator";
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
  chatError?: string | null;
  chatId?: string;
  choices: DialogueChoice[];
  choiceVoice?: DialogueChoiceVoiceProps;
  displayText: string;
  embedded?: boolean;
  inputDisabled: boolean;
  isAnimating: boolean;
  isPanel: boolean;
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
  showThinkingIndicator: boolean;
  speakerId: string;
  speakerName: string;
  voiceLocale?: string;
  voiceOutputEnabled?: boolean;
}

function EmbeddedOppositeDialogue({
  avatarSprite,
  chatId,
  displayText,
  inputDisabled,
  isAnimating,
  showThinkingIndicator,
  playerName,
  portraitIcon,
  scrollRef,
  showInput,
  showNpcBox,
  speakerId,
  speakerName,
  voiceLocale,
  onSubmitInput,
}: {
  avatarSprite?: string;
  chatId?: string;
  displayText: string;
  inputDisabled: boolean;
  isAnimating: boolean;
  showThinkingIndicator: boolean;
  playerName: string;
  portraitIcon?: string;
  scrollRef: RefObject<HTMLDivElement | null>;
  showInput: boolean;
  showNpcBox: boolean;
  speakerId: string;
  speakerName: string;
  voiceLocale?: string;
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
              emotion={showThinkingIndicator ? "think" : "neutral"}
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
              {showThinkingIndicator ? (
                <DialogueThinkingIndicator />
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
              chatId={chatId}
              compact
              disabled={inputDisabled}
              onSubmit={onSubmitInput}
              playerName={playerName}
              voiceDisabled={inputDisabled}
              voiceLocale={voiceLocale}
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
  onToggleVoiceOutput,
  voiceOutputEnabled = false,
}: {
  onClose: () => void;
  onOpenLog: () => void;
  onToggleVoiceOutput?: () => void;
  voiceOutputEnabled?: boolean;
}) {
  return (
    <>
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
    </>
  );
}

function StandardDialogueContent({
  avatarSprite,
  chatError,
  chatId,
  choiceVoice,
  choices,
  displayText,
  inputDisabled,
  isAnimating,
  isPanel,
  showThinkingIndicator,
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
  voiceLocale,
}: {
  avatarSprite?: string;
  chatError?: string | null;
  chatId?: string;
  choiceVoice?: DialogueChoiceVoiceProps;
  choices: DialogueChoice[];
  displayText: string;
  inputDisabled: boolean;
  isAnimating: boolean;
  isPanel: boolean;
  showThinkingIndicator: boolean;
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
  voiceLocale?: string;
}) {
  return (
    <div
      className={cn(
        "pointer-events-auto flex w-full flex-col gap-2 overscroll-contain",
        isPanel
          ? "min-h-0 flex-1 overflow-y-auto p-2 sm:p-3"
          : "max-h-[85dvh] shrink-0 overflow-y-auto p-4 pb-6 sm:p-6"
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
              emotion={showThinkingIndicator ? "think" : "neutral"}
              icon={portraitIcon}
              speakerId={speakerId}
            />

            <div className="min-w-0 flex-1">
              <PixelDialogueBox scrollRef={scrollRef} speakerName={speakerName}>
                {showThinkingIndicator ? (
                  <DialogueThinkingIndicator />
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
  );
}

export function DialogueOverlayPanelView({
  speakerName,
  speakerId,
  portraitIcon,
  avatarSprite,
  displayText,
  chatError,
  chatId,
  embedded = false,
  showThinkingIndicator,
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
  voiceLocale,
  voiceOutputEnabled = false,
  onToggleVoiceOutput,
  choiceVoice,
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
          className="absolute inset-0 z-0 cursor-default bg-black/50"
          onClick={onClose}
          tabIndex={-1}
          type="button"
        />
      )}

      {isPanel && !embedded ? (
        <div className="flex shrink-0 justify-end gap-2 border-wood border-b-2 bg-panel/80 p-2">
          <DialogueChromeButtons
            onClose={onClose}
            onOpenLog={onOpenLog}
            onToggleVoiceOutput={onToggleVoiceOutput}
            voiceOutputEnabled={voiceOutputEnabled}
          />
        </div>
      ) : null}

      {isPanel ? null : (
        <div className="absolute top-3 right-3 z-10 flex gap-2">
          <DialogueChromeButtons
            onClose={onClose}
            onOpenLog={onOpenLog}
            onToggleVoiceOutput={onToggleVoiceOutput}
            voiceOutputEnabled={voiceOutputEnabled}
          />
        </div>
      )}

      {useOppositeLayout ? (
        <EmbeddedOppositeDialogue
          avatarSprite={avatarSprite}
          chatId={chatId}
          displayText={displayText}
          inputDisabled={inputDisabled}
          isAnimating={isAnimating}
          onSubmitInput={onSubmitInput}
          playerName={playerName}
          portraitIcon={portraitIcon}
          scrollRef={scrollRef}
          showInput={showInput}
          showNpcBox={showNpcBox}
          showThinkingIndicator={showThinkingIndicator}
          speakerId={speakerId}
          speakerName={speakerName}
          voiceLocale={voiceLocale}
        />
      ) : (
        <div className="pointer-events-none relative z-10 flex min-h-0 flex-1 flex-col justify-end">
          <StandardDialogueContent
            avatarSprite={avatarSprite}
            chatError={chatError}
            chatId={chatId}
            choices={choices}
            choiceVoice={choiceVoice}
            displayText={displayText}
            inputDisabled={inputDisabled}
            isAnimating={isAnimating}
            isPanel={isPanel}
            onSelectChoice={onSelectChoice}
            onSubmitInput={onSubmitInput}
            playerName={playerName}
            portraitIcon={portraitIcon}
            scrollRef={scrollRef}
            showChoices={showChoices}
            showInput={showInput}
            showNpcBox={showNpcBox}
            showThinkingIndicator={showThinkingIndicator}
            speakerId={speakerId}
            speakerName={speakerName}
            voiceLocale={voiceLocale}
          />
        </div>
      )}

      {useOppositeLayout && showChoices ? (
        <div className="shrink-0 border-wood border-t-2 p-2">
          {choiceVoice?.isSupported ? (
            <div className="mb-2 flex items-center justify-end gap-2">
              <VoiceControl
                disabled={choiceVoice.disabled}
                isSupported
                onToggle={choiceVoice.onToggle}
                state={choiceVoice.state}
              />
            </div>
          ) : null}
          {choiceVoice?.error ? (
            <p className="mb-2 text-right font-pixel text-[9px] text-alert">
              {choiceVoice.error}
            </p>
          ) : null}
          <ChoiceMenu choices={choices} onSelect={onSelectChoice} />
        </div>
      ) : null}

      {logOpen ? <DialogueLog lines={log} onClose={onCloseLog} /> : null}
    </div>
  );
}
