"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArchiveRoomOverlay } from "@/components/archive-room/archive-room-overlay";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { CompletionCutsceneOverlay } from "@/components/dialogue/completion-cutscene-overlay";
import {
  DialogueOverlay,
  type HireDialogueContext,
} from "@/components/dialogue/dialogue-overlay";
import { GameShell } from "@/components/layout";
import {
  PixelButton,
  PixelCloseButton,
  PixelHUD,
  PixelIcon,
  PixelNotification,
  PixelPanel,
} from "@/components/pixel";
import { DeliverablePreviewOverlay } from "@/components/task-board/deliverable-preview-overlay";
import { TaskBoardOverlay } from "@/components/task-board/task-board-overlay";
import { HireSparkle } from "@/components/workplace/hire-sparkle";
import { StaffStatusOverlay } from "@/components/workplace/staff-status-overlay";
import {
  WORKSPACE_DESK_SLOTS,
  type WorkspaceDesk,
} from "@/components/workplace/workspace-layout";
import {
  type TaskCompletionBanner,
  type TaskFailureBanner,
  useWorkspaceState,
} from "@/hooks/use-workspace-state";
import { hasContentWriterOnRoster } from "@/lib/dialogue/hire-intent";
import { uiStrings } from "@/lib/i18n/ui";
import type { PendingTaskCompletion } from "@/lib/notifications/service";
import { assignNewStaffToDesk } from "@/lib/staff/desk-assignments";
import type { HireStaffResult } from "@/lib/staff/types";
import {
  getCoderPrUrl,
  getCoderWebsitePreviewUrl,
  isCoderPrMerged,
} from "@/lib/tasks/coder-preview";
import type { TaskDetail, TaskSummary } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";
import { WorkspaceFloor, type WorkspaceZone } from "./workspace-floor";

interface WorkplaceHomeProps {
  assistantName: string;
  greeting: string;
  viewerLabel: string;
}

interface ActiveDialogue {
  avatarSprite?: string;
  greeting: string;
  hireContext?: HireDialogueContext;
  portraitIcon: string;
  speakerId: string;
  speakerName: string;
  speakerRole?: string;
  taskId?: string;
}

interface HireCelebration {
  deskSlotId: string;
  name: string;
}

interface StaffStatusState {
  desk: WorkspaceDesk;
  task: TaskSummary | null;
}

interface DeliverablePreviewState {
  acknowledgeTaskId?: string;
  content: string;
  contentType: string;
  prMerged?: boolean;
  prUrl?: string | null;
  taskId?: string;
  title: string;
  websitePreviewUrl?: string | null;
}

function buildReceptionGreeting(
  baseGreeting: string,
  pendingCompletions: PendingTaskCompletion[],
  activeTasks: TaskSummary[]
): string {
  if (pendingCompletions.length > 0) {
    const latest = pendingCompletions[0];
    return uiStrings.workplace.pendingCompletionGreeting(
      latest.staffName,
      latest.title,
      baseGreeting
    );
  }

  const runningCount = activeTasks.filter(
    (task) => task.status === "running" || task.status === "pending"
  ).length;

  if (runningCount > 0) {
    return uiStrings.workplace.activeTasksGreeting(runningCount, baseGreeting);
  }

  return baseGreeting;
}

function notificationTopClass(hasPriorNotification: boolean): string {
  return cn(
    "pointer-events-auto absolute left-1/2 z-[45] w-[min(92vw,420px)] -translate-x-1/2",
    hasPriorNotification ? "top-28" : "top-4"
  );
}

interface WorkplaceNotificationsProps {
  actionError: string | null;
  banner: TaskCompletionBanner | null;
  failureBanner: TaskFailureBanner | null;
  hireCelebration: HireCelebration | null;
  onBannerClick: () => void;
  onClearActionError: () => void;
  onClearHireCelebration: () => void;
  onFailureBannerClick: () => void;
}

