import { PixelProgressBar } from "@/components/pixel";
import { StaffAvatar } from "@/components/staff/staff-avatar";
import { truncateTaskBrief } from "@/lib/tasks/format";
import type { TaskSummary } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

interface TaskStickyNoteProps {
  onSelect?: (task: TaskSummary) => void;
  task: TaskSummary;
}

export function TaskStickyNote({ task, onSelect }: TaskStickyNoteProps) {
  const title = truncateTaskBrief(task.brief);
  const stepLabel = task.currentStep ?? "Starting…";

  return (
    <button
      className={cn(
        "flex w-full flex-col gap-3 border-[3px] border-wood bg-[#fff9c4] p-3 text-left shadow-[4px_4px_0_0_rgba(122,74,36,0.35)] transition-transform",
        "hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-pixel-accent focus-visible:outline-offset-2"
      )}
      onClick={() => onSelect?.(task)}
      type="button"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-[family-name:var(--font-pixel)] text-[9px] text-ink uppercase tracking-wide">
          {task.status === "pending" ? "▷" : "▶"} {title}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <StaffAvatar
          size={32}
          spriteId={task.staff.avatarSprite}
          staffId={task.staff.id}
        />
        <p className="font-[family-name:var(--font-pixel)] text-[8px] text-ink-muted uppercase">
          {task.staff.name}
        </p>
      </div>
      <PixelProgressBar
        label={`${task.progressPercent}%`}
        value={task.progressPercent}
      />
      <p className="font-body text-[18px] text-ink leading-snug">{stepLabel}</p>
    </button>
  );
}
