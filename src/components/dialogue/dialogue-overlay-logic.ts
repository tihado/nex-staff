import { useEffect, useRef, useState } from "react";
import type { useDialogueEngine } from "@/hooks/use-dialogue-engine";
import type { useHireFlow } from "@/hooks/use-hire-flow";
import type { AssistantUIMessage } from "@/lib/agents/assistant";
import { readDeliverableTaskIdFromMessage } from "@/lib/dialogue/deliverable-choices";
import { extractHireStaffSuccessOutput } from "@/lib/dialogue/hire-choices";
import { detectWriteIntent } from "@/lib/dialogue/hire-intent";
import { assignNewStaffToDesk } from "@/lib/staff/desk-assignments";
import type { HireStaffResult } from "@/lib/staff/types";

interface HireDialogueContextLike {
  deskId?: string;
  mode?: "scripted" | "assistant";
  pendingTaskBrief?: string;
}

type HireFlowHelpers = ReturnType<typeof useHireFlow>;
type DialogueEngineHelpers = ReturnType<typeof useDialogueEngine>;

export function useScriptedDeskHireEffect(
  hireContext: HireDialogueContextLike | undefined,
  startFromDesk: (deskId: string) => void
): void {
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
    startFromDesk(hireContext.deskId);
  }, [hireContext?.deskId, hireContext?.mode, startFromDesk]);
}

export function useAssistantHireSuccessEffect(
  hireContext: HireDialogueContextLike | undefined,
  hireFlow: HireFlowHelpers,
  lastAssistant: AssistantUIMessage | undefined,
  onStaffHired?: (result: HireStaffResult) => void
): void {
  const assistantHireHandledRef = useRef<string | null>(null);

  useEffect(() => {
    if (hireContext?.mode === "scripted") {
      return;
    }

    if (hireFlow.phase !== "idle") {
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
  }, [hireContext?.mode, hireFlow.phase, lastAssistant, onStaffHired]);
}

interface ChoiceSelectionContext {
  choiceId: string;
  engine: DialogueEngineHelpers;
  hireFlow: HireFlowHelpers;
  lastAssistant: AssistantUIMessage | undefined;
  onViewDeliverable?: (taskId: string) => void;
  taskId?: string;
  useScriptedUi: boolean;
}

export function handleDialogueChoiceSelection({
  choiceId,
  engine,
  hireFlow,
  lastAssistant,
  onViewDeliverable,
  taskId,
  useScriptedUi,
}: ChoiceSelectionContext): void {
  if (choiceId === "hire-delegate-now" && hireFlow.phase === "delegate_offer") {
    const delegateMessage = hireFlow.handleDelegateNow();

    if (delegateMessage) {
      hireFlow.reset();
      engine.submitInput({ text: delegateMessage });
    }

    return;
  }

  if (choiceId === "deliverable-view") {
    const deliverableTaskId =
      readDeliverableTaskIdFromMessage(lastAssistant) ?? taskId;

    if (deliverableTaskId && onViewDeliverable) {
      onViewDeliverable(deliverableTaskId);
    }

    return;
  }

  if (choiceId === "deliverable-continue") {
    engine.submitInput({ text: "Continue" });
    return;
  }

  if (useScriptedUi) {
    hireFlow.handleScriptedChoice(choiceId);
    return;
  }

  engine.selectChoice(choiceId);
}

interface InputSubmissionContext {
  engine: DialogueEngineHelpers;
  hasWriterOnRoster: boolean;
  hireContext: HireDialogueContextLike | undefined;
  hireFlow: HireFlowHelpers;
  payload: { text: string };
  useScriptedUi: boolean;
}

export function handleDialogueInputSubmission({
  payload,
  useScriptedUi,
  hireFlow,
  hireContext,
  hasWriterOnRoster,
  engine,
}: InputSubmissionContext): void {
  if (useScriptedUi && hireFlow.phase === "gather_name") {
    hireFlow.handleNameInput(payload.text);
    return;
  }

  const writeIntent =
    hireContext?.mode === "assistant" &&
    hireFlow.phase === "idle" &&
    !hasWriterOnRoster
      ? detectWriteIntent(payload.text)
      : null;

  if (writeIntent) {
    hireFlow.startFromTaskBrief(writeIntent.brief, writeIntent.suggestedName);
    return;
  }

  engine.submitInput(payload);
}

export function resolveScriptedUi(
  hireContext: HireDialogueContextLike | undefined,
  hireFlow: HireFlowHelpers
): boolean {
  if (hireContext?.mode === "scripted") {
    return hireFlow.isScriptedActive;
  }

  return hireFlow.isScriptedActive && hireFlow.phase !== "idle";
}

export function useDialoguePanelChrome(
  onClose: () => void,
  displayText: string,
  enableClose = true
) {
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

  useEffect(() => {
    if (!enableClose) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();

      if (logOpen) {
        setLogOpen(false);
        return;
      }

      onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enableClose, logOpen, onClose]);

  return {
    logOpen,
    scrollRef,
    setLogOpen,
  };
}

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
