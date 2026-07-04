"use client";

import { useState } from "react";
import {
  PixelButton,
  PixelCloseButton,
  PixelIcon,
  PixelProgressBar,
} from "@/components/pixel";
import { StaffAvatar } from "@/components/staff/staff-avatar";
import { CoderPrActionButtons } from "@/components/task-board/coder-pr-action-buttons";
import { DeliverablePreviewOverlay } from "@/components/task-board/deliverable-preview-overlay";
import { TaskOutputList } from "@/components/task-board/task-output-list";
import { useTaskDetail } from "@/hooks/use-task-detail";
import type { TaskCheckpoint } from "@/lib/tasks/checkpoints";
import { parseTaskCheckpoints } from "@/lib/tasks/checkpoints";
import {
  getCoderPrUrl,
  getCoderWebsitePreviewUrl,
  isCoderPrMerged,
} from "@/lib/tasks/coder-preview";
import {
  buildQuestLogEvents,
  formatTaskEventLabel,
  formatTaskStatusLabel,
} from "@/lib/tasks/event-label";
import {
  buildTaskOutputItems,
  type TaskOutputItem,
} from "@/lib/tasks/output-items";
import { taskDetailStatusBadgeClass } from "@/lib/tasks/status-style";
import type {
  TaskDetail,
  TaskEventRecord,
  TaskSummary,
} from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

interface TaskDetailPanelProps {
  compact?: boolean;
  onBack?: () => void;
  onClose: () => void;
  onViewDeliverable?: (taskId: string) => void;
  showBack?: boolean;
  showToolbarClose?: boolean;
  task: TaskSummary;
}

function formatEventTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function QuestSection({
  children,
  icon,
  title,
}: {
  children: React.ReactNode;
  icon: string;
  title: string;
}) {
  return (
    <section className="flex shrink-0 flex-col gap-2">
      <h3 className="flex items-center gap-2 font-[family-name:var(--font-pixel)] text-[8px] text-ink uppercase tracking-wide">
        <PixelIcon
          aria-hidden
          className="text-leaf-dark"
          name={icon}
          size={14}
        />
        {title}
      </h3>
      <div className="border-[3px] border-wood bg-[#fff9c4]/50 px-3 py-3">
        {children}
      </div>
    </section>
  );
}

function questLogMarkerClass(isLatest: boolean, isComplete: boolean): string {
  if (isLatest) {
    return "border-leaf-dark bg-leaf-light text-leaf-dark";
  }

  if (isComplete) {
    return "border-wood-dark bg-panel text-leaf-dark";
  }

  return "border-wood-dark bg-panel text-ink-muted";
}

function questLogMarkerSymbol(isLatest: boolean, isComplete: boolean): string {
  if (isLatest) {
    return "●";
  }

  if (isComplete) {
    return "✓";
  }

  return "·";
}

