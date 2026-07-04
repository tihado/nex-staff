import type { AssistantUIMessage } from "@/lib/agents/assistant";
import type { DialogueChoice } from "@/lib/dialogue/types";

const HIRE_PROPOSAL_RE =
  /\b(hire|tuyển|recruit)\b[\s\S]*\b(content writer|writer|viết)\b/i;

const HIRE_CONFIRM_RE = /\b(xác nhận|confirm|ready to hire|sẵn sàng hire)\b/i;

const STAFF_NAME_RE = /\b([A-Z][\w'-]+)\s*\(\s*content writer\s*\)/i;

export const HIRE_PROPOSE_CHOICES: DialogueChoice[] = [
  { id: "hire-accept", label: "Có, hire Content Writer", shortcut: "A" },
  { id: "hire-decline", label: "Không, để sau", shortcut: "B" },
  { id: "hire-explain", label: "Giải thích thêm", shortcut: "C" },
];

export const HIRE_LIMIT_CHOICES: DialogueChoice[] = [
  { id: "hire-limit-ok", label: "OK", shortcut: "A" },
];

export const HIRE_SUCCESS_CHOICES: DialogueChoice[] = [
  { id: "hire-done", label: "Tiếp tục", shortcut: "A" },
];

export const HIRE_DELEGATE_CHOICES: DialogueChoice[] = [
  { id: "hire-delegate-now", label: "Giao việc ngay", shortcut: "A" },
  { id: "hire-delegate-later", label: "Để sau", shortcut: "B" },
];

function getMessageText(message: AssistantUIMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => ("text" in part ? part.text : ""))
    .join("");
}

function hasHireStaffPart(message: AssistantUIMessage): boolean {
  return message.parts.some((part) => part.type === "tool-hire_staff");
}

function hasHireStaffSuccess(message: AssistantUIMessage): boolean {
  return message.parts.some(
    (part) =>
      part.type === "tool-hire_staff" &&
      "state" in part &&
      part.state === "output-available"
  );
}

function hasHireStaffError(message: AssistantUIMessage): boolean {
  return message.parts.some(
    (part) =>
      part.type === "tool-hire_staff" &&
      "state" in part &&
      part.state === "output-error"
  );
}

export function extractHireStaffSuccessOutput(
  message: AssistantUIMessage | undefined
): Record<string, unknown> | null {
  if (!message) {
    return null;
  }

  for (const part of message.parts) {
    if (
      part.type === "tool-hire_staff" &&
      "state" in part &&
      part.state === "output-available" &&
      "output" in part &&
      part.output &&
      typeof part.output === "object"
    ) {
      return part.output as Record<string, unknown>;
    }
  }

  return null;
}

export function extractHireProposalChoices(
  message: AssistantUIMessage | undefined
): DialogueChoice[] {
  if (!message) {
    return [];
  }

  if (hasHireStaffSuccess(message)) {
    return HIRE_SUCCESS_CHOICES;
  }

  if (hasHireStaffError(message)) {
    return HIRE_LIMIT_CHOICES;
  }

  if (hasHireStaffPart(message)) {
    return [];
  }

  const text = getMessageText(message).trim();

  if (!text) {
    return [];
  }

  if (HIRE_CONFIRM_RE.test(text)) {
    const nameMatch = text.match(STAFF_NAME_RE);
    const name = nameMatch?.[1];

    return [
      {
        id: "hire-confirm-final",
        label: name
          ? `Xác nhận hire ${name} (Content Writer)`
          : "Xác nhận hire Content Writer",
        shortcut: "A",
      },
      { id: "hire-edit", label: "Sửa lại", shortcut: "B" },
    ];
  }

  if (HIRE_PROPOSAL_RE.test(text)) {
    return HIRE_PROPOSE_CHOICES;
  }

  return [];
}

export function extractHireDelegateChoices(
  message: AssistantUIMessage | undefined,
  pendingTaskBrief?: string
): DialogueChoice[] {
  if (!(pendingTaskBrief?.trim() && message)) {
    return [];
  }

  if (!hasHireStaffSuccess(message)) {
    return [];
  }

  return HIRE_DELEGATE_CHOICES;
}
