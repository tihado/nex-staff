import type { DialogueChoice } from "@/lib/dialogue/types";

export const COMPLETION_CUTSCENE_CHOICES: DialogueChoice[] = [
  { id: "completion-view", label: "Xem kết quả", shortcut: "A" },
  { id: "completion-delegate", label: "Giao việc tiếp", shortcut: "B" },
  { id: "completion-close", label: "Đóng", shortcut: "C" },
];

export const COMPLETION_CUTSCENE_PREVIEW_CHOICES: DialogueChoice[] = [
  { id: "completion-preview", label: "Mở website preview", shortcut: "A" },
  { id: "completion-view", label: "Xem chi tiết", shortcut: "B" },
  { id: "completion-delegate", label: "Giao việc tiếp", shortcut: "C" },
  { id: "completion-close", label: "Đóng", shortcut: "D" },
];

export const DELIVERABLE_TOOL_CHOICES: DialogueChoice[] = [
  { id: "deliverable-view", label: "Xem kết quả", shortcut: "A" },
  { id: "deliverable-continue", label: "Tiếp tục", shortcut: "B" },
];

export function buildCompletionCutsceneGreeting(
  staffName: string,
  title: string,
  websitePreviewUrl?: string | null
): string {
  if (websitePreviewUrl) {
    return `${staffName} vừa xong bài "${title}"! Website preview đã sẵn sàng — bạn có thể mở link để kiểm tra.`;
  }

  return `${staffName} vừa xong bài "${title}"!`;
}
