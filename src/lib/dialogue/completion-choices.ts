import type { DialogueChoice } from "@/lib/dialogue/types";

export const COMPLETION_CUTSCENE_CHOICES: DialogueChoice[] = [
  { id: "completion-view", label: "Xem kết quả", shortcut: "A" },
  { id: "completion-delegate", label: "Giao việc tiếp", shortcut: "B" },
  { id: "completion-close", label: "Đóng", shortcut: "C" },
];

export const DELIVERABLE_TOOL_CHOICES: DialogueChoice[] = [
  { id: "deliverable-view", label: "Xem kết quả", shortcut: "A" },
  { id: "deliverable-continue", label: "Tiếp tục", shortcut: "B" },
];

export function buildCompletionCutsceneGreeting(
  staffName: string,
  title: string
): string {
  return `${staffName} vừa xong bài "${title}"!`;
}
