import type { TaskStatus } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

export function taskStatusBadgeClass(status: TaskStatus): string {
  switch (status) {
    case "running":
      return "border-[#b85c20] bg-[#ffc876] text-[#7a3d10]";
    case "completed":
      return "border-leaf-dark bg-leaf-light text-leaf-dark";
    case "failed":
    case "cancelled":
      return "border-alert bg-alert/15 text-alert";
    default:
      return "border-wood-dark bg-panel text-ink-muted";
  }
}

export function taskStickyNoteCardClass(
  status: TaskStatus,
  selected: boolean
): string {
  if (status === "running") {
    return cn(
      "border-[3px]",
      selected
        ? "border-[#8f4512] bg-[#ffb85c] shadow-[4px_4px_0_0_rgba(184,92,32,0.35)]"
        : "border-[#b85c20] bg-[#ffd9a8] shadow-[4px_4px_0_0_rgba(184,92,32,0.28)] hover:-translate-y-0.5 hover:bg-[#ffc876]"
    );
  }

  if (status === "completed") {
    return cn(
      "border-[3px]",
      selected
        ? "border-leaf-dark bg-[#e8f5e4] shadow-[4px_4px_0_0_rgba(47,125,46,0.3)]"
        : "border-leaf bg-[#f0faf0] shadow-[4px_4px_0_0_rgba(47,125,46,0.2)] hover:-translate-y-0.5 hover:bg-[#e8f5e4]"
    );
  }

  if (status === "failed" || status === "cancelled") {
    return cn(
      "border-[3px]",
      selected
        ? "border-alert bg-[#ffe8e8] shadow-[4px_4px_0_0_rgba(255,107,107,0.3)]"
        : "border-alert/70 bg-[#fff0f0] shadow-[4px_4px_0_0_rgba(255,107,107,0.2)] hover:-translate-y-0.5 hover:bg-[#ffe8e8]"
    );
  }

  return cn(
    "border-[3px]",
    selected
      ? "border-[#b85c20] bg-[#fff3a0] shadow-[4px_4px_0_0_rgba(184,92,32,0.35)]"
      : "border-wood bg-[#fff9c4] shadow-[4px_4px_0_0_rgba(122,74,36,0.25)] hover:-translate-y-0.5 hover:bg-[#fff3a0]"
  );
}

export function taskStickyNoteIconClass(status: TaskStatus): string {
  switch (status) {
    case "running":
      return "border-[#b85c20] bg-[#ffe9c8] text-[#a85618]";
    case "completed":
      return "border-leaf-dark bg-leaf-light text-leaf-dark";
    case "failed":
    case "cancelled":
      return "border-alert bg-alert/10 text-alert";
    default:
      return "border-wood-dark bg-panel text-ink";
  }
}

export function taskDetailStatusBadgeClass(status: TaskStatus): string {
  return cn(
    "border-2 px-2 py-1 font-[family-name:var(--font-pixel)] text-[8px] uppercase",
    taskStatusBadgeClass(status)
  );
}
