"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { DialogueState } from "@/hooks/use-dialogue-engine";
import {
  DEFAULT_HIRE_WRITER_NAME,
  summarizeTaskBrief,
} from "@/lib/dialogue/hire-intent";
import type { DialogueChoice } from "@/lib/dialogue/types";
import {
  fetchDocuments,
  mapDocumentsToChoices,
} from "@/lib/documents/list-client";
import { uiStrings } from "@/lib/i18n/ui";
import { resolveStaffDeskSlotId } from "@/lib/staff/desk-slots";
import { hireStaffFromDraft } from "@/lib/staff/hire-client";
import { applyScriptedChoice } from "@/lib/staff/hire-flow-handlers";
import {
  DEFAULT_HIRE_DRAFT,
  type HireFlowDraft,
  type HireFlowPhase,
} from "@/lib/staff/hire-flow-types";
import type { HireStaffResult } from "@/lib/staff/types";

export type {
  HireFlowDraft,
  HireFlowPhase,
  HireTone,
} from "@/lib/staff/hire-flow-types";

const DEFAULT_DRAFT = DEFAULT_HIRE_DRAFT;

const TONE_CHOICES: DialogueChoice[] = [
  { id: "tone-casual", label: "Casual — startup founders", shortcut: "A" },
  { id: "tone-formal", label: "Formal — enterprise", shortcut: "B" },
  { id: "tone-technical", label: "Technical — developers", shortcut: "C" },
];

const NONE_DOCUMENT_CHOICE: DialogueChoice = {
  id: "docs-none",
  label: uiStrings.notNeeded,
  shortcut: "A",
};

export interface UseHireFlowOptions {
  occupiedDeskSlotIds?: string[];
  onCancel?: () => void;
  onHired?: (result: HireStaffResult) => void;
}

export interface HireFlowScriptedContent {
  choices: DialogueChoice[];
  dialogueState: DialogueState;
  line: string;
}

export interface UseHireFlowResult {
  draft: HireFlowDraft;
  handleDelegateNow: () => string | null;
  handleNameInput: (name: string) => void;
  handleScriptedChoice: (choiceId: string) => void;
  hiredResult: HireStaffResult | null;
  isScriptedActive: boolean;
  phase: HireFlowPhase;
  reset: () => void;
  scripted: HireFlowScriptedContent | null;
  startFromAssistant: (pendingTaskBrief?: string) => void;
  startFromDesk: (deskId: string) => void;
  startFromTaskBrief: (brief: string, suggestedName?: string) => void;
}

function isScriptedPhase(phase: HireFlowPhase): boolean {
  return phase !== "idle" && phase !== "submitting";
}

