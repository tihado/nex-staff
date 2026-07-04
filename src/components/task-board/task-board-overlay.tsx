"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DialogueOverlay } from "@/components/dialogue/dialogue-overlay";
import { PixelButton, PixelCloseButton, PixelPanel } from "@/components/pixel";
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
  const didAutoSelectRef = useRef(false);

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
    if (tasks.length === 0) {
      setSelectedTask(null);
      didAutoSelectRef.current = false;
      return;
    }

    if (selectedTask && !tasks.some((task) => task.id === selectedTask.id)) {
      setSelectedTask(tasks[0] ?? null);
      return;
    }

    if (!(selectedTask || didAutoSelectRef.current) && tasks[0]) {
      setSelectedTask(tasks[0]);
      didAutoSelectRef.current = true;
    }
  }, [selectedTask, tasks]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      const isMobile = window.matchMedia("(max-width: 767px)").matches;

      if (isMobile && selectedTask) {
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

  const listContent = (
    <>
      {loading ? (
        <p className="font-body text-[20px] text-ink-muted">
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
        <div
          className="flex flex-col items-center justify-center gap-3 py-10 text-center"
          id="task-board-title"
        >
          <p className="font-[family-name:var(--font-pixel)] text-[9px] text-ink uppercase">
            No Active Quests
          </p>
          <p className="max-w-sm font-body text-[18px] text-ink-muted leading-snug">
            {uiStrings.taskBoard.empty}
          </p>
        </div>
      ) : null}

      {activeTasks.length > 0 ? (
        <ul className="flex flex-col gap-3 pb-1">
          {activeTasks.map((task) => (
            <li key={task.id}>
              <TaskStickyNote
                onSelect={handleSelectTask}
                selected={selectedTask?.id === task.id}
                task={task}
              />
            </li>
          ))}
        </ul>
      ) : null}

      {failedTasks.length > 0 ? (
        <section className="mt-4 flex flex-col gap-2">
          <h3 className="font-[family-name:var(--font-pixel)] text-[8px] text-alert uppercase tracking-wide">
            {uiStrings.taskBoard.failedSection}
          </h3>
          <ul className="flex flex-col gap-3 pb-1">
            {failedTasks.map((task) => (
              <li key={task.id}>
                <TaskStickyNote
                  onSelect={handleSelectTask}
                  selected={selectedTask?.id === task.id}
                  task={task}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );

  return (
    <div
      aria-labelledby="task-board-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-backdrop)] p-3 sm:p-4"
      ref={dialogRef}
      role="dialog"
    >
      <PixelPanel
        className="flex max-h-[min(94vh,820px)] w-full max-w-5xl flex-col overflow-hidden"
        contentClassName="flex min-h-0 flex-1 flex-col overflow-hidden p-4 sm:p-5"
        title={uiStrings.taskBoard.title}
        titleInset
      >
        <h2 className="sr-only" id="task-board-title">
          {uiStrings.taskBoard.title}
        </h2>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
          <div className="flex shrink-0 items-start justify-between gap-3">
            {selectedTask ? (
              <PixelButton
                className="md:hidden"
                onClick={() => {
                  setSelectedTask(null);
                }}
              >
                ◀ Missions
              </PixelButton>
            ) : null}
            <p className="min-w-0 flex-1 font-body text-[16px] text-ink-muted leading-snug sm:text-[17px]">
              {selectedTask
                ? "Review quest progress below, then talk to the Coordinator."
                : "Select a mission to view objectives, progress, and rewards."}
            </p>
            <PixelCloseButton
              aria-label={uiStrings.taskBoard.close}
              className="shrink-0"
              onClick={onClose}
            />
          </div>

          <div
            className={cn(
              "grid min-h-0 flex-1 gap-4 overflow-hidden",
              selectedTask
                ? "md:grid-cols-[minmax(220px,32%)_minmax(0,1fr)]"
                : "md:grid-cols-1"
            )}
          >
            <div
              className={cn(
                "flex min-h-0 flex-col gap-2 overflow-hidden",
                selectedTask ? "hidden md:flex" : "flex"
              )}
            >
              <h3 className="shrink-0 font-[family-name:var(--font-pixel)] text-[8px] text-ink uppercase tracking-wide">
                Active Missions
              </h3>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
                {listContent}
              </div>
            </div>

            {selectedTask ? (
              <div className="flex min-h-0 flex-col overflow-hidden">
                <div className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden">
                  <div className="flex min-h-0 flex-[1_1_55%] flex-col overflow-hidden border-[3px] border-wood border-b-0 bg-panel/40">
                    <h3 className="shrink-0 border-wood border-b-2 bg-panel/80 px-3 py-1.5 font-[family-name:var(--font-pixel)] text-[8px] text-ink uppercase tracking-wide">
                      Quest Detail
                    </h3>
                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4">
                      <TaskDetailPanel
                        compact
                        onClose={onClose}
                        onViewDeliverable={onViewDeliverable}
                        task={selectedTask}
                      />
                    </div>
                  </div>

                  <div className="flex min-h-[260px] flex-[1_1_45%] flex-col overflow-hidden border-[3px] border-wood bg-bg-dialogue">
                    <div className="flex shrink-0 items-center border-wood border-b-2 bg-nameplate-bg px-3 py-1.5">
                      <p className="font-[family-name:var(--font-pixel)] text-[8px] text-sun uppercase tracking-wide">
                        Coordinator
                      </p>
                    </div>
                    <DialogueOverlay
                      embedded
                      greeting={taskDialogueGreeting}
                      layout="panel"
                      onClose={() => {
                        /* embedded — board close handles exit */
                      }}
                      onViewDeliverable={onViewDeliverable}
                      portraitIcon="android"
                      speakerId="assistant"
                      speakerName={assistantName}
                      speakerRole="Coordinator"
                      taskId={selectedTask.id}
                    />
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </PixelPanel>
    </div>
  );
}
