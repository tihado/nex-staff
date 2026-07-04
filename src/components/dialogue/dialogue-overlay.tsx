"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDialogueEngine } from "@/hooks/use-dialogue-engine";
import { useHireFlow } from "@/hooks/use-hire-flow";
import type { AssistantUIMessage } from "@/lib/agents/assistant";
import {
  fetchAssistantChatHistory,
  getOrCreateDialogueChatId,
} from "@/lib/chat/assistant-session";
import type { HireStaffResult } from "@/lib/staff/types";
import { cn } from "@/lib/utils";
import {
  handleDialogueChoiceSelection,
  handleDialogueInputSubmission,
  resolveScriptedUi,
  useAssistantHireSuccessEffect,
  useDialoguePanelChrome,
  useScriptedDeskHireEffect,
} from "./dialogue-overlay-logic";
import { DialogueOverlayPanelView } from "./dialogue-overlay-panel-view";

export interface HireDialogueContext {
  deskId?: string;
  mode: "scripted" | "assistant";
  pendingTaskBrief?: string;
}

interface DialogueOverlayProps {
  avatarSprite?: string;
  chatId?: string;
  greeting: string;
  hasWriterOnRoster?: boolean;
  hireContext?: HireDialogueContext;
  layout?: "overlay" | "panel";
  occupiedDeskSlotIds?: string[];
  onClose: () => void;
  onStaffHired?: (result: HireStaffResult) => void;
  onViewDeliverable?: (taskId: string) => void;
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

interface DialogueOverlayPanelProps extends DialogueOverlayProps {
  chatId: string;
  initialMessages: AssistantUIMessage[];
}

function DialogueOverlayPanel({
  speakerId,
  speakerName,
  speakerRole,
  portraitIcon,
  avatarSprite,
  greeting,
  chatId,
  initialMessages,
  hireContext,
  hasWriterOnRoster = false,
  occupiedDeskSlotIds = [],
  onClose,
  onStaffHired,
  onViewDeliverable,
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
    pendingTaskBrief:
      hireFlow.draft.pendingTaskBrief ?? hireContext?.pendingTaskBrief,
  });

  useScriptedDeskHireEffect(hireContext, hireFlow.startFromDesk);

  const lastAssistant = useMemo(
    () =>
      chat.messages.filter((message) => message.role === "assistant").at(-1),
    [chat.messages]
  );

  useAssistantHireSuccessEffect(
    hireContext,
    hireFlow,
    lastAssistant,
    onStaffHired
  );

  const useScriptedUi = resolveScriptedUi(hireContext, hireFlow);

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
      handleDialogueChoiceSelection({
        choiceId,
        engine,
        hireFlow,
        lastAssistant,
        onViewDeliverable,
        taskId,
        useScriptedUi,
      });
    },
    [engine, hireFlow, lastAssistant, onViewDeliverable, taskId, useScriptedUi]
  );

  const handleSubmitInput = useCallback(
    (payload: { text: string }) => {
      handleDialogueInputSubmission({
        payload,
        useScriptedUi,
        hireFlow,
        hireContext,
        hasWriterOnRoster,
        engine,
      });
    },
    [engine, hasWriterOnRoster, hireContext, hireFlow, useScriptedUi]
  );

  const { logOpen, scrollRef, setLogOpen } = useDialoguePanelChrome(
    onClose,
    displayText
  );

  const showInput = state === "player-input";
  const showChoices = state === "player-choice";
  const showNpcBox = state === "npc-speaking" || showChoices || showInput;

  return (
    <DialogueOverlayPanelView
      avatarSprite={avatarSprite}
      choices={choices}
      displayText={displayText}
      inputDisabled={engine.isBusy || hireFlow.phase === "submitting"}
      isAnimating={!useScriptedUi && engine.isStreaming}
      isPanel={layout === "panel"}
      isThinking={isThinking}
      log={engine.log}
      logOpen={logOpen}
      onClose={onClose}
      onCloseLog={() => setLogOpen(false)}
      onOpenLog={() => setLogOpen(true)}
      onSelectChoice={handleSelectChoice}
      onSubmitInput={handleSubmitInput}
      playerName={PLAYER_NAME}
      portraitIcon={portraitIcon}
      scrollRef={scrollRef}
      showChoices={showChoices}
      showInput={showInput}
      showNpcBox={showNpcBox}
      speakerId={speakerId}
      speakerName={speakerName}
    />
  );
}

export function DialogueOverlay({
  speakerId,
  speakerName,
  speakerRole,
  portraitIcon,
  avatarSprite,
  greeting,
  chatId: chatIdProp,
  hireContext,
  hasWriterOnRoster,
  occupiedDeskSlotIds,
  onClose,
  onStaffHired,
  onViewDeliverable,
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
      const id = chatIdProp ?? getOrCreateDialogueChatId({ speakerId, taskId });
      const messages = await fetchAssistantChatHistory(id);

      if (cancelled) {
        return;
      }

      setInitialMessages(messages);
      setChatId(id);
    }

    setChatId(null);
    setInitialMessages(null);
    loadSession();

    return () => {
      cancelled = true;
    };
  }, [chatIdProp, speakerId, taskId]);

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
      avatarSprite={avatarSprite}
      chatId={chatId}
      greeting={greeting}
      hasWriterOnRoster={hasWriterOnRoster}
      hireContext={hireContext}
      initialMessages={initialMessages}
      layout={layout}
      occupiedDeskSlotIds={occupiedDeskSlotIds}
      onClose={onClose}
      onStaffHired={onStaffHired}
      onViewDeliverable={onViewDeliverable}
      portraitIcon={portraitIcon}
      speakerId={speakerId}
      speakerName={speakerName}
      speakerRole={speakerRole}
      taskId={taskId}
    />
  );
}
