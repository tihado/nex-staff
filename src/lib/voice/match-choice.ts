import type { DialogueChoice } from "@/lib/dialogue/types";

const WORD_SPLIT_PATTERN = /\s+/;

export function matchChoiceFromTranscript(
  transcript: string,
  choices: DialogueChoice[]
): DialogueChoice | null {
  const normalized = transcript.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  for (const choice of choices) {
    if (choice.shortcut && normalized === choice.shortcut.toLowerCase()) {
      return choice;
    }
  }

  for (const choice of choices) {
    const label = choice.label.trim().toLowerCase();

    if (label && (normalized === label || normalized.includes(label))) {
      return choice;
    }
  }

  const firstWord = normalized.split(WORD_SPLIT_PATTERN)[0];

  for (const choice of choices) {
    if (choice.shortcut && firstWord === choice.shortcut.toLowerCase()) {
      return choice;
    }
  }

  return null;
}
