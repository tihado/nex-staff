import type { DialogueChoice } from "@/lib/dialogue/types";
import { uiStrings } from "@/lib/i18n/ui";

export const COMPLETION_CUTSCENE_CHOICES: DialogueChoice[] = [
  {
    id: "completion-view",
    label: uiStrings.completion.viewResult,
    shortcut: "A",
  },
  {
    id: "completion-delegate",
    label: uiStrings.completion.delegateMore,
    shortcut: "B",
  },
  { id: "completion-close", label: uiStrings.completion.close, shortcut: "C" },
];

export const DELIVERABLE_TOOL_CHOICES: DialogueChoice[] = [
  {
    id: "deliverable-view",
    label: uiStrings.completion.viewResult,
    shortcut: "A",
  },
  { id: "deliverable-continue", label: uiStrings.hire.continue, shortcut: "B" },
];

export function buildCompletionCutsceneGreeting(
  staffName: string,
  title: string
): string {
  return uiStrings.completion.greeting(staffName, title);
}
