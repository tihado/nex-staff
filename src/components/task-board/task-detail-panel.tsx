"use client";

import { useState } from "react";
import {
  PixelButton,
  PixelCloseButton,
  PixelProgressBar,
} from "@/components/pixel";
import { DeliverablePreviewOverlay } from "@/components/task-board/deliverable-preview-overlay";
import { TaskOutputList } from "@/components/task-board/task-output-list";
import { useTaskDetail } from "@/hooks/use-task-detail";
import type { TaskDialogueContext } from "@/lib/dialogue/task-context";
import type { TaskCheckpoint } from "@/lib/tasks/checkpoints";
import { parseTaskCheckpoints } from "@/lib/tasks/checkpoints";
import {
  formatTaskEventLabel,
  shouldShowTaskEvent,
} from "@/lib/tasks/event-label";
import {
  buildTaskOutputItems,
  type TaskOutputItem,
} from "@/lib/tasks/output-items";
import type {
  TaskDetail,
  TaskEventRecord,
  TaskSummary,
} from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

interface TaskDetailPanelProps {
  onAskAssistant?: (context: TaskDialogueContext) => void;
  onBack: () => void;
  onClose: () => void;
  onViewDeliverable?: (taskId: string) => void;
  task: TaskSummary;
  variant?: "modal" | "split";
}

function formatEventTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function TaskDetailToolbar({
  loading,
  onBack,
  onClose,
  onRefresh,
}: {
  loading: boolean;
  onBack: () => void;
  onClose: () => void;
  onRefresh: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <PixelButton onClick={onBack}>◀ Back</PixelButton>
      <div className="flex items-center gap-2">
        <PixelButton disabled={loading} onClick={onRefresh}>
          Refresh
        </PixelButton>
        <PixelCloseButton aria-label="Close task board" onClick={onClose} />
      </div>
    </div>
  );
}

function TaskDetailSummary({
  detail,
  task,
}: {
  detail: TaskDetail | null;
  task: TaskSummary;
}) {
  const status = detail?.status ?? task.status;
  const isCompleted = status === "completed";

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-[family-name:var(--font-pixel)] text-[10px] text-ink uppercase tracking-wide">
        Task detail
      </h2>
      <p className="font-body text-[22px] text-ink leading-snug">
        {detail?.brief ?? task.brief}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-[family-name:var(--font-pixel)] text-[8px] text-ink-muted uppercase">
          {detail?.staff.name ?? task.staff.name}
        </span>
        <span
          className={cn(
            "border-2 border-wood-dark px-2 py-0.5 font-[family-name:var(--font-pixel)] text-[8px] uppercase",
            isCompleted ? "bg-leaf-light text-leaf-dark" : "bg-panel text-ink"
          )}
        >
          {status}
        </span>
      </div>
      <PixelProgressBar
        label={`${detail?.progressPercent ?? task.progressPercent}%`}
        value={detail?.progressPercent ?? task.progressPercent}
      />
      <p className="font-body text-[18px] text-ink-muted">
        {detail?.currentStep ?? task.currentStep ?? "Starting…"}
      </p>
    </section>
  );
}

