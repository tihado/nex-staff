import { assignNewStaffToDesk } from "@/lib/staff/desk-assignments";
import type { HireFlowDraft } from "@/lib/staff/hire-flow-types";
import type { HireStaffResult } from "@/lib/staff/types";

const TONE_INSTRUCTIONS = {
  casual: "Write in a casual, friendly tone for startup founders.",
  formal: "Write in a formal, polished tone for enterprise readers.",
  technical: "Write in a technical tone for developers and practitioners.",
} as const;

export function buildHireInstructions(
  draft: Pick<HireFlowDraft, "tone" | "pendingTaskBrief">
): string {
  const parts: string[] = [TONE_INSTRUCTIONS[draft.tone]];

  if (draft.pendingTaskBrief?.trim()) {
    parts.push(
      `Initial context from the user: ${draft.pendingTaskBrief.trim()}`
    );
  }

  return parts.join(" ");
}

interface HireStaffApiError {
  code?: string;
  error?: string;
}

export async function hireStaffFromDraft(
  draft: HireFlowDraft
): Promise<HireStaffResult> {
  const response = await fetch("/api/staff", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: draft.name,
      role: draft.role,
      template: draft.template,
      instructions: buildHireInstructions(draft),
      documentIds: draft.documentIds,
      useSandbox: true,
    }),
  });

  const payload = (await response.json()) as HireStaffResult &
    HireStaffApiError;

  if (!response.ok) {
    throw new Error(payload.error ?? "Failed to hire staff.");
  }

  const assignedDeskSlotId = assignNewStaffToDesk(payload.id, draft.deskSlotId);

  return {
    ...payload,
    assignedDeskSlotId,
  };
}