function WorkplaceNotifications({
  failureBanner,
  banner,
  hireCelebration,
  actionError,
  onFailureBannerClick,
  onBannerClick,
  onClearHireCelebration,
  onClearActionError,
}: WorkplaceNotificationsProps) {
  const hasPriorToCompletion = Boolean(failureBanner);
  const hasPriorToHire = Boolean(failureBanner || banner);
  const hasPriorToError = Boolean(failureBanner || banner || hireCelebration);

  return (
    <>
      {failureBanner ? (
        <div className="pointer-events-auto absolute top-4 left-1/2 z-[45] w-[min(92vw,420px)] -translate-x-1/2">
          <button
            className="w-full cursor-pointer border-0 bg-transparent p-0 text-left"
            onClick={onFailureBannerClick}
            type="button"
          >
            <PixelNotification
              autoDismissMs={0}
              message={`${uiStrings.workplace.bannerFailed(failureBanner.staffName, failureBanner.title)} — ${failureBanner.error}`}
              title={uiStrings.somethingWentWrong}
            />
          </button>
        </div>
      ) : null}

      {banner ? (
        <div className={notificationTopClass(hasPriorToCompletion)}>
          <button
            className="w-full cursor-pointer border-0 bg-transparent p-0 text-left"
            onClick={onBannerClick}
            type="button"
          >
            <PixelNotification
              autoDismissMs={0}
              message={uiStrings.workplace.bannerCompleted(
                banner.staffName,
                banner.title
              )}
              title={uiStrings.questComplete}
            />
          </button>
        </div>
      ) : null}

      {hireCelebration ? (
        <div className={notificationTopClass(hasPriorToHire)}>
          <PixelNotification
            message={uiStrings.workplace.hireJoined(hireCelebration.name)}
            onDismiss={onClearHireCelebration}
            title={uiStrings.newHire}
          />
        </div>
      ) : null}

      {actionError ? (
        <div className={notificationTopClass(hasPriorToError)}>
          <PixelNotification
            message={actionError}
            onDismiss={onClearActionError}
            title={uiStrings.somethingWentWrong}
          />
        </div>
      ) : null}
    </>
  );
}

function MeetingRoomOverlay({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      aria-label="Meeting Room"
      className="fixed inset-0 z-30 flex items-center justify-center p-4"
      role="dialog"
    >
      <button
        aria-label="Close"
        className="absolute inset-0 cursor-default bg-black/50"
        onClick={onClose}
        tabIndex={-1}
        type="button"
      />
      <PixelPanel
        className="relative z-10 w-full max-w-md"
        title="Meeting Room"
      >
        <div className="flex flex-col items-center gap-4 p-6 text-center">
          <PixelIcon className="text-pixel-accent" name="human" size={48} />
          <p className="font-[family-name:var(--font-body)] text-[length:var(--font-size-dialogue)] text-text-primary leading-snug">
            Small meeting room — brief the team, review plans, or sync with
            staff before assigning tasks.
          </p>
          <PixelCloseButton label="[ OK ]" onClick={onClose} />
        </div>
      </PixelPanel>
    </div>
  );
}

/**
 * Workplace home (#8): a top-down pixel office floor. Agents work at desks,
 * walk to the pantry when done, and show status emotes. Clicking Reception or a
 * staff member opens read-only status; Reception opens Assistant dialogue.
 */
