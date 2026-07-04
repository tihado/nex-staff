"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DialogueOverlay } from "@/components/dialogue/dialogue-overlay";
import { PixelCloseButton, PixelPanel } from "@/components/pixel";
import { TaskDetailPanel } from "@/components/task-board/task-detail-panel";
import { TaskStickyNote } from "@/components/task-board/task-sticky-note";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import {
  buildTaskDialogueContextFromSummary,
  buildTaskDialogueGreeting,
} from "@/lib/dialogue/task-context";
import { uiStrings } from "@/lib/i18n/ui";
import type { TaskSummary } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

interface TaskBoardOverlayProps {
  assistantName: string;
  error?: string | null;
  loading?: boolean;
  onClose: () => void;
  onViewDeliverable?: (taskId: string) => void;
  tasks: TaskSummary[];
}

export function TaskBoardOverlay({
  assistantName,
  tasks,
  loading = false,
  error = null,
  onClose,
  onViewDeliverable,
}: TaskBoardOverlayProps) {
  const [selectedTask, setSelectedTask] = useState<TaskSummary | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useFocusTrap(dialogRef);

  const taskDialogueGreeting = useMemo(() => {
    if (!selectedTask) {
      return "";
    }

    return buildTaskDialogueGreeting(
      assistantName,
      buildTaskDialogueContextFromSummary(selectedTask)
    );
  }, [assistantName, selectedTask]);

  const activeTasks = useMemo(
    () =>
      tasks.filter(
        (task) => task.status === "running" || task.status === "pending"
      ),
    [tasks]
  );

  const failedTasks = useMemo(
    () => tasks.filter((task) => task.status === "failed"),
    [tasks]
  );

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
  };

  const handleBackFromDetail = () => {
    setSelectedTask(null);
  };

  if (selectedTask) {
    return (
      <div
        aria-label="Task detail and assistant"
        aria-modal="true"
        className="fixed inset-0 z-50 flex flex-col bg-[var(--overlay-backdrop)]"
        role="dialog"
      >
        <div className="flex max-h-[min(46vh,420px)] min-h-0 shrink-0 flex-col p-4 pb-2">
          <PixelPanel
            className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 sm:p-5"
            contentClassName="flex min-h-0 flex-1 flex-col overflow-hidden"
            title="Task detail"
          >
            <TaskDetailPanel
              onBack={handleBackFromDetail}
              onClose={onClose}
              onViewDeliverable={onViewDeliverable}
              task={selectedTask}
              variant="split"
            />
          </PixelPanel>
        </div>

        <div className="flex min-h-0 flex-1 flex-col border-wood border-t-4 bg-bg-dialogue shadow-[0_-8px_24px_rgba(0,0,0,0.35)]">
          <DialogueOverlay
            greeting={taskDialogueGreeting}
            layout="panel"
            onClose={handleBackFromDetail}
            portraitIcon="android"
            speakerId="assistant"
            speakerName={assistantName}
            speakerRole="Coordinator"
            taskId={selectedTask.id}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      aria-labelledby="task-board-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-backdrop)] p-4"
      ref={dialogRef}
      role="dialog"
    >
      <PixelPanel
        className={cn(
          "flex max-h-[min(90vh,720px)] min-h-0 w-full max-w-3xl flex-col overflow-hidden p-4 sm:p-6"
        )}
        contentClassName="flex min-h-0 flex-1 flex-col overflow-hidden"
        title={uiStrings.taskBoard.title}
      >
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden pt-4">
          <div className="flex shrink-0 items-start justify-end">
            <PixelCloseButton
              aria-label={uiStrings.taskBoard.close}
              onClick={onClose}
            />
          </div>

          <h2 className="sr-only" id="task-board-title">
            {uiStrings.taskBoard.title}
          </h2>

          {loading ? (
            <p className="font-body text-[20px] text-text-muted">
              {uiStrings.taskBoard.loading}
            </p>
          ) : null}

          {error ? (
            <p className="font-body text-[20px] text-alert" role="alert">
              {error}
            </p>
          ) : null}

          {!(loading || error) &&
          activeTasks.length === 0 &&
          failedTasks.length === 0 ? (
            <p className="font-body text-[20px] text-text-muted">
              {uiStrings.taskBoard.empty}
            </p>
          ) : null}

          {!(loading || error) && activeTasks.length > 0 ? (
            <ul className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto overscroll-contain sm:grid-cols-2">
              {activeTasks.map((task) => (
                <li key={task.id}>
                  <TaskStickyNote onSelect={handleSelectTask} task={task} />
                </li>
              ))}
            </ul>
          ) : null}

          {!(loading || error) && failedTasks.length > 0 ? (
            <section className="flex min-h-0 flex-col gap-3">
              <h3 className="font-[family-name:var(--font-pixel)] text-[9px] text-alert uppercase tracking-wide">
                {uiStrings.taskBoard.failedSection}
              </h3>
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {failedTasks.map((task) => (
                  <li key={task.id}>
                    <TaskStickyNote onSelect={handleSelectTask} task={task} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </PixelPanel>
    </div>
  );
}
