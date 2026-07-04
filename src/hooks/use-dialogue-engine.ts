"use client";

import type { useChat } from "@ai-sdk/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { AssistantUIMessage } from "@/lib/agents/assistant";

const MAX_LINE_LENGTH = 80;
const SENTENCE_BOUNDARY = /[^.!?]+[.!?]+[\])'"`]*\s*|[^.!?]+$/g;

export type DialogueEmotion = "neutral" | "happy" | "think" | "alert";

export type DialogueState =
  | "idle"
  | "npc-speaking"
  | "waiting-advance"
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

export interface DialogueChoice {
  id: string;
  label: string;
  shortcut?: string;
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
  advance: () => void;
  choices: DialogueChoice[];
  currentLine: DialogueLine | null;
  isThinking: boolean;
  lineIndex: number;
  log: DialogueLine[];
  markLineTyped: () => void;
  selectChoice: (choiceId: string) => void;
  skipTypewriter: boolean;
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
  delegate_task: [
    { id: "delegate-status", label: "View task status", shortcut: "A" },
    {
      id: "delegate-continue",
      label: "Continue with something else",
      shortcut: "B",
    },
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

  const isBusy = status === "submitted" || status === "streaming";

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

  // Stable NPC lines that are safe to reveal. While a message is still
  // streaming, its trailing (incomplete) segment is held back to avoid
  // re-splitting text mid-typewriter.
  const stableLines = useMemo(() => {
    const lines: DialogueLine[] = [npcLine(greeting)];
    const assistantMessages = messages.filter((m) => m.role === "assistant");
    const lastAssistant = assistantMessages.at(-1);

    for (const message of assistantMessages) {
      const segments = splitIntoLines(getMessageText(message));
      const isStreamingThisMessage = isBusy && message === lastAssistant;
      const committable = isStreamingThisMessage
        ? segments.slice(0, -1)
        : segments;

      for (const segment of committable) {
        lines.push(npcLine(segment));
      }
    }

    return lines;
  }, [messages, greeting, isBusy, npcLine]);

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

  const [revealIndex, setRevealIndex] = useState(0);
  const [lineTyped, setLineTyped] = useState(false);
  const [skipTypewriter, setSkipTypewriter] = useState(false);
  const [inputMode, setInputMode] = useState(false);

  const choices = useMemo(() => {
    const lastAssistant = messages.filter((m) => m.role === "assistant").at(-1);
    return isBusy ? [] : extractChoices(lastAssistant);
  }, [messages, isBusy]);

  const hasUnrevealed = revealIndex < stableLines.length;
  const currentLine = hasUnrevealed ? (stableLines[revealIndex] ?? null) : null;

  // When new lines stream in after the player opened the input, pull focus
  // back to the NPC so the reply is spoken.
  useEffect(() => {
    if (hasUnrevealed && inputMode) {
      setInputMode(false);
    }
  }, [hasUnrevealed, inputMode]);

  const isThinking = isBusy && !hasUnrevealed && !inputMode;

  let state: DialogueState;
  if (inputMode) {
    state = "player-input";
  } else if (hasUnrevealed) {
    state = lineTyped ? "waiting-advance" : "npc-speaking";
  } else if (choices.length > 0) {
    state = "player-choice";
  } else if (isBusy) {
    state = "idle";
  } else {
    state = "player-input";
  }

  const markLineTyped = useCallback(() => {
    setLineTyped(true);
    setSkipTypewriter(false);
  }, []);

  const goToNextLine = useCallback(() => {
    setRevealIndex((index) => index + 1);
    setLineTyped(false);
    setSkipTypewriter(false);
  }, []);

  const advance = useCallback(() => {
    if (!lineTyped && hasUnrevealed) {
      // Fast-forward the typewriter for the current line.
      setSkipTypewriter(true);
      return;
    }

    if (hasUnrevealed) {
      goToNextLine();
    }
  }, [lineTyped, hasUnrevealed, goToNextLine]);

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();

      if (!trimmed) {
        return;
      }

      setInputMode(false);
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
    currentLine,
    lineIndex: revealIndex,
    choices,
    isThinking,
    log,
    skipTypewriter,
    advance,
    selectChoice,
    submitInput: send,
    markLineTyped,
  };
}
