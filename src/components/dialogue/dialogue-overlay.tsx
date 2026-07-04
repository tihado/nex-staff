"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PixelButton, PixelDialogueBox, PixelIcon } from "@/components/pixel";
import { useDialogueEngine } from "@/hooks/use-dialogue-engine";
import type { AssistantUIMessage } from "@/lib/agents/assistant";
import { cn } from "@/lib/utils";
import { ChoiceMenu } from "./choice-menu";
import { DialogueInput } from "./dialogue-input";
import { DialogueLog } from "./dialogue-log";
import { DialogueMarkdown } from "./dialogue-markdown";
import { DialoguePortrait } from "./dialogue-portrait";

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

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);

    const handler = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", handler);

    return () => query.removeEventListener("change", handler);
  }, []);

  return reduced;
}

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const { state, displayText, isThinking } = engine;

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-scroll when streamed text grows
  useEffect(() => {
    const node = scrollRef.current;

    if (!node) {
      return;
    }

    node.scrollTo({
      top: node.scrollHeight,
      behavior: reducedMotion ? "instant" : "smooth",
    });
  }, [displayText, reducedMotion]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();

        if (logOpen) {
          setLogOpen(false);
        } else {
          onClose();
        }
      }
    },
    [logOpen, onClose]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const showInput = state === "player-input";
  const showChoices = state === "player-choice";
  const showNpcBox = state === "npc-speaking" || showChoices || showInput;

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
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
          {showNpcBox ? (
            <div className="flex items-end gap-3 sm:gap-4">
              <DialoguePortrait icon={portraitIcon} speakerId={speakerId} />

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
                      isAnimating={engine.isStreaming}
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
                  disabled={engine.isBusy}
                  onSubmit={engine.submitInput}
                  playerName={PLAYER_NAME}
                />
              </div>
            </div>
          ) : null}
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
