"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PixelButton, PixelDialogueBox, PixelIcon } from "@/components/pixel";
import { useDialogueEngine } from "@/hooks/use-dialogue-engine";
import type { AssistantUIMessage } from "@/lib/agents/assistant";
import { cn } from "@/lib/utils";
import { ChoiceMenu } from "./choice-menu";
import { DialogueInput } from "./dialogue-input";
import { DialogueLog } from "./dialogue-log";
import { DialoguePortrait } from "./dialogue-portrait";
import { TypewriterText } from "./typewriter-text";

interface DialogueOverlayProps {
  chatId?: string;
  greeting: string;
  onClose: () => void;
  portraitIcon?: string;
  speakerId: string;
  speakerName: string;
  speakerRole?: string;
}

const PLAYER_NAME = "Boss (you)";

export function DialogueOverlay({
  speakerId,
  speakerName,
  speakerRole,
  portraitIcon,
  greeting,
  chatId,
  onClose,
}: DialogueOverlayProps) {
  const generatedId = useMemo(() => crypto.randomUUID(), []);
  const id = chatId ?? generatedId;

  const chat = useChat<AssistantUIMessage>({
    id,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const engine = useDialogueEngine({
    chat,
    speakerId,
    speakerName,
    speakerRole,
    portraitSprite: speakerId,
    greeting,
  });

  const [logOpen, setLogOpen] = useState(false);
  const { state, advance } = engine;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();

        if (logOpen) {
          setLogOpen(false);
        } else {
          onClose();
        }

        return;
      }

      if (logOpen) {
        return;
      }

      const canAdvance =
        state === "npc-speaking" || state === "waiting-advance";

      if (canAdvance && (event.key === " " || event.key === "Enter")) {
        event.preventDefault();
        advance();
      }
    },
    [logOpen, onClose, state, advance]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const speaking = state === "npc-speaking" || state === "waiting-advance";
  const showInput = state === "player-input";
  const showChoices = state === "player-choice";

  return (
    <div
      aria-label={`Dialogue with ${speakerName}`}
      className="fixed inset-0 z-20 flex flex-col"
      role="dialog"
    >
      {/* Backdrop dims the workspace 50% behind the dialogue. */}
      <button
        aria-label="Close dialogue"
        className="absolute inset-0 cursor-default bg-black/50"
        onClick={onClose}
        tabIndex={-1}
        type="button"
      />

      <div className="absolute top-3 right-3 z-10 flex gap-2">
        <PixelButton onClick={() => setLogOpen(true)}>
          <span className="flex items-center gap-1">
            <PixelIcon name="list" size={12} /> Log
          </span>
        </PixelButton>
        <PixelButton aria-label="Close (Esc)" onClick={onClose}>
          <PixelIcon name="close" size={12} />
        </PixelButton>
      </div>

      <div className="relative mt-auto flex flex-col gap-3 p-4 sm:p-6">
        <div
          className={cn(
            "mx-auto flex w-full max-w-3xl items-end gap-3 sm:gap-4",
            showInput && "flex-row-reverse"
          )}
        >
          {showInput ? (
            <DialoguePortrait
              className="bg-panel text-leaf-dark"
              icon="human"
              speakerId="boss"
            />
          ) : (
            <DialoguePortrait
              emotion={engine.currentLine?.emotion}
              icon={portraitIcon}
              speakerId={engine.currentLine?.speakerId ?? speakerId}
            />
          )}

          <div className="min-w-0 flex-1">
            {showInput ? (
              <DialogueInput
                onSubmit={engine.submitInput}
                playerName={PLAYER_NAME}
              />
            ) : (
              <button
                aria-label="Continue dialogue"
                className="block w-full text-left"
                disabled={!speaking}
                onClick={advance}
                type="button"
              >
                <PixelDialogueBox
                  showAdvancePrompt={state === "waiting-advance"}
                  speakerName={engine.currentLine?.speakerName ?? speakerName}
                >
                  {(() => {
                    if (engine.isThinking) {
                      return (
                        <span className="advance-indicator text-pixel-text-muted">
                          …
                        </span>
                      );
                    }

                    if (speaking && engine.currentLine) {
                      return (
                        <TypewriterText
                          key={engine.lineIndex}
                          onComplete={engine.markLineTyped}
                          skip={engine.skipTypewriter}
                          text={engine.currentLine.text}
                        />
                      );
                    }

                    return null;
                  })()}
                </PixelDialogueBox>
              </button>
            )}
          </div>
        </div>

        {showChoices ? (
          <div className="mx-auto flex w-full max-w-3xl justify-end pr-0 sm:pr-28">
            <div className="w-full sm:max-w-sm">
              <ChoiceMenu
                choices={engine.choices}
                onSelect={engine.selectChoice}
              />
            </div>
          </div>
        ) : null}
      </div>

      {logOpen ? (
        <DialogueLog lines={engine.log} onClose={() => setLogOpen(false)} />
      ) : null}
    </div>
  );
}
