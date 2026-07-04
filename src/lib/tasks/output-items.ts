import type {
  TaskDetail,
  TaskPreviewRecord,
  TaskSummary,
} from "@/lib/tasks/types";

export type TaskOutputItemKind = "deliverable" | "draft";

export interface TaskOutputItem {
  content: string;
  contentType: string;
  id: string;
  kind: TaskOutputItemKind;
  subtitle?: string;
  title: string;
}

export function buildTaskOutputItems(
  task: TaskSummary,
  detail: TaskDetail | null,
  preview: TaskPreviewRecord | null
): TaskOutputItem[] {
  const items: TaskOutputItem[] = [];

  if (detail?.deliverable) {
    items.push({
      id: detail.deliverable.id,
      kind: "deliverable",
      title: detail.deliverable.title,
      contentType: detail.deliverable.contentType,
      content: detail.deliverable.content,
      subtitle: "Final deliverable",
    });
  }

  const draftContent = preview?.content.trim();

  if (
    draftContent &&
    (detail?.status === "pending" ||
      detail?.status === "running" ||
      !detail?.deliverable)
  ) {
    items.push({
      id: `draft-${task.id}`,
      kind: "draft",
      title: detail?.deliverable ? "Live draft" : "Draft preview",
      contentType: "text/markdown",
      content: draftContent,
      subtitle: preview?.excerpt || "In progress",
    });
  }

  return items;
}
