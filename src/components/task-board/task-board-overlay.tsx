"use client";

import { useEffect, useState } from "react";
import { PixelCloseButton, PixelPanel } from "@/components/pixel";
import { TaskDetailPanel } from "@/components/task-board/task-detail-panel";
import { TaskStickyNote } from "@/components/task-board/task-sticky-note";
import type { TaskDialogueContext } from "@/lib/dialogue/task-context";
import type { TaskSummary } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

interface TaskBoardOverlayProps {
  error?: string | null;
  loading?: boolean;
  onAskAssistant?: (context: TaskDialogueContext) => void;
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
  onAskAssistant,
}: TaskBoardOverlayProps) {
  const [selectedTask, setSelectedTask] = useState<TaskSummary | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      if (selectedTask) {
        setSelectedTask(null);
        return;
      }

      onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, selectedTask]);

  const handleSelectTask = (task: TaskSummary) => {
    setSelectedTask(task);
    onSelectTask?.(task);
  };

  const panelTitle = selectedTask ? "Task detail" : "Task Board";

  return (
    <div
      aria-labelledby="task-board-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-backdrop)] p-4"
      role="dialog"
    >
      <PixelPanel
        className={cn(
          "flex max-h-[min(90vh,720px)] min-h-0 w-full max-w-3xl flex-col overflow-hidden p-4 sm:p-6"
        )}
        title={panelTitle}
      >
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden pt-4">
          {selectedTask ? (
            <TaskDetailPanel
              onAskAssistant={onAskAssistant}
              onBack={() => setSelectedTask(null)}
              onClose={onClose}
              task={selectedTask}
            />
          ) : (
            <>
              <div className="flex shrink-0 items-start justify-end">
                <PixelCloseButton
                  aria-label="Close task board"
                  onClick={onClose}
                />
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
                  No active tasks. Delegate work from the Assistant to see
                  progress here.
                </p>
              ) : null}

              <ul className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto overscroll-contain sm:grid-cols-2">
                {tasks.map((task) => (
                  <li key={task.id}>
                    <TaskStickyNote onSelect={handleSelectTask} task={task} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </PixelPanel>
    </div>
  );
}
