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
import { PixelHUD, PixelNotification } from "@/components/pixel";
import { DeliverablePreviewOverlay } from "@/components/task-board/deliverable-preview-overlay";
import { TaskBoardOverlay } from "@/components/task-board/task-board-overlay";
import { HireSparkle } from "@/components/workplace/hire-sparkle";
import {
  WORKSPACE_DESK_SLOTS,
  type WorkspaceDesk,
} from "@/components/workplace/workspace-layout";
import { useWorkspaceState } from "@/hooks/use-workspace-state";
import { hasContentWriterOnRoster } from "@/lib/dialogue/hire-intent";
import type { PendingTaskCompletion } from "@/lib/notifications/service";
import { assignNewStaffToDesk } from "@/lib/staff/desk-assignments";
import type { HireStaffResult } from "@/lib/staff/types";
import type { TaskDetail } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";
import { WorkspaceFloor, type WorkspaceZone } from "./workspace-floor";
import { ZoneOverlay } from "./zone-overlay";

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

interface ActiveZone {
  description: string;
  icon: string;
  title: string;
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
  return `${latest.staffName} vừa hoàn thành "${latest.title}". Bạn muốn xem kết quả không?\n\n${baseGreeting}`;
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
  const [zone, setZone] = useState<ActiveZone | null>(null);
  const [taskBoardOpen, setTaskBoardOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [hireCelebration, setHireCelebration] =
    useState<HireCelebration | null>(null);

  const overlayOpen =
    dialogue !== null ||
    zone !== null ||
    taskBoardOpen ||
    archiveOpen ||
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

  const hasDoneDesk = desks.some((desk) => desk.state === "done");

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
        /* ignore refresh errors */
      });
    }
  }, [taskBoardOpen, reloadWorkspace]);

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
      const response = await fetch(`/api/tasks/${taskId}`, {
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        return;
      }

      const detail = (await response.json()) as TaskDetail;

      if (!detail.deliverable) {
        return;
      }

      setDeliverablePreview({
        title: detail.deliverable.title,
        content: detail.deliverable.content,
        contentType: detail.deliverable.contentType,
        acknowledgeTaskId: acknowledgeOnClose ? taskId : undefined,
      });
    },
    []
  );

  const handleCloseDeliverablePreview = useCallback(async () => {
    const taskId = deliverablePreview?.acknowledgeTaskId;
    setDeliverablePreview(null);

    if (taskId) {
      try {
        await acknowledgeCompletion(taskId);
      } catch {
        /* ignore acknowledge errors */
      }
    }
  }, [acknowledgeCompletion, deliverablePreview?.acknowledgeTaskId]);

  const handleViewDeliverableFromCutscene = useCallback(
    (taskId: string) => {
      setCompletionCutscene(null);
      openDeliverablePreview(taskId, true).catch(() => {
        /* ignore fetch errors */
      });
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
      greeting: "Muốn hire ai cho bàn này?",
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
      greeting: `Hi boss! I'm ${desk.label}. What can I help with?`,
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
        /* ignore acknowledge errors */
      }
    },
    [acknowledgeCompletion]
  );

  const handleBannerClick = useCallback(() => {
    if (!banner) {
      return;
    }

    openCompletionCutscene(banner.taskId);
    dismissBanner();
  }, [banner, dismissBanner, openCompletionCutscene]);

  return (
    <GameShell>
      <div className="flex min-h-0 flex-1 flex-col">
        <PixelHUD subtitle={viewerLabel} title="Nex Staff — Workspace">
          <Link
            className="pixel-wood-btn inline-flex min-h-9 items-center justify-center px-4 py-2 font-[family-name:var(--font-pixel)] text-[length:var(--font-size-nameplate)] uppercase no-underline"
            href="/"
          >
            ◀ Reception
          </Link>
          <SignOutButton />
        </PixelHUD>

        <main
          className={cn(
            "relative min-h-0 flex-1 overflow-hidden transition-opacity",
            overlayOpen && "pointer-events-none opacity-50"
          )}
        >
          {sparkleAnchor ? (
            <HireSparkle
              anchor={sparkleAnchor}
              visible={Boolean(hireCelebration)}
            />
          ) : null}

          <WorkspaceFloor
            assistantName={assistantName}
            desks={desks}
            hasDoneDesk={hasDoneDesk}
            onHire={openHireDialogue}
            onSelectAgent={openAgent}
            onSelectReception={openReception}
            onSelectZone={handleSelectZone}
          />
        </main>
      </div>

      {banner ? (
        <div className="pointer-events-auto absolute top-20 left-1/2 z-40 w-[min(92vw,420px)] -translate-x-1/2">
          <button
            className="w-full cursor-pointer border-0 bg-transparent p-0 text-left"
            onClick={handleBannerClick}
            type="button"
          >
            <PixelNotification
              autoDismissMs={6000}
              message={`✨ ${banner.staffName} hoàn thành: ${banner.title}`}
              onDismiss={dismissBanner}
              title="Quest complete"
            />
          </button>
        </div>
      ) : null}

      {hireCelebration ? (
        <div className="pointer-events-auto absolute top-20 left-1/2 z-40 w-[min(92vw,420px)] -translate-x-1/2">
          <PixelNotification
            message={`✨ ${hireCelebration.name} joined the team!`}
            onDismiss={() => setHireCelebration(null)}
            title="New hire"
          />
        </div>
      ) : null}

      {taskBoardOpen ? (
        <TaskBoardOverlay
          assistantName={assistantName}
          error={tasksError}
          loading={tasksLoading}
          onClose={() => setTaskBoardOpen(false)}
          onViewDeliverable={(taskId) => {
            openDeliverablePreview(taskId).catch(() => {
              /* ignore fetch errors */
            });
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
            handleCloseDeliverablePreview().catch(() => {
              /* ignore acknowledge errors */
            });
          }}
          title={deliverablePreview.title}
        />
      ) : null}

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
            openDeliverablePreview(taskId, true).catch(() => {
              /* ignore fetch errors */
            });
          }}
          portraitIcon={dialogue.portraitIcon}
          speakerId={dialogue.speakerId}
          speakerName={dialogue.speakerName}
          speakerRole={dialogue.speakerRole}
          taskId={dialogue.taskId}
        />
      ) : null}

      {zone ? (
        <ZoneOverlay
          description={zone.description}
          icon={zone.icon}
          onClose={() => setZone(null)}
          title={zone.title}
        />
      ) : null}
    </GameShell>
  );
}
