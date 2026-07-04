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

const WRITER_EXPLAIN_LINE =
  "Content Writer viết blog, bài dài, và adapt tone theo brief. Có sandbox để draft file deliverable.";

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
    { id: "docs-none", label: "Không cần", shortcut: "A" },
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
          setDocumentChoices([
            { id: "docs-none", label: "Không cần", shortcut: "A" },
          ]);
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
          line: `Chưa có Writer — muốn hire ${draft.name} để ${summarizeTaskBrief(draft.pendingTaskBrief ?? "")} không?`,
          choices: [
            {
              id: "hire-accept",
              label: `Có, hire ${draft.name}`,
              shortcut: "A",
            },
            { id: "hire-decline", label: "Không, để sau", shortcut: "B" },
          ],
          dialogueState: "player-choice",
        };

      case "propose":
        return {
          line: "Muốn hire Content Writer cho bàn này? Họ sẽ viết blog và nội dung dài theo tone bạn chọn.",
          choices: [
            {
              id: "hire-accept",
              label: "Có, hire Content Writer",
              shortcut: "A",
            },
            { id: "hire-decline", label: "Không, để sau", shortcut: "B" },
            { id: "hire-explain", label: "Giải thích thêm", shortcut: "C" },
          ],
          dialogueState: "player-choice",
        };

      case "explain":
        return {
          line: WRITER_EXPLAIN_LINE,
          choices: [
            {
              id: "hire-accept",
              label: "Có, hire Content Writer",
              shortcut: "A",
            },
            { id: "hire-decline", label: "Không, để sau", shortcut: "B" },
          ],
          dialogueState: "player-choice",
        };

      case "gather_name":
        return {
          line: "Tên staff là gì? (ví dụ: Alex)",
          choices: [],
          dialogueState: "player-input",
        };

      case "gather_tone":
        return {
          line: `Tone viết cho ${draft.name || "staff"} thế nào?`,
          choices: TONE_CHOICES,
          dialogueState: "player-choice",
        };

      case "gather_docs":
        return {
          line: "Link tài liệu tham khảo nào?",
          choices: documentChoices,
          dialogueState: "player-choice",
        };

      case "confirm":
        return {
          line: `Xác nhận hire ${draft.name} (Content Writer) với tone ${draft.tone}?`,
          choices: [
            {
              id: "hire-confirm-final",
              label: `Xác nhận hire ${draft.name} (Content Writer)`,
              shortcut: "A",
            },
            { id: "hire-edit", label: "Sửa lại", shortcut: "B" },
          ],
          dialogueState: "player-choice",
        };

      case "error":
        return {
          line:
            errorMessage ??
            "Không thể hire thêm staff. Bạn đã đạt giới hạn tối đa.",
          choices: [{ id: "hire-limit-ok", label: "OK", shortcut: "A" }],
          dialogueState: "player-choice",
        };

      case "celebrate":
        return {
          line: hiredResult
            ? `${hiredResult.name} đã sẵn sàng tại bàn! ✨`
            : "Staff đã join team!",
          choices: [{ id: "hire-done", label: "Tiếp tục", shortcut: "A" }],
          dialogueState: "player-choice",
        };

      case "delegate_offer": {
        const taskSummary = draft.pendingTaskBrief
          ? summarizeTaskBrief(draft.pendingTaskBrief)
          : "việc này";

        return {
          line: hiredResult
            ? `${hiredResult.name} đã sẵn sàng! Giao việc ${taskSummary} ngay không?`
            : "Giao việc ngay?",
          choices: [
            { id: "hire-delegate-now", label: "Giao việc ngay", shortcut: "A" },
            { id: "hire-delegate-later", label: "Để sau", shortcut: "B" },
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
