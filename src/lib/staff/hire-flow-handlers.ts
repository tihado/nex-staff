import type {
  HireFlowDraft,
  HireFlowPhase,
  HireTone,
} from "@/lib/staff/hire-flow-types";

const TONE_BY_CHOICE: Record<string, HireTone> = {
  "tone-casual": "casual",
  "tone-formal": "formal",
  "tone-technical": "technical",
};

export interface HireFlowChoiceActions {
  onCancel?: () => void;
  reset: () => void;
  setDraft: (
    updater: HireFlowDraft | ((current: HireFlowDraft) => HireFlowDraft)
  ) => void;
  setPhase: (phase: HireFlowPhase) => void;
  submitHire: () => Promise<void>;
}

function closeFlow(actions: HireFlowChoiceActions): void {
  actions.reset();
  actions.onCancel?.();
}

function handleTaskProposeChoice(
  choiceId: string,
  actions: HireFlowChoiceActions
): void {
  if (choiceId === "hire-accept") {
    actions.setPhase("gather_tone");
    return;
  }

  if (choiceId === "hire-decline") {
    actions.reset();
  }
}

function handleProposeChoice(
  choiceId: string,
  actions: HireFlowChoiceActions
): void {
  if (choiceId === "hire-accept") {
    actions.setPhase("gather_name");
    return;
  }

  if (choiceId === "hire-explain") {
    actions.setPhase("explain");
    return;
  }

  if (choiceId === "hire-decline") {
    closeFlow(actions);
  }
}

function handleGatherToneChoice(
  choiceId: string,
  actions: HireFlowChoiceActions
): void {
  const tone = TONE_BY_CHOICE[choiceId];

  if (!tone) {
    return;
  }

  actions.setDraft((current) => ({ ...current, tone }));
  actions.setPhase("gather_docs");
}

function handleGatherDocsChoice(
  choiceId: string,
  actions: HireFlowChoiceActions
): void {
  if (choiceId === "docs-none") {
    actions.setDraft((current) => ({ ...current, documentIds: [] }));
    actions.setPhase("confirm");
    return;
  }

  if (!choiceId.startsWith("doc-")) {
    return;
  }

  actions.setDraft((current) => ({
    ...current,
    documentIds: [choiceId.slice("doc-".length)],
  }));
  actions.setPhase("confirm");
}

function handleConfirmChoice(
  choiceId: string,
  actions: HireFlowChoiceActions
): void {
  if (choiceId === "hire-confirm-final") {
    actions.submitHire().catch(() => {
      /* handled in submitHire */
    });
    return;
  }

  if (choiceId === "hire-edit") {
    actions.setPhase("gather_name");
  }
}

function handleTerminalChoice(
  choiceId: string,
  expectedChoiceId: string,
  actions: HireFlowChoiceActions
): void {
  if (choiceId === expectedChoiceId) {
    closeFlow(actions);
  }
}

const PHASE_HANDLERS: Partial<
  Record<
    HireFlowPhase,
    (choiceId: string, actions: HireFlowChoiceActions) => void
  >
> = {
  task_propose: handleTaskProposeChoice,
  propose: handleProposeChoice,
  explain: (_choiceId, actions) => actions.setPhase("propose"),
  gather_tone: handleGatherToneChoice,
  gather_docs: handleGatherDocsChoice,
  confirm: handleConfirmChoice,
  error: (choiceId, actions) =>
    handleTerminalChoice(choiceId, "hire-limit-ok", actions),
  celebrate: (choiceId, actions) =>
    handleTerminalChoice(choiceId, "hire-done", actions),
  delegate_offer: (choiceId, actions) => {
    if (choiceId === "hire-delegate-later") {
      actions.reset();
    }
  },
};

export function applyScriptedChoice(
  phase: HireFlowPhase,
  choiceId: string,
  actions: HireFlowChoiceActions
): void {
  PHASE_HANDLERS[phase]?.(choiceId, actions);
}
