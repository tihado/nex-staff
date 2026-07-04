import type { DialogueChoice } from "@/lib/dialogue/types";
import { uiStrings } from "@/lib/i18n/ui";

const SHORTCUTS = ["A", "B", "C", "D", "E"] as const;

export function buildCompletionCutsceneChoices(input: {
  mergeAwaitingConfirm?: boolean;
  prMerged: boolean;
  prUrl: string | null;
  websitePreviewUrl: string | null;
}): DialogueChoice[] {
  const items: Array<{ id: string; label: string }> = [];

  if (input.websitePreviewUrl) {
    items.push({
      id: "completion-preview",
      label: uiStrings.completion.openWebsitePreview,
    });
  }

  if (input.prUrl && !input.prMerged) {
    items.push({
      id: input.mergeAwaitingConfirm
        ? "completion-merge-confirm"
        : "completion-merge",
      label: input.mergeAwaitingConfirm
        ? uiStrings.coder.confirmMerge
        : uiStrings.completion.mergeToMain,
    });
  }

  items.push(
    {
      id: "completion-view",
      label: input.websitePreviewUrl
        ? uiStrings.completion.viewDetails
        : uiStrings.completion.viewResult,
    },
    {
      id: "completion-delegate",
      label: uiStrings.completion.delegateMore,
    },
    { id: "completion-close", label: uiStrings.completion.close }
  );

  return items.map((item, index) => ({
    ...item,
    shortcut: SHORTCUTS[index] ?? String(index + 1),
  }));
}

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
  title: string,
  websitePreviewUrl?: string | null
): string {
  if (websitePreviewUrl) {
    return uiStrings.completion.greetingWithPreview(staffName, title);
  }

  return uiStrings.completion.greeting(staffName, title);
}
