"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PixelButton, PixelDialogueBox, PixelIcon } from "@/components/pixel";
import { useDialogueEngine } from "@/hooks/use-dialogue-engine";
import { useHireFlow } from "@/hooks/use-hire-flow";
import type { AssistantUIMessage } from "@/lib/agents/assistant";
import {
  fetchAssistantChatHistory,
  getOrCreateAssistantChatId,
} from "@/lib/chat/assistant-session";
import { extractHireStaffSuccessOutput } from "@/lib/dialogue/hire-choices";
import { assignNewStaffToDesk } from "@/lib/staff/desk-assignments";
import type { HireStaffResult } from "@/lib/staff/types";
import { cn } from "@/lib/utils";
import { ChoiceMenu } from "./choice-menu";
import { DialogueInput } from "./dialogue-input";
import { DialogueLog } from "./dialogue-log";
import { DialogueMarkdown } from "./dialogue-markdown";
import { DialoguePortrait } from "./dialogue-portrait";

export interface HireDialogueContext {
  deskId?: string;
  mode: "scripted" | "assistant";
  pendingTaskBrief?: string;
}

interface DialogueOverlayProps {
  chatId?: string;
  greeting: string;
  hireContext?: HireDialogueContext;
  layout?: "overlay" | "panel";
  occupiedDeskSlotIds?: string[];
  onClose: () => void;
  onStaffHired?: (result: HireStaffResult) => void;
  portraitIcon?: string;
  speakerId: string;
  speakerName: string;
  speakerRole?: string;
  taskId?: string;
}

