import type { AssistantUIMessage } from "@/lib/agents/assistant";
import type { DialogueChoice } from "@/lib/dialogue/types";

const DELEGATE_PROPOSAL_RE =
  /\b(shall I|should I|would you like me to|want me to|I can|I could)\b[\s\S]*\b(delegate|assign|hand (?:this|it) off|give this)\b/i;

const STAFF_NAME_RE = /\b(?:to|for|with)\s+([A-Z][\w'-]+)\b/;

const DELEGATE_TO_NAME_RE = /\bdelegate\b[\s\S]*?\bto\s+([A-Z][\w'-]+)\b/i;

export const DELEGATE_SUCCESS_CHOICES: DialogueChoice[] = [
  { id: "delegate-status", label: "View task status", shortcut: "A" },
  {
    id: "delegate-continue",
    label: "Continue with something else",
    shortcut: "B",
  },
];

function getMessageText(message: AssistantUIMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => ("text" in part ? part.text : ""))
    .join("");
}

function hasDelegateTaskPart(message: AssistantUIMessage): boolean {
  return message.parts.some((part) => part.type === "tool-delegate_task");
}

function hasDelegateTaskSuccess(message: AssistantUIMessage): boolean {
  return message.parts.some(
    (part) =>
      part.type === "tool-delegate_task" &&
      "state" in part &&
      part.state === "output-available"
  );
}

function extractStaffNameFromProposal(text: string): string | undefined {
  const delegateMatch = text.match(DELEGATE_TO_NAME_RE);
  if (delegateMatch?.[1]) {
    return delegateMatch[1];
  }

  const nameMatch = text.match(STAFF_NAME_RE);
  return nameMatch?.[1];
}

export function extractDelegateProposalChoices(
  message: AssistantUIMessage | undefined
): DialogueChoice[] {
  if (!message) {
    return [];
  }

  if (hasDelegateTaskSuccess(message)) {
    return DELEGATE_SUCCESS_CHOICES;
  }

  if (hasDelegateTaskPart(message)) {
    return [];
  }

  const text = getMessageText(message).trim();

  if (!(text && DELEGATE_PROPOSAL_RE.test(text))) {
    return [];
  }

  const staffName = extractStaffNameFromProposal(text);

  if (staffName) {
    return [
      {
        id: "delegate-confirm",
        label: `Delegate to ${staffName}`,
        shortcut: "A",
      },
      { id: "delegate-cancel", label: "Not now", shortcut: "B" },
    ];
  }

  return [
    { id: "delegate-confirm", label: "Yes, delegate now", shortcut: "A" },
    { id: "delegate-cancel", label: "Not now", shortcut: "B" },
  ];
}