export function WorkplaceHome({
  assistantName,
  greeting,
  viewerLabel,
}: WorkplaceHomeProps) {
  const {
    acknowledgeCompletion,
    banner,
    desks,
    dismissBanner,
    dismissFailureBanner,
    error: tasksError,
    failureBanner,
    getPendingCompletion,
    loading: tasksLoading,
    occupiedDeskSlotIds,
    pendingCompletions,
    refresh: reloadWorkspace,
    staff,
    tasks,
  } = useWorkspaceState();
  const [dialogue, setDialogue] = useState<ActiveDialogue | null>(null);
  const [staffStatus, setStaffStatus] = useState<StaffStatusState | null>(null);
  const [completionCutscene, setCompletionCutscene] =
    useState<PendingTaskCompletion | null>(null);
  const [deliverablePreview, setDeliverablePreview] =
    useState<DeliverablePreviewState | null>(null);
  const [taskBoardOpen, setTaskBoardOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [hireCelebration, setHireCelebration] =
    useState<HireCelebration | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const showActionError = useCallback((message: string) => {
    setActionError(message);
  }, []);

  const sceneBlocked =
    dialogue !== null ||
    taskBoardOpen ||
    archiveOpen ||
    meetingOpen ||
    staffStatus !== null ||
    completionCutscene !== null ||
    deliverablePreview !== null;

  const staffOptions = useMemo(
    () =>
      desks
        .filter((desk): desk is WorkspaceDesk & { staffId: string } =>
          Boolean(desk.staffId)
        )
        .map((desk) => ({
          id: desk.staffId,
          name: desk.label,
          role: desk.role,
        })),
    [desks]
  );

  const hasWriterOnRoster = hasContentWriterOnRoster(staff);

  const sparkleAnchor = useMemo(() => {
    if (!hireCelebration) {
      return null;
    }

    const slot = WORKSPACE_DESK_SLOTS.find(
      (entry) => entry.id === hireCelebration.deskSlotId
    );

    return slot?.agentAnchor ?? null;
  }, [hireCelebration]);

  useEffect(() => {
    if (!taskBoardOpen) {
      return;
    }

    reloadWorkspace().catch(() => {
      showActionError(uiStrings.errors.refreshTasks);
    });
  }, [taskBoardOpen, reloadWorkspace, showActionError]);

  const openCompletionCutscene = useCallback(
    (taskId: string) => {
      const completion = getPendingCompletion(taskId);

      if (completion) {
        setCompletionCutscene(completion);
      }
    },
    [getPendingCompletion]
  );

  const openDeliverablePreview = useCallback(
    async (taskId: string, acknowledgeOnClose = false) => {
      try {
        const response = await fetch(`/api/tasks/${taskId}`, {
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          showActionError(uiStrings.errors.loadDeliverable);
          return;
        }

        const detail = (await response.json()) as TaskDetail;

        if (!detail.deliverable) {
          showActionError(uiStrings.errors.noDeliverable);
          return;
        }

        setDeliverablePreview({
          title: detail.deliverable.title,
          content: detail.deliverable.content,
          contentType: detail.deliverable.contentType,
          acknowledgeTaskId: acknowledgeOnClose ? taskId : undefined,
          taskId,
          websitePreviewUrl: getCoderWebsitePreviewUrl(detail.metadata),
          prUrl: getCoderPrUrl(detail.metadata),
          prMerged: isCoderPrMerged(detail.metadata),
        });
      } catch {
        showActionError(uiStrings.errors.loadDeliverable);
      }
    },
    [showActionError]
  );

  const handleCloseDeliverablePreview = useCallback(async () => {
    const taskId = deliverablePreview?.acknowledgeTaskId;
    setDeliverablePreview(null);

    if (taskId) {
      try {
        await acknowledgeCompletion(taskId);
      } catch {
        showActionError(uiStrings.errors.saveResponse);
      }
    }
  }, [
    acknowledgeCompletion,
    deliverablePreview?.acknowledgeTaskId,
    showActionError,
  ]);

  const handleViewDeliverableFromCutscene = useCallback(
    (taskId: string) => {
      setCompletionCutscene(null);
      openDeliverablePreview(taskId, true);
    },
    [openDeliverablePreview]
  );

  const openReception = () => {
    setDialogue({
      speakerId: "assistant",
      speakerName: assistantName,
      speakerRole: "Coordinator",
      portraitIcon: "android",
      greeting: buildReceptionGreeting(greeting, pendingCompletions, tasks),
      hireContext: { mode: "assistant" },
    });
  };

  const openHireDialogue = (deskId: string) => {
    setDialogue({
      speakerId: "assistant",
      speakerName: assistantName,
      speakerRole: "Coordinator",
      portraitIcon: "android",
      greeting: uiStrings.workplace.emptyDeskGreeting,
      hireContext: {
        mode: "scripted",
        deskId,
      },
    });
  };

  const openAgent = (desk: WorkspaceDesk) => {
    if (!desk.staffId) {
      return;
    }

    if (desk.state === "done" && desk.pendingTaskId) {
      openCompletionCutscene(desk.pendingTaskId);
      return;
    }

    const staffTasks = tasks.filter((task) => task.staffId === desk.staffId);
    const activeTask =
      staffTasks.find(
        (task) => task.status === "running" || task.status === "pending"
      ) ??
      staffTasks.find((task) => task.status === "failed") ??
      null;

    setStaffStatus({ desk, task: activeTask });
  };

  const handleStaffHired = useCallback(
    (result: HireStaffResult) => {
      const deskSlotId =
        result.assignedDeskSlotId ?? assignNewStaffToDesk(result.id);

      reloadWorkspace().catch(() => {
        /* ignore refresh errors */
      });

      if (deskSlotId) {
        setHireCelebration({
          name: result.name,
          deskSlotId,
        });
      }
    },
    [reloadWorkspace]
  );

  const handleSelectZone = (selected: WorkspaceZone) => {
    if (selected === "taskboard") {
      setTaskBoardOpen(true);
      return;
    }

    if (selected === "meeting") {
      setMeetingOpen(true);
      return;
    }

    setArchiveOpen(true);
  };

  const handleAcknowledgeCompletion = useCallback(
    async (taskId: string) => {
      try {
        await acknowledgeCompletion(taskId);
      } catch {
        showActionError(uiStrings.errors.dismissNotification);
      }
    },
    [acknowledgeCompletion, showActionError]
  );

  const handleFailureBannerClick = useCallback(() => {
    if (!failureBanner) {
      return;
    }

    setTaskBoardOpen(true);
    dismissFailureBanner();
  }, [dismissFailureBanner, failureBanner]);

  const handleBannerClick = useCallback(() => {
    if (!banner) {
      return;
    }

    openCompletionCutscene(banner.taskId);
    dismissBanner();
  }, [banner, dismissBanner, openCompletionCutscene]);

  const handleRetryWorkspaceLoad = useCallback(() => {
    reloadWorkspace().catch(() => {
      showActionError(uiStrings.errors.reloadWorkspace);
    });
  }, [reloadWorkspace, showActionError]);

  return (
    <GameShell>
      <div className="flex min-h-0 flex-1 flex-col">
        <PixelHUD
          className="relative z-50 shrink-0"
          subtitle={viewerLabel}
          title="Nex Staff — Workspace"
        >
          <Link
            className="pixel-wood-btn inline-flex min-h-9 items-center justify-center px-4 py-2 font-[family-name:var(--font-pixel)] text-[length:var(--font-size-nameplate)] uppercase no-underline"
            href="/reception"
          >
            ◀ Clock Out
          </Link>
          <SignOutButton />
        </PixelHUD>

        <div className="relative flex min-h-0 flex-1 flex-col">
          {sceneBlocked ? (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-[15] bg-[var(--overlay-backdrop)]"
            />
          ) : null}

          {tasksError ? (
            <div
              className="relative z-10 flex shrink-0 flex-wrap items-center justify-between gap-3 border-wood border-b-[3px] bg-pixel-alert/10 px-4 py-3"
              role="alert"
            >
              <p className="font-body text-[18px] text-alert leading-snug">
                {tasksError}
              </p>
              <PixelButton onClick={handleRetryWorkspaceLoad} type="button">
                {uiStrings.retry}
              </PixelButton>
            </div>
          ) : null}

          <main
            className={cn(
              "relative min-h-0 flex-1 overflow-hidden transition-opacity",
              sceneBlocked && "pointer-events-none opacity-50"
            )}
          >
            {sparkleAnchor ? (
              <HireSparkle
                anchor={sparkleAnchor}
                visible={Boolean(hireCelebration)}
              />
            ) : null}

            {tasksLoading ? (
              <div className="pointer-events-none absolute inset-0 z-[60] flex items-center justify-center bg-black/30">
                <p className="border-[3px] border-wood bg-panel px-4 py-3 font-[family-name:var(--font-pixel)] text-[10px] text-ink uppercase tracking-widest">
                  {uiStrings.loadingWorkspace}
                </p>
              </div>
            ) : null}

            <WorkspaceFloor
              assistantName={assistantName}
              desks={desks}
              onHire={openHireDialogue}
              onSelectAgent={openAgent}
              onSelectReception={openReception}
              onSelectZone={handleSelectZone}
              pendingCompletionCount={pendingCompletions.length}
            />
          </main>

          <WorkplaceNotifications
            actionError={actionError}
            banner={banner}
            failureBanner={failureBanner}
            hireCelebration={hireCelebration}
            onBannerClick={handleBannerClick}
            onClearActionError={() => setActionError(null)}
            onClearHireCelebration={() => setHireCelebration(null)}
            onFailureBannerClick={handleFailureBannerClick}
          />

          {dialogue ? (
            <DialogueOverlay
              avatarSprite={dialogue.avatarSprite}
              greeting={dialogue.greeting}
              hasWriterOnRoster={hasWriterOnRoster}
              hireContext={dialogue.hireContext}
              occupiedDeskSlotIds={occupiedDeskSlotIds}
              onClose={() => setDialogue(null)}
              onStaffHired={handleStaffHired}
              onViewDeliverable={(taskId) => {
                openDeliverablePreview(taskId, true);
              }}
              portraitIcon={dialogue.portraitIcon}
              speakerId={dialogue.speakerId}
              speakerName={dialogue.speakerName}
              speakerRole={dialogue.speakerRole}
              taskId={dialogue.taskId}
            />
          ) : null}

          {taskBoardOpen ? (
            <TaskBoardOverlay
              assistantName={assistantName}
              error={tasksError}
              loading={tasksLoading}
              onClose={() => setTaskBoardOpen(false)}
              onViewDeliverable={(taskId) => {
                openDeliverablePreview(taskId);
              }}
              tasks={tasks}
            />
          ) : null}

          {archiveOpen ? (
            <ArchiveRoomOverlay
              onClose={() => setArchiveOpen(false)}
              staffOptions={staffOptions}
            />
          ) : null}

          {meetingOpen ? (
            <MeetingRoomOverlay onClose={() => setMeetingOpen(false)} />
          ) : null}

          {staffStatus ? (
            <StaffStatusOverlay
              desk={staffStatus.desk}
              onClose={() => setStaffStatus(null)}
              onOpenAssistant={() => {
                setStaffStatus(null);
                openReception();
              }}
              onViewDeliverable={(taskId) => {
                setStaffStatus(null);
                openDeliverablePreview(taskId);
              }}
              task={staffStatus.task}
            />
          ) : null}

          {completionCutscene ? (
            <CompletionCutsceneOverlay
              assistantName={assistantName}
              completion={completionCutscene}
              onAcknowledge={handleAcknowledgeCompletion}
              onClose={() => setCompletionCutscene(null)}
              onDelegateMore={openReception}
              onViewDeliverable={handleViewDeliverableFromCutscene}
            />
          ) : null}

          {deliverablePreview ? (
            <DeliverablePreviewOverlay
              content={deliverablePreview.content}
              contentType={deliverablePreview.contentType}
              onClose={() => {
                handleCloseDeliverablePreview();
              }}
              prMerged={deliverablePreview.prMerged}
              prUrl={deliverablePreview.prUrl}
              taskId={deliverablePreview.taskId}
              title={deliverablePreview.title}
              websitePreviewUrl={deliverablePreview.websitePreviewUrl}
            />
          ) : null}
        </div>
      </div>
    </GameShell>
  );
}
