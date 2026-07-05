"use client";

import { useEffect, useRef, useState } from "react";
import {
  PixelButton,
  PixelCloseButton,
  PixelPanel,
  PixelProgressBar,
} from "@/components/pixel";
import { StaffAvatar } from "@/components/staff/staff-avatar";
import { DeliverablePreviewOverlay } from "@/components/task-board/deliverable-preview-overlay";
import { TaskOutputList } from "@/components/task-board/task-output-list";
import type { WorkspaceDesk } from "@/components/workplace/workspace-layout";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { useTaskDetail } from "@/hooks/use-task-detail";
import { uiStrings } from "@/lib/i18n/ui";
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

interface StaffStatusOverlayProps {
  desk: WorkspaceDesk;
  onClose: () => void;
  onOpenAssistant: () => void;
  onViewDeliverable?: (taskId: string) => void;
  task: TaskSummary | null;
}

function formatEventTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function staffStatusMessage(desk: WorkspaceDesk): string {
  if (desk.state === "offline") {
    return uiStrings.staffStatus.offline;
  }

  if (desk.state === "idle") {
    return uiStrings.staffStatus.idle;
  }

  return uiStrings.staffStatus.noOutput;
}

function StaffStatusHeader({
  desk,
  onClose,
}: {
  desk: WorkspaceDesk;
  onClose: () => void;
}) {
  return (
    <div className="flex shrink-0 items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        {desk.avatarSprite ? (
          <StaffAvatar
            size={56}
            spriteId={desk.avatarSprite}
            staffId={desk.staffId}
          />
        ) : null}
        <div className="min-w-0">
          <h2
            className="truncate font-[family-name:var(--font-pixel)] text-[10px] text-ink uppercase tracking-wide"
            id="staff-status-title"
          >
            {desk.label}
          </h2>
          {desk.role ? (
            <p className="font-body text-[18px] text-ink-muted">{desk.role}</p>
          ) : null}
        </div>
      </div>
      <PixelCloseButton
        aria-label={uiStrings.staffStatus.close}
        onClick={onClose}
      />
    </div>
  );
}

function StaffIdleBody({
  desk,
  onOpenAssistant,
}: {
  desk: WorkspaceDesk;
  onOpenAssistant: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <p className="font-body text-[20px] text-ink leading-snug">
        {staffStatusMessage(desk)}
      </p>
      <PixelButton
        className="w-full pt-px"
        onClick={onOpenAssistant}
        type="button"
      >
        {uiStrings.staffStatus.talkToAssistant}
      </PixelButton>
    </div>
  );
}

function StaffTaskSummarySection({
  detail,
  task,
}: {
  detail: TaskDetail | null;
  task: TaskSummary;
}) {
  return (
    <section className="flex flex-col gap-3">
      <p className="font-body text-[20px] text-ink leading-snug">
        {detail?.brief ?? task.brief}
      </p>
      <span
        className={cn(
          "w-fit border-2 border-wood-dark px-2 py-0.5 font-[family-name:var(--font-pixel)] text-[8px] uppercase",
          (detail?.status ?? task.status) === "completed"
            ? "bg-leaf-light text-leaf-dark"
            : "bg-panel text-ink"
        )}
      >
        {detail?.status ?? task.status}
      </span>
      <PixelProgressBar
        label={`${detail?.progressPercent ?? task.progressPercent}%`}
        value={detail?.progressPercent ?? task.progressPercent}
      />
      <p className="font-body text-[18px] text-ink-muted">
        {detail?.currentStep ??
          task.currentStep ??
          uiStrings.staffStatus.starting}
      </p>
    </section>
  );
}

function StaffCheckpointsSection({
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
        {uiStrings.staffStatus.checkpoints}
      </h3>
      <ol className="flex flex-col gap-2">
        {checkpoints.map((checkpoint) => (
          <li
            className="border-2 border-wood bg-panel px-3 py-2 font-body text-[18px] text-ink"
            key={`${checkpoint.order}-${checkpoint.label}`}
          >
            {checkpoint.order}. {checkpoint.label}
          </li>
        ))}
      </ol>
    </section>
  );
}