function QuestLogTimeline({ events }: { events: TaskEventRecord[] }) {
  const entries = buildQuestLogEvents(events);

  if (entries.length === 0) {
    return (
      <p className="font-body text-[18px] text-ink-muted italic">
        The quest log is empty — check back soon.
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-0">
      {entries.map((event, index) => {
        const isLatest = index === entries.length - 1;
        const isComplete =
          event.type === "workflow.completed" ||
          event.type === "deliverable.saved" ||
          event.type === "agent.step_completed";

        return (
          <li className="flex gap-3 pb-3 last:pb-0" key={event.id}>
            <span
              aria-hidden
              className="flex w-5 shrink-0 flex-col items-center"
            >
              <span
                className={cn(
                  "flex size-5 items-center justify-center border-2 font-[family-name:var(--font-pixel)] text-[8px]",
                  questLogMarkerClass(isLatest, isComplete)
                )}
              >
                {questLogMarkerSymbol(isLatest, isComplete)}
              </span>
              {index < entries.length - 1 ? (
                <span className="mt-1 w-0.5 flex-1 bg-wood/40" />
              ) : null}
            </span>
            <span className="min-w-0 flex-1 pt-0.5">
              <span className="block font-body text-[17px] text-ink leading-snug">
                {formatTaskEventLabel(event)}
              </span>
              <time
                className="mt-0.5 block font-[family-name:var(--font-pixel)] text-[7px] text-ink-muted uppercase"
                dateTime={event.createdAt}
              >
                {formatEventTime(event.createdAt)}
              </time>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function QuestCheckpoints({ checkpoints }: { checkpoints: TaskCheckpoint[] }) {
  if (checkpoints.length === 0) {
    return null;
  }

  return (
    <QuestSection icon="list-box" title="Checkpoints">
      <ol className="flex flex-col gap-2">
        {checkpoints.map((checkpoint) => (
          <li
            className="border-wood-dark border-l-4 bg-panel/80 pl-3 font-body text-[17px] text-ink"
            key={`${checkpoint.order}-${checkpoint.label}`}
          >
            <span className="font-[family-name:var(--font-pixel)] text-[7px] text-leaf-dark uppercase">
              {checkpoint.order}. {checkpoint.label}
            </span>
            <p className="mt-1 text-[15px] text-ink-muted leading-snug">
              {checkpoint.criteria}
            </p>
          </li>
        ))}
      </ol>
    </QuestSection>
  );
}

function QuestSummary({
  detail,
  task,
}: {
  detail: TaskDetail | null;
  task: TaskSummary;
}) {
  const status = detail?.status ?? task.status;
  const brief = detail?.brief ?? task.brief;
  const staffName = detail?.staff.name ?? task.staff.name;
  const staffRole = detail?.staff.role ?? task.staff.role;
  const progress = detail?.progressPercent ?? task.progressPercent;
  const currentStep =
    detail?.currentStep ?? task.currentStep ?? "Awaiting start…";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={taskDetailStatusBadgeClass(status)}>
          {formatTaskStatusLabel(status)}
        </span>
        <span className="font-[family-name:var(--font-pixel)] text-[7px] text-ink-muted uppercase">
          Quest #{task.id.slice(0, 8)}
        </span>
      </div>

      <QuestSection icon="book" title="Objective">
        <p className="font-body text-[20px] text-ink leading-snug">{brief}</p>
      </QuestSection>

      <QuestSection icon="user" title="Assigned To">
        <div className="flex items-center gap-3">
          <StaffAvatar
            size={40}
            spriteId={task.staff.avatarSprite}
            staffId={task.staff.id}
          />
          <div>
            <p className="font-[family-name:var(--font-pixel)] text-[8px] text-ink uppercase">
              {staffName}
            </p>
            <p className="mt-1 font-body text-[16px] text-ink-muted">
              {staffRole}
            </p>
          </div>
        </div>
      </QuestSection>

      <QuestSection icon="hourglass" title="Progress">
        <PixelProgressBar
          label={`${progress}%`}
          segments={10}
          value={progress}
        />
        <p className="mt-2 font-body text-[17px] text-ink leading-snug">
          {currentStep}
        </p>
      </QuestSection>
    </div>
  );
}

function ViewDeliverableAction({
  compact,
  onViewDeliverable,
  taskId,
}: {
  compact: boolean;
  onViewDeliverable: (taskId: string) => void;
  taskId: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 gap-2",
        compact
          ? "justify-end"
          : "mt-3 flex-wrap border-wood border-t-[3px] bg-bg-dialogue pt-3"
      )}
    >
      <PixelButton
        onClick={() => {
          onViewDeliverable(taskId);
        }}
      >
        View Deliverable
      </PixelButton>
    </div>
  );
}

function TaskDetailToolbar({
  compact,
  loading,
  onBack,
  onClose,
  onRefresh,
  showBack,
  showToolbarClose,
}: {
  compact: boolean;
  loading: boolean;
  onBack?: () => void;
  onClose: () => void;
  onRefresh: () => void;
  showBack: boolean;
  showToolbarClose: boolean;
}) {
  if (compact) {
    return (
      <div className="flex shrink-0 justify-end">
        <PixelButton disabled={loading} onClick={onRefresh}>
          Refresh
        </PixelButton>
      </div>
    );
  }

  return (
    <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        {showBack && onBack ? (
          <PixelButton className="hidden md:inline-flex" onClick={onBack}>
            ◀ Back
          </PixelButton>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <PixelButton disabled={loading} onClick={onRefresh}>
          Refresh
        </PixelButton>
        {showToolbarClose ? (
          <PixelCloseButton aria-label="Close quest board" onClick={onClose} />
        ) : null}
      </div>
    </div>
  );
}

export function TaskDetailPanel({
  task,
  onBack,
  onClose,
  onViewDeliverable,
  showBack = true,
  showToolbarClose = true,
  compact = false,
}: TaskDetailPanelProps) {
  const { detail, events, preview, loading, error, refresh } = useTaskDetail(
    task.id
  );
  const [previewItem, setPreviewItem] = useState<TaskOutputItem | null>(null);

  const checkpoints = detail ? parseTaskCheckpoints(detail.metadata) : [];
  const outputItems = buildTaskOutputItems(task, detail, preview);
  const websitePreviewUrl = detail
    ? getCoderWebsitePreviewUrl(detail.metadata)
    : undefined;
  const prUrl = detail ? getCoderPrUrl(detail.metadata) : undefined;
  const prMerged = detail ? isCoderPrMerged(detail.metadata) : false;
  const hasDeliverable = outputItems.some(
    (item) => item.kind === "deliverable"
  );

  const handleSelectOutputItem = (item: TaskOutputItem) => {
    if (item.kind === "deliverable" && onViewDeliverable) {
      onViewDeliverable(task.id);
      return;
    }

    setPreviewItem(item);
  };

  const handleRefresh = () => {
    refresh().catch(() => {
      /* handled in hook */
    });
  };

  return (
    <>
      <div
        className={cn(
          "flex flex-col",
          compact ? "gap-3" : "h-full min-h-0 overflow-hidden"
        )}
      >
        <TaskDetailToolbar
          compact={compact}
          loading={loading}
          onBack={onBack}
          onClose={onClose}
          onRefresh={handleRefresh}
          showBack={showBack}
          showToolbarClose={showToolbarClose}
        />

        {loading ? (
          <p className="font-body text-[20px] text-ink-muted">
            Loading quest data…
          </p>
        ) : null}

        {error ? (
          <p className="font-body text-[20px] text-alert" role="alert">
            {error}
          </p>
        ) : null}

        {loading || error ? null : (
          <>
            <div
              className={cn(
                compact
                  ? ""
                  : "min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1"
              )}
            >
              <div className="flex flex-col gap-4 pb-2">
                <QuestSummary detail={detail} task={task} />
                <QuestCheckpoints checkpoints={checkpoints} />
                <QuestSection icon="script" title="Quest Log">
                  <QuestLogTimeline events={events} />
                </QuestSection>
                <QuestSection icon="briefcase" title="Rewards">
                  <TaskOutputList
                    items={outputItems}
                    onSelectItem={handleSelectOutputItem}
                  />
                </QuestSection>
                {websitePreviewUrl || prUrl ? (
                  <QuestSection icon="globe" title="Website">
                    <div className="pixel-button-row pixel-button-row-start">
                      <CoderPrActionButtons
                        onMerged={() => {
                          refresh().catch(() => {
                            /* handled in hook */
                          });
                        }}
                        prMerged={prMerged}
                        prUrl={prUrl}
                        taskId={task.id}
                        websitePreviewUrl={websitePreviewUrl}
                      />
                    </div>
                  </QuestSection>
                ) : null}
              </div>
            </div>

            {hasDeliverable && onViewDeliverable ? (
              <ViewDeliverableAction
                compact={compact}
                onViewDeliverable={onViewDeliverable}
                taskId={task.id}
              />
            ) : null}
          </>
        )}
      </div>

      {previewItem ? (
        <DeliverablePreviewOverlay
          content={previewItem.content}
          contentType={previewItem.contentType}
          onClose={() => setPreviewItem(null)}
          prMerged={prMerged}
          prUrl={prUrl}
          taskId={task.id}
          title={previewItem.title}
          websitePreviewUrl={websitePreviewUrl}
        />
      ) : null}
    </>
  );
}
