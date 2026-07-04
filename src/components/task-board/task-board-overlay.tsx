"use client";

import { useEffect } from "react";
import { PixelCloseButton, PixelPanel } from "@/components/pixel";
import { TaskStickyNote } from "@/components/task-board/task-sticky-note";
import type { TaskSummary } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

interface TaskBoardOverlayProps {
  error?: string | null;
  loading?: boolean;
  onClose: () => void;
  onSelectTask?: (task: TaskSummary) => void;
  tasks: TaskSummary[];
}

export function TaskBoardOverlay({
  tasks,
  loading = false,
  error = null,
  onClose,
  onSelectTask,
}: TaskBoardOverlayProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      aria-labelledby="task-board-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-backdrop)] p-4"
      role="dialog"
    >
      <PixelPanel
        className={cn(
          "flex max-h-[min(90vh,640px)] w-full max-w-3xl flex-col gap-4 p-4 sm:p-6"
        )}
        title="Task Board"
      >
        <div className="flex items-start justify-end">
          <PixelCloseButton aria-label="Close task board" onClick={onClose} />
        </div>

        {loading ? (
          <p className="font-body text-[20px] text-text-muted">
            Loading active tasks…
          </p>
        ) : null}

        {error ? (
          <p className="font-body text-[20px] text-alert" role="alert">
            {error}
          </p>
        ) : null}

        {!(loading || error) && tasks.length === 0 ? (
          <p
            className="font-body text-[20px] text-text-muted"
            id="task-board-title"
          >
            No active tasks. Delegate work from the Assistant to see progress
            here.
          </p>
        ) : null}

        <ul className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto sm:grid-cols-2">
          {tasks.map((task) => (
            <li key={task.id}>
              <TaskStickyNote onSelect={onSelectTask} task={task} />
            </li>
          ))}
        </ul>
      </PixelPanel>
    </div>
  );
}
