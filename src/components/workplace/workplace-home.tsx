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
import { GameShell, OverlayStack } from "@/components/layout";
import { PixelButton, PixelHUD, PixelNotification } from "@/components/pixel";
import { DeliverablePreviewOverlay } from "@/components/task-board/deliverable-preview-overlay";
import { TaskBoardOverlay } from "@/components/task-board/task-board-overlay";
import { HireSparkle } from "@/components/workplace/hire-sparkle";
import {
  WORKSPACE_DESK_SLOTS,
  type WorkspaceDesk,
} from "@/components/workplace/workspace-layout";
import { useWorkspaceState } from "@/hooks/use-workspace-state";
import { hasContentWriterOnRoster } from "@/lib/dialogue/hire-intent";
import { uiStrings } from "@/lib/i18n/ui";
import type { PendingTaskCompletion } from "@/lib/notifications/service";
import { assignNewStaffToDesk } from "@/lib/staff/desk-assignments";
import type { HireStaffResult } from "@/lib/staff/types";
import type { TaskDetail } from "@/lib/tasks/types";
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

interface DeliverablePreviewState {
  acknowledgeTaskId?: string;
  content: string;
  contentType: string;
  title: string;
}

function buildReceptionGreeting(
  baseGreeting: string,
  pendingCompletions: PendingTaskCompletion[]
): string {
  if (pendingCompletions.length === 0) {
    return baseGreeting;
  }

  const latest = pendingCompletions[0];
  return uiStrings.workplace.pendingCompletionGreeting(
    latest.staffName,
    latest.title,
    baseGreeting
  );
}

/**
 * Workplace home (#8): a top-down pixel office floor. Agents work at desks,
 * walk to the pantry when done, and show status emotes. Clicking Reception or a
 * staff member opens the RPG dialogue; archive opens the document shelf overlay.
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
    error: tasksError,
    getPendingCompletion,
    loading: tasksLoading,
    occupiedDeskSlotIds,
    pendingCompletions,
    refresh: reloadWorkspace,
    staff,
    tasks,
  } = useWorkspaceState();
  const [dialogue, setDialogue] = useState<ActiveDialogue | null>(null);
  const [completionCutscene, setCompletionCutscene] =
    useState<PendingTaskCompletion | null>(null);
  const [deliverablePreview, setDeliverablePreview] =
    useState<DeliverablePreviewState | null>(null);
  const [taskBoardOpen, setTaskBoardOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [hireCelebration, setHireCelebration] =
    useState<HireCelebration | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const showActionError = useCallback((message: string) => {
    setActionError(message);
  }, []);

  const hasOverlayLayer = dialogue !== null || taskBoardOpen || archiveOpen;
  const hasModalLayer =
    completionCutscene !== null || deliverablePreview !== null;
  const hasNotificationLayer = Boolean(
    banner || hireCelebration || actionError
  );

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
    if (taskBoardOpen) {
      reloadWorkspace().catch(() => {
        showActionError(uiStrings.errors.refreshTasks);
      });
    }
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
      greeting: buildReceptionGreeting(greeting, pendingCompletions),
      hireContext: { mode: "assistant" },
    });
  };

  const openHireDialogue = (deskId: string) => {
    setDialogue({
      speakerId: "assistant",
      speakerName: assistantName,
      speakerRole: "Coordinator",
      portraitIcon: "android",
      greeting: uiStrings.workplace.hireDeskGreeting,
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

    setDialogue({
      speakerId: desk.staffId,
      speakerName: desk.label,
      speakerRole: desk.role,
      portraitIcon: "human",
      avatarSprite: desk.avatarSprite,
      greeting: uiStrings.workplace.staffGreeting(desk.label),
    });
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
      <OverlayStack className="flex min-h-0 flex-1 flex-col">
        <OverlayStack.Layer id="scene">
          <PixelHUD subtitle={viewerLabel} title="Nex Staff — Workspace">
            <Link
              className="pixel-wood-btn inline-flex min-h-9 items-center justify-center px-4 py-2 font-[family-name:var(--font-pixel)] text-[length:var(--font-size-nameplate)] uppercase no-underline"
              href="/reception"
            >
              ◀ Reception
            </Link>
            <SignOutButton />
          </PixelHUD>

          {tasksError ? (
            <div
              className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-wood border-b-[3px] bg-pixel-alert/10 px-4 py-3"
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

          <main className="relative min-h-0 flex-1 overflow-hidden">
            {sparkleAnchor ? (
              <HireSparkle
                anchor={sparkleAnchor}
                visible={Boolean(hireCelebration)}
              />
            ) : null}

            {tasksLoading ? (
              <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/30">
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
        </OverlayStack.Layer>

        <OverlayStack.Layer active={hasNotificationLayer} id="notification">
          {banner ? (
            <div className="pointer-events-auto absolute top-20 left-1/2 w-[min(92vw,420px)] -translate-x-1/2">
              <button
                className="w-full cursor-pointer border-0 bg-transparent p-0 text-left"
                onClick={handleBannerClick}
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
            <div className="pointer-events-auto absolute top-20 left-1/2 w-[min(92vw,420px)] -translate-x-1/2">
              <PixelNotification
                message={uiStrings.workplace.hireJoined(hireCelebration.name)}
                onDismiss={() => setHireCelebration(null)}
                title={uiStrings.newHire}
              />
            </div>
          ) : null}

          {actionError ? (
            <div
              className={cn(
                "pointer-events-auto absolute left-1/2 w-[min(92vw,420px)] -translate-x-1/2",
                banner || hireCelebration ? "top-44" : "top-20"
              )}
            >
              <PixelNotification
                message={actionError}
                onDismiss={() => setActionError(null)}
                title={uiStrings.somethingWentWrong}
              />
            </div>
          ) : null}
        </OverlayStack.Layer>

        <OverlayStack.Layer active={hasOverlayLayer} id="overlay">
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
        </OverlayStack.Layer>

        <OverlayStack.Layer active={hasModalLayer} id="modal">
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
              title={deliverablePreview.title}
            />
          ) : null}
        </OverlayStack.Layer>
      </OverlayStack>
    </GameShell>
  );
}
