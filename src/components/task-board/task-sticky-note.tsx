import { PixelIcon, PixelProgressBar } from "@/components/pixel";
import { StaffAvatar } from "@/components/staff/staff-avatar";
import { formatTaskStatusLabel } from "@/lib/tasks/event-label";
import { truncateTaskBrief } from "@/lib/tasks/format";
import {
  taskStatusBadgeClass,
  taskStickyNoteCardClass,
  taskStickyNoteIconClass,
} from "@/lib/tasks/status-style";
import type { TaskSummary } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

interface TaskStickyNoteProps {
  onSelect?: (task: TaskSummary) => void;
  selected?: boolean;
  task: TaskSummary;
}

function questStatusIcon(status: TaskSummary["status"]): string {
  switch (status) {
    case "completed":
      return "check";
    case "failed":
    case "cancelled":
      return "close";
    case "running":
      return "play";
    default:
      return "hourglass";
  }
}

function questListPrefix(selected: boolean, isRunning: boolean): string {
  if (selected || isRunning) {
    return "▶";
  }

  return "▷";
}

export function TaskStickyNote({
  task,
  onSelect,
  selected = false,
}: TaskStickyNoteProps) {
  const title = truncateTaskBrief(task.brief, 42);
  const isFailed = task.status === "failed";
  const stepLabel = isFailed
    ? (task.failureMessage ?? task.currentStep ?? "Task failed.")
    : (task.currentStep ?? "Awaiting start…");
  const isRunning = task.status === "running";

  return (
    <button
      aria-current={selected ? "true" : undefined}
      className={cn(
        "flex w-full flex-col gap-2.5 p-3.5 text-left transition-transform",
        taskStickyNoteCardClass(task.status, selected),
        "focus-visible:outline-2 focus-visible:outline-pixel-accent focus-visible:outline-offset-2"
      )}
      onClick={() => onSelect?.(task)}
      type="button"
    >
      <div className="flex items-start gap-2">
        <span
          aria-hidden
          className={cn(
            "mt-0.5 flex size-7 shrink-0 items-center justify-center border-2",
            taskStickyNoteIconClass(task.status)
          )}
        >
          <PixelIcon name={questStatusIcon(task.status)} size={16} />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
            <span
              className={cn(
                "line-clamp-2 font-[family-name:var(--font-pixel)] text-[8px] uppercase leading-[1.65] tracking-wide",
                isRunning ? "text-[#7a3d10]" : "text-ink"
              )}
            >
              {questListPrefix(selected, isRunning)} {title}
            </span>
            <span
              className={cn(
                "w-fit shrink-0 border-2 px-1.5 py-0.5 font-[family-name:var(--font-pixel)] text-[7px] uppercase leading-none",
                taskStatusBadgeClass(task.status)
              )}
            >
              {formatTaskStatusLabel(task.status)}
            </span>
          </span>
        </span>
      </div>

      <div className="flex items-center gap-2">
        <StaffAvatar
          size={28}
          spriteId={task.staff.avatarSprite}
          staffId={task.staff.id}
        />
        <span
          className={cn(
            "font-[family-name:var(--font-pixel)] text-[7px] uppercase",
            isRunning ? "text-[#9a5a28]" : "text-ink-muted"
          )}
        >
          {task.staff.name}
        </span>
      </div>

      <PixelProgressBar
        label={isFailed ? "Failed" : `${task.progressPercent}%`}
        segments={8}
        value={isFailed ? 100 : task.progressPercent}
      />

      <p
        className={cn(
          "line-clamp-2 font-body text-[16px] leading-snug",
          isFailed ? "text-alert" : isRunning ? "text-[#7a3d10]" : "text-ink"
        )}
      >
        {stepLabel}
      </p>
    </button>
  );
}