function TaskCheckpointsSection({
  checkpoints,
}: {
  checkpoints: TaskCheckpoint[];
}) {
  if (checkpoints.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-2">
      <h3 className="font-[family-name:var(--font-pixel)] text-[9px] text-ink uppercase tracking-wide">
        Checkpoints
      </h3>
      <ol className="flex flex-col gap-2">
        {checkpoints.map((checkpoint) => (
          <li
            className="border-2 border-wood bg-panel px-3 py-2 font-body text-[18px] text-ink"
            key={`${checkpoint.order}-${checkpoint.label}`}
          >
            <span className="font-[family-name:var(--font-pixel)] text-[8px] text-ink-muted uppercase">
              {checkpoint.order}. {checkpoint.label}
            </span>
            <p className="mt-1 text-[16px] text-ink-muted leading-snug">
              {checkpoint.criteria}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function TaskProgressSection({ events }: { events: TaskEventRecord[] }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="font-[family-name:var(--font-pixel)] text-[9px] text-ink uppercase tracking-wide">
        Progress
      </h3>
      {events.length === 0 ? (
        <p className="font-body text-[18px] text-text-muted">
          No progress events yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {events.map((event) => (
            <li
              className="flex items-start justify-between gap-3 border-wood-dark border-l-4 bg-[#fff9c4]/60 px-3 py-2"
              key={event.id}
            >
              <span className="font-body text-[17px] text-ink leading-snug">
                {formatTaskEventLabel(event)}
              </span>
              <time
                className="shrink-0 font-[family-name:var(--font-pixel)] text-[7px] text-ink-muted uppercase"
                dateTime={event.createdAt}
              >
                {formatEventTime(event.createdAt)}
              </time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function TaskOutputSection({
  items,
  onSelectItem,
}: {
  items: TaskOutputItem[];
  onSelectItem: (item: TaskOutputItem) => void;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="font-[family-name:var(--font-pixel)] text-[9px] text-ink uppercase tracking-wide">
        Output
      </h3>
      <TaskOutputList items={items} onSelectItem={onSelectItem} />
    </section>
  );
}

export function TaskDetailPanel({
  task,
  onBack,
  onClose,
  onAskAssistant,
  onViewDeliverable,
  variant = "modal",
}: TaskDetailPanelProps) {
  const { detail, events, preview, loading, error, refresh } = useTaskDetail(
    task.id
  );
  const [previewItem, setPreviewItem] = useState<TaskOutputItem | null>(null);

  const checkpoints = detail ? parseTaskCheckpoints(detail.metadata) : [];
  const visibleEvents = events.filter((event) =>
    shouldShowTaskEvent(event.type)
  );
  const outputItems = buildTaskOutputItems(task, detail, preview);

  const handleAskAssistant = () => {
    onAskAssistant?.({
      taskId: task.id,
      brief: detail?.brief ?? task.brief,
      staffName: detail?.staff.name ?? task.staff.name,
      progressPercent: detail?.progressPercent ?? task.progressPercent,
      currentStep: detail?.currentStep ?? task.currentStep,
    });
  };

  const handleSelectOutputItem = (item: TaskOutputItem) => {
    if (item.kind === "deliverable" && onViewDeliverable) {
      onViewDeliverable(task.id);
      return;
    }

    setPreviewItem(item);
  };

  return (
    <>
      <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
        <div className="shrink-0">
          <TaskDetailToolbar
            loading={loading}
            onBack={onBack}
            onClose={onClose}
            onRefresh={() => {
              refresh().catch(() => {
                /* handled in hook */
              });
            }}
          />
        </div>

        {loading ? (
          <p className="font-body text-[20px] text-text-muted">Loading task…</p>
        ) : null}

        {error ? (
          <p className="font-body text-[20px] text-alert" role="alert">
            {error}
          </p>
        ) : null}

        {loading || error ? null : (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
            <div className="flex flex-col gap-5 pb-2">
              <TaskDetailSummary detail={detail} task={task} />
              <TaskCheckpointsSection checkpoints={checkpoints} />
              <TaskProgressSection events={visibleEvents} />
              <TaskOutputSection
                items={outputItems}
                onSelectItem={handleSelectOutputItem}
              />

              {variant === "modal" && onAskAssistant ? (
                <div className="pt-1">
                  <PixelButton onClick={handleAskAssistant}>
                    Ask Assistant about this task
                  </PixelButton>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {previewItem ? (
        <DeliverablePreviewOverlay
          content={previewItem.content}
          contentType={previewItem.contentType}
          onClose={() => setPreviewItem(null)}
          title={previewItem.title}
        />
      ) : null}
    </>
  );
}