export function useHireFlow(
  options: UseHireFlowOptions = {}
): UseHireFlowResult {
  const { occupiedDeskSlotIds = [], onCancel, onHired } = options;
  const [phase, setPhase] = useState<HireFlowPhase>("idle");
  const [draft, setDraft] = useState<HireFlowDraft>(DEFAULT_DRAFT);
  const [documentChoices, setDocumentChoices] = useState<DialogueChoice[]>([
    NONE_DOCUMENT_CHOICE,
  ]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hiredResult, setHiredResult] = useState<HireStaffResult | null>(null);

  const reset = useCallback(() => {
    setPhase("idle");
    setDraft(DEFAULT_DRAFT);
    setErrorMessage(null);
    setHiredResult(null);
  }, []);

  const startFromDesk = useCallback(
    (deskId: string) => {
      const slotId = resolveStaffDeskSlotId(deskId, occupiedDeskSlotIds);

      if (!slotId) {
        setErrorMessage("All desk slots are full.");
        setPhase("error");
        return;
      }

      setDraft({ ...DEFAULT_DRAFT, deskSlotId: slotId });
      setErrorMessage(null);
      setHiredResult(null);
      setPhase("propose");
    },
    [occupiedDeskSlotIds]
  );

  const startFromTaskBrief = useCallback(
    (brief: string, suggestedName: string = DEFAULT_HIRE_WRITER_NAME) => {
      const trimmedBrief = brief.trim();
      const slotId = resolveStaffDeskSlotId("hire-desk-a", occupiedDeskSlotIds);

      if (!slotId) {
        setErrorMessage("All desk slots are full.");
        setPhase("error");
        return;
      }

      setDraft({
        ...DEFAULT_DRAFT,
        pendingTaskBrief: trimmedBrief,
        name: suggestedName,
        deskSlotId: slotId,
      });
      setErrorMessage(null);
      setHiredResult(null);
      setPhase("task_propose");
    },
    [occupiedDeskSlotIds]
  );

  const startFromAssistant = useCallback((pendingTaskBrief?: string) => {
    setDraft({
      ...DEFAULT_DRAFT,
      pendingTaskBrief: pendingTaskBrief?.trim() || undefined,
    });
    setErrorMessage(null);
    setHiredResult(null);
    setPhase("idle");
  }, []);

  useEffect(() => {
    if (phase !== "gather_docs") {
      return;
    }

    let cancelled = false;

    fetchDocuments()
      .then((documents) => {
        if (!cancelled) {
          setDocumentChoices(mapDocumentsToChoices(documents));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDocumentChoices([NONE_DOCUMENT_CHOICE]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [phase]);

  const submitHire = useCallback(async () => {
    setPhase("submitting");

    try {
      const result = await hireStaffFromDraft(draft);
      setHiredResult(result);
      setPhase(draft.pendingTaskBrief?.trim() ? "delegate_offer" : "celebrate");
      onHired?.(result);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to hire staff."
      );
      setPhase("error");
    }
  }, [draft, onHired]);

  const handleNameInput = useCallback((name: string) => {
    const trimmed = name.trim();

    if (!trimmed) {
      return;
    }

    setDraft((current) => ({ ...current, name: trimmed }));
    setPhase("gather_tone");
  }, []);

  const handleScriptedChoice = useCallback(
    (choiceId: string) => {
      applyScriptedChoice(phase, choiceId, {
        onCancel,
        reset,
        setDraft,
        setPhase,
        submitHire,
      });
    },
    [onCancel, phase, reset, submitHire]
  );

  const handleDelegateNow = useCallback((): string | null => {
    if (!(hiredResult && draft.pendingTaskBrief?.trim())) {
      return null;
    }

    return `Please delegate this task to ${hiredResult.name} (staffId: ${hiredResult.id}): ${draft.pendingTaskBrief.trim()}`;
  }, [draft.pendingTaskBrief, hiredResult]);

  const scripted = useMemo((): HireFlowScriptedContent | null => {
    if (!isScriptedPhase(phase)) {
      return null;
    }

    switch (phase) {
      case "task_propose":
        return {
          line: uiStrings.hire.taskPropose(
            draft.name,
            summarizeTaskBrief(draft.pendingTaskBrief ?? "")
          ),
          choices: [
            {
              id: "hire-accept",
              label: uiStrings.hire.yesHireName(draft.name),
              shortcut: "A",
            },
            { id: "hire-decline", label: uiStrings.hire.notNow, shortcut: "B" },
          ],
          dialogueState: "player-choice",
        };

      case "propose":
        return {
          line: uiStrings.hire.proposeDesk,
          choices: [
            {
              id: "hire-accept",
              label: uiStrings.hire.yesHireWriter,
              shortcut: "A",
            },
            { id: "hire-decline", label: uiStrings.hire.notNow, shortcut: "B" },
            {
              id: "hire-explain",
              label: uiStrings.hire.explainMore,
              shortcut: "C",
            },
          ],
          dialogueState: "player-choice",
        };

      case "explain":
        return {
          line: uiStrings.hire.writerExplain,
          choices: [
            {
              id: "hire-accept",
              label: uiStrings.hire.yesHireWriter,
              shortcut: "A",
            },
            { id: "hire-decline", label: uiStrings.hire.notNow, shortcut: "B" },
          ],
          dialogueState: "player-choice",
        };

      case "gather_name":
        return {
          line: uiStrings.hire.gatherName,
          choices: [],
          dialogueState: "player-input",
        };

      case "gather_tone":
        return {
          line: uiStrings.hire.gatherTone(draft.name),
          choices: TONE_CHOICES,
          dialogueState: "player-choice",
        };

      case "gather_docs":
        return {
          line: uiStrings.hire.gatherDocs,
          choices: documentChoices,
          dialogueState: "player-choice",
        };

      case "confirm":
        return {
          line: uiStrings.hire.confirmHire(draft.name, draft.tone),
          choices: [
            {
              id: "hire-confirm-final",
              label: uiStrings.hire.confirmHireLabel(draft.name),
              shortcut: "A",
            },
            { id: "hire-edit", label: uiStrings.hire.edit, shortcut: "B" },
          ],
          dialogueState: "player-choice",
        };

      case "error":
        return {
          line: errorMessage ?? uiStrings.hire.staffLimit,
          choices: [
            { id: "hire-limit-ok", label: uiStrings.ok, shortcut: "A" },
          ],
          dialogueState: "player-choice",
        };

      case "celebrate":
        return {
          line: hiredResult
            ? uiStrings.hire.celebrateAtDesk(hiredResult.name)
            : uiStrings.hire.staffJoined,
          choices: [
            { id: "hire-done", label: uiStrings.hire.continue, shortcut: "A" },
          ],
          dialogueState: "player-choice",
        };

      case "delegate_offer": {
        const taskSummary = draft.pendingTaskBrief
          ? summarizeTaskBrief(draft.pendingTaskBrief)
          : uiStrings.hire.thisTask;

        return {
          line: hiredResult
            ? uiStrings.hire.delegateOffer(hiredResult.name, taskSummary)
            : uiStrings.hire.delegatePrompt,
          choices: [
            {
              id: "hire-delegate-now",
              label: uiStrings.hire.delegateNow,
              shortcut: "A",
            },
            {
              id: "hire-delegate-later",
              label: uiStrings.hire.delegateLater,
              shortcut: "B",
            },
          ],
          dialogueState: "player-choice",
        };
      }

      default:
        return null;
    }
  }, [
    documentChoices,
    draft.name,
    draft.pendingTaskBrief,
    draft.tone,
    errorMessage,
    hiredResult,
    phase,
  ]);

  return {
    phase,
    draft,
    scripted,
    isScriptedActive: isScriptedPhase(phase),
    hiredResult,
    startFromDesk,
    startFromTaskBrief,
    startFromAssistant,
    handleScriptedChoice,
    handleNameInput,
    handleDelegateNow,
    reset,
  };
}