function StaffEventsSection({ events }: { events: TaskEventRecord[] }) {
  if (events.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-2">
      <h3 className="font-[family-name:var(--font-pixel)] text-[9px] text-ink uppercase tracking-wide">
        {uiStrings.staffStatus.progress}
      </h3>
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
    </section>
  );
}

function StaffOutputSection({
  items,
  onSelectItem,
}: {
  items: TaskOutputItem[];
  onSelectItem: (item: TaskOutputItem) => void;
}) {
  if (items.length === 0) {
    return (
      <p className="font-body text-[18px] text-text-muted">
        {uiStrings.staffStatus.noOutput}
      </p>
    );
  }

  return (
    <section className="flex flex-col gap-2">
      <h3 className="font-[family-name:var(--font-pixel)] text-[9px] text-ink uppercase tracking-wide">
        {uiStrings.staffStatus.output}
      </h3>
      <TaskOutputList items={items} onSelectItem={onSelectItem} />
    </section>
  );
}

function StaffTaskProgressBody({
  detail,
  error,
  loading,
  onRefresh,
  onSelectOutputItem,
  outputItems,
  task,
  visibleEvents,
}: {
  detail: TaskDetail | null;
  error: string | null;
  loading: boolean;
  onRefresh: () => void;
  onSelectOutputItem: (item: TaskOutputItem) => void;
  outputItems: TaskOutputItem[];
  task: TaskSummary;
  visibleEvents: TaskEventRecord[];
}) {
  const checkpoints = detail ? parseTaskCheckpoints(detail.metadata) : [];

  return (
    <div className="flex flex-col gap-5">
      {loading ? (
        <p className="font-body text-[20px] text-text-muted">
          {uiStrings.staffStatus.loading}
        </p>
      ) : null}

      {error ? (
        <p className="font-body text-[20px] text-alert" role="alert">
          {error}
        </p>
      ) : null}

      {loading || error ? null : (
        <>
          <StaffTaskSummarySection detail={detail} task={task} />
          <StaffCheckpointsSection checkpoints={checkpoints} />
          <StaffEventsSection events={visibleEvents} />
          <StaffOutputSection
            items={outputItems}
            onSelectItem={onSelectOutputItem}
          />
        </>
      )}

      <PixelButton disabled={loading} onClick={onRefresh} type="button">
        {uiStrings.staffStatus.refresh}
      </PixelButton>
    </div>
  );
}

export function StaffStatusOverlay({
  desk,
  task,
  onClose,
  onOpenAssistant,
  onViewDeliverable,
}: StaffStatusOverlayProps) {
  const { detail, events, preview, loading, error, refresh } = useTaskDetail(
    task?.id ?? null
  );
  const [previewItem, setPreviewItem] = useState<TaskOutputItem | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useFocusTrap(dialogRef);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const visibleEvents = events.filter((event) =>
    shouldShowTaskEvent(event.type)
  );
  const outputItems = task ? buildTaskOutputItems(task, detail, preview) : [];

  const handleSelectOutputItem = (item: TaskOutputItem) => {
    if (item.kind === "deliverable" && onViewDeliverable && task) {
      onViewDeliverable(task.id);
      return;
    }

    setPreviewItem(item);
  };

  return (
    <>
      <div
        aria-labelledby="staff-status-title"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-backdrop)] p-4"
        ref={dialogRef}
        role="dialog"
      >
        <PixelPanel
          className="flex max-h-[min(90vh,720px)] min-h-0 w-full max-w-2xl flex-col overflow-hidden"
          contentClassName="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4 sm:p-5"
          title={uiStrings.staffStatus.title}
          titleInset
        >
          <StaffStatusHeader desk={desk} onClose={onClose} />

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {task ? (
              <StaffTaskProgressBody
                detail={detail}
                error={error}
                loading={loading}
                onRefresh={() => {
                  refresh().catch(() => {
                    /* handled in hook */
                  });
                }}
                onSelectOutputItem={handleSelectOutputItem}
                outputItems={outputItems}
                task={task}
                visibleEvents={visibleEvents}
              />
            ) : (
              <StaffIdleBody desk={desk} onOpenAssistant={onOpenAssistant} />
            )}
          </div>
        </PixelPanel>
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
