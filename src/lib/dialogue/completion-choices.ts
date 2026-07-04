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

export const COMPLETION_CUTSCENE_PREVIEW_CHOICES: DialogueChoice[] = [
  {
    id: "completion-preview",
    label: uiStrings.completion.openWebsitePreview,
    shortcut: "A",
  },
  {
    id: "completion-view",
    label: uiStrings.completion.viewDetails,
    shortcut: "B",
  },
  {
    id: "completion-delegate",
    label: uiStrings.completion.delegateMore,
    shortcut: "C",
  },
  { id: "completion-close", label: uiStrings.completion.close, shortcut: "D" },
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
  title: string,
  websitePreviewUrl?: string | null
): string {
  if (websitePreviewUrl) {
    return uiStrings.completion.greetingWithPreview(staffName, title);
  }

  return uiStrings.completion.greeting(staffName, title);
}