function createAssistantTransport(taskId?: string) {
  return new DefaultChatTransport({
    api: "/api/chat",
    fetch: (url, init) => {
      if (!(taskId && init?.body)) {
        return fetch(url, init);
      }

      try {
        const parsed = JSON.parse(String(init.body)) as Record<string, unknown>;

        return fetch(url, {
          ...init,
          body: JSON.stringify({ ...parsed, taskId }),
        });
      } catch {
        return fetch(url, init);
      }
    },
  });
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

interface DialogueOverlayPanelProps extends DialogueOverlayProps {
  chatId: string;
  initialMessages: AssistantUIMessage[];
}

function DialogueOverlayPanel({
  speakerId,
  speakerName,
  speakerRole,
  portraitIcon,
  greeting,
  chatId,
  initialMessages,
  hireContext,
  occupiedDeskSlotIds = [],
  onClose,
  onStaffHired,
  taskId,
  layout = "overlay",
}: DialogueOverlayPanelProps) {
  const transport = useMemo(() => createAssistantTransport(taskId), [taskId]);

  const chat = useChat<AssistantUIMessage>({
    id: chatId,
    messages: initialMessages,
    generateId: () => crypto.randomUUID(),
    transport,
  });

  const hireFlow = useHireFlow({
    occupiedDeskSlotIds,
    onCancel: onClose,
    onHired: onStaffHired,
  });

  const engine = useDialogueEngine({
    chat,
    speakerId,
    speakerName,
    speakerRole,
    portraitSprite: speakerId,
    greeting,
    pendingTaskBrief: hireContext?.pendingTaskBrief,
  });

  const startedDeskHireRef = useRef(false);

  useEffect(() => {
    if (
      hireContext?.mode !== "scripted" ||
      !hireContext.deskId ||
      startedDeskHireRef.current
    ) {
      return;
    }

    startedDeskHireRef.current = true;
    hireFlow.startFromDesk(hireContext.deskId);
  }, [hireContext?.deskId, hireContext?.mode, hireFlow.startFromDesk]);

  const lastAssistant = useMemo(
    () =>
      chat.messages.filter((message) => message.role === "assistant").at(-1),
    [chat.messages]
  );

  const assistantHireHandledRef = useRef<string | null>(null);

  useEffect(() => {
    if (hireContext?.mode === "scripted") {
      return;
    }

    const output = extractHireStaffSuccessOutput(lastAssistant);

    if (!(output && lastAssistant)) {
      return;
    }

    if (assistantHireHandledRef.current === lastAssistant.id) {
      return;
    }

    assistantHireHandledRef.current = lastAssistant.id;

    onStaffHired?.({
      id: String(output.staffId ?? ""),
      name: String(output.name ?? ""),
      role: String(output.role ?? ""),
      avatarSprite: String(output.avatarSprite ?? "default"),
      assignedDeskSlotId: assignNewStaffToDesk(String(output.staffId ?? "")),
      status: "idle",
      useSandbox: Boolean(output.useSandbox),
      hiredAt: new Date().toISOString(),
      activeTasks: 0,
    });
  }, [hireContext?.mode, lastAssistant, onStaffHired]);

  const useScriptedUi =
    hireContext?.mode === "scripted" && hireFlow.isScriptedActive;

  const displayText = useScriptedUi
    ? (hireFlow.scripted?.line ?? greeting)
    : engine.displayText;

  const choices = useScriptedUi
    ? (hireFlow.scripted?.choices ?? [])
    : engine.choices;

  const state = useScriptedUi
    ? (hireFlow.scripted?.dialogueState ?? "npc-speaking")
    : engine.state;

  const isThinking = hireFlow.phase === "submitting" || engine.isThinking;

  const handleSelectChoice = useCallback(
    (choiceId: string) => {
      if (
        choiceId === "hire-delegate-now" &&
        hireFlow.phase === "delegate_offer"
      ) {
        const delegateMessage = hireFlow.handleDelegateNow();

        if (delegateMessage) {
          engine.submitInput({ text: delegateMessage });
        }

        hireFlow.reset();
        return;
      }

      if (useScriptedUi) {
        hireFlow.handleScriptedChoice(choiceId);
        return;
      }

      engine.selectChoice(choiceId);
    },
    [engine, hireFlow, useScriptedUi]
  );

  const handleSubmitInput = useCallback(
    (payload: { text: string }) => {
      if (useScriptedUi && hireFlow.phase === "gather_name") {
        hireFlow.handleNameInput(payload.text);
        return;
      }

      engine.submitInput(payload);
    },
    [engine, hireFlow, useScriptedUi]
  );

  const [logOpen, setLogOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

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
  const isPanel = layout === "panel";

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
        <PixelButton onClick={() => setLogOpen(true)}>
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
                      isAnimating={!useScriptedUi && engine.isStreaming}
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
                  disabled={engine.isBusy || hireFlow.phase === "submitting"}
                  onSubmit={handleSubmitInput}
                  playerName={PLAYER_NAME}
                />
              </div>
            </div>
          ) : null}
        </div>

        {showChoices ? (
          <div className="mx-auto flex w-full max-w-3xl justify-end pr-0 sm:pr-28">
            <div className="w-full sm:max-w-sm">
              <ChoiceMenu choices={choices} onSelect={handleSelectChoice} />
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

export function DialogueOverlay({
  speakerId,
  speakerName,
  speakerRole,
  portraitIcon,
  greeting,
  chatId: chatIdProp,
  hireContext,
  occupiedDeskSlotIds,
  onClose,
  onStaffHired,
  taskId,
  layout = "overlay",
}: DialogueOverlayProps) {
  const [chatId, setChatId] = useState<string | null>(chatIdProp ?? null);
  const [initialMessages, setInitialMessages] = useState<
    AssistantUIMessage[] | null
  >(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      const id = chatIdProp ?? getOrCreateAssistantChatId();
      const messages = await fetchAssistantChatHistory(id);

      if (cancelled) {
        return;
      }

      setInitialMessages(messages);
      setChatId(id);
    }

    loadSession();

    return () => {
      cancelled = true;
    };
  }, [chatIdProp]);

  if (!chatId || initialMessages === null) {
    return (
      <div
        aria-busy="true"
        aria-label={`Loading dialogue with ${speakerName}`}
        className={cn(
          "flex items-center justify-center",
          layout === "panel"
            ? "min-h-0 flex-1 bg-bg-dialogue"
            : "fixed inset-0 z-20 bg-black/50"
        )}
        role="dialog"
      >
        <div className="flex items-center gap-2 border-[3px] border-wood bg-panel px-4 py-3 font-pixel text-[10px] text-ink uppercase tracking-widest">
          <Loader2 className="size-4 animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  return (
    <DialogueOverlayPanel
      chatId={chatId}
      greeting={greeting}
      hireContext={hireContext}
      initialMessages={initialMessages}
      layout={layout}
      occupiedDeskSlotIds={occupiedDeskSlotIds}
      onClose={onClose}
      onStaffHired={onStaffHired}
      portraitIcon={portraitIcon}
      speakerId={speakerId}
      speakerName={speakerName}
      speakerRole={speakerRole}
      taskId={taskId}
    />
  );
}
