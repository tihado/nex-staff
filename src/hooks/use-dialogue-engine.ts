"use client";

import type { useChat } from "@ai-sdk/react";
import { useCallback, useMemo } from "react";
import type { AssistantUIMessage } from "@/lib/agents/assistant";
import { extractDelegateProposalChoices } from "@/lib/dialogue/delegate-choices";
import type { DialogueChoice } from "@/lib/dialogue/types";

const MAX_LINE_LENGTH = 80;
const SENTENCE_BOUNDARY = /[^.!?]+[.!?]+[\])'"`]*\s*|[^.!?]+$/g;

export type { DialogueChoice } from "@/lib/dialogue/types";

export type DialogueEmotion = "neutral" | "happy" | "think" | "alert";

export type DialogueState =
  | "idle"
  | "npc-speaking"
  | "player-choice"
  | "player-input";

export interface DialogueLine {
  emotion?: DialogueEmotion;
  portraitSprite: string;
  speakerId: string;
  speakerName: string;
  speakerRole?: string;
  text: string;
}

type ChatHelpers = ReturnType<typeof useChat<AssistantUIMessage>>;

export interface UseDialogueEngineOptions {
  chat: ChatHelpers;
  greeting: string;
  portraitSprite: string;
  speakerId: string;
  speakerName: string;
  speakerRole?: string;
}

export interface DialogueEngine {
  choices: DialogueChoice[];
  displayText: string;
  isStreaming: boolean;
  isThinking: boolean;
  log: DialogueLine[];
  selectChoice: (choiceId: string) => void;
  state: DialogueState;
  submitInput: (text: string) => void;
}

const PLAYER_LINE: Omit<DialogueLine, "text"> = {
  speakerId: "boss",
  speakerName: "Boss",
  portraitSprite: "player",
};

function getMessageText(message: AssistantUIMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => ("text" in part ? part.text : ""))
    .join("");
}

function splitIntoLines(text: string): string[] {
  const trimmed = text.trim();

  if (!trimmed) {
    return [];
  }

  const sentences = trimmed.match(SENTENCE_BOUNDARY) ?? [trimmed];
  const lines: string[] = [];

  for (const sentence of sentences) {
    const clean = sentence.trim();

    if (!clean) {
      continue;
    }

    if (clean.length <= MAX_LINE_LENGTH) {
      lines.push(clean);
      continue;
    }

    let remaining = clean;

    while (remaining.length > MAX_LINE_LENGTH) {
      const slice = remaining.slice(0, MAX_LINE_LENGTH);
      const lastSpace = slice.lastIndexOf(" ");
      const breakAt = lastSpace > 0 ? lastSpace : MAX_LINE_LENGTH;
      lines.push(remaining.slice(0, breakAt).trim());
      remaining = remaining.slice(breakAt).trim();
    }

    if (remaining) {
      lines.push(remaining);
    }
  }

  return lines;
}

interface ToolPartLike {
  output?: unknown;
  state?: string;
  type: string;
}

const CHOICE_MAP: Record<string, DialogueChoice[]> = {
  hire_staff: [
    { id: "hire-confirm", label: "Yes, hire now!", shortcut: "A" },
    { id: "hire-more", label: "Ask more first", shortcut: "B" },
    { id: "hire-cancel", label: "No, maybe later", shortcut: "C" },
  ],
  create_document: [
    { id: "doc-open", label: "Open document", shortcut: "A" },
    { id: "doc-continue", label: "Continue", shortcut: "B" },
  ],
};

function extractChoices(
  message: AssistantUIMessage | undefined
): DialogueChoice[] {
  if (!message) {
    return [];
  }

  const delegateChoices = extractDelegateProposalChoices(message);

  if (delegateChoices.length > 0) {
    return delegateChoices;
  }

  for (const part of message.parts as ToolPartLike[]) {
    if (!part.type.startsWith("tool-")) {
      continue;
    }

    if (part.state && part.state !== "output-available") {
      continue;
    }

    const toolName = part.type.slice("tool-".length);
    const choices = CHOICE_MAP[toolName];

    if (choices) {
      return choices;
    }
  }

  return [];
}

export function useDialogueEngine(
  options: UseDialogueEngineOptions
): DialogueEngine {
  const {
    chat,
    speakerId,
    speakerName,
    speakerRole,
    portraitSprite,
    greeting,
  } = options;
  const { messages, status, sendMessage } = chat;

  const isStreaming = status === "streaming";
  const isBusy = status === "submitted" || isStreaming;

  const npcLine = useCallback(
    (text: string): DialogueLine => ({
      speakerId,
      speakerName,
      speakerRole,
      portraitSprite,
      text,
    }),
    [speakerId, speakerName, speakerRole, portraitSprite]
  );

  const lastAssistant = useMemo(
    () => messages.filter((message) => message.role === "assistant").at(-1),
    [messages]
  );

  const lastAssistantText = useMemo(
    () => (lastAssistant ? getMessageText(lastAssistant).trim() : ""),
    [lastAssistant]
  );

  const displayText = lastAssistantText || greeting;

  const log = useMemo(() => {
    const entries: DialogueLine[] = [npcLine(greeting)];

    for (const message of messages) {
      const text = getMessageText(message).trim();

      if (!text) {
        continue;
      }

      if (message.role === "assistant") {
        for (const segment of splitIntoLines(text)) {
          entries.push(npcLine(segment));
        }
      } else if (message.role === "user") {
        entries.push({ ...PLAYER_LINE, text });
      }
    }

    return entries;
  }, [messages, greeting, npcLine]);

  const choices = useMemo(
    () => (isBusy ? [] : extractChoices(lastAssistant)),
    [lastAssistant, isBusy]
  );

  const isThinking = status === "submitted";

  let state: DialogueState;
  if (isBusy) {
    state = "npc-speaking";
  } else if (choices.length > 0) {
    state = "player-choice";
  } else {
    state = "player-input";
  }

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();

      if (!trimmed) {
        return;
      }

      sendMessage({ text: trimmed });
    },
    [sendMessage]
  );

  const selectChoice = useCallback(
    (choiceId: string) => {
      const choice = choices.find((entry) => entry.id === choiceId);

      if (choice) {
        send(choice.label);
      }
    },
    [choices, send]
  );

  return {
    state,
    displayText,
    isStreaming,
    isThinking,
    choices,
    log,
    selectChoice,
    submitInput: send,
  };
}
