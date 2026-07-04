"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { DialogueOverlay } from "@/components/dialogue/dialogue-overlay";
import { GameShell } from "@/components/layout";
import { PixelHUD, PixelNotification } from "@/components/pixel";
import { TaskBoardOverlay } from "@/components/task-board/task-board-overlay";
import { useWorkspaceState } from "@/hooks/use-workspace-state";
import {
  buildTaskDialogueGreeting,
  type TaskDialogueContext,
} from "@/lib/dialogue/task-context";
import { cn } from "@/lib/utils";
import { WorkspaceFloor, type WorkspaceZone } from "./workspace-floor";
import type { WorkspaceDesk } from "./workspace-layout";
import { ZoneOverlay } from "./zone-overlay";

interface WorkplaceHomeProps {
  assistantName: string;
  greeting: string;
  viewerLabel: string;
}

interface ActiveDialogue {
  greeting: string;
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

const ARCHIVE_ZONE: ActiveZone = {
  title: "Archive Room",
  description: "The archive opens in a later update (#9).",
  icon: "archive",
};

const HIRE_ZONE: ActiveZone = {
  title: "Hire an agent",
  description: "The hire flow opens in a later update (#11).",
  icon: "briefcase-plus",
};

/**
 * Workplace home (#8): a top-down pixel office floor. Agents work at desks,
 * walk to the pantry when done, and show status emotes. Clicking Reception or a
 * staff member opens the RPG dialogue; archive opens a placeholder overlay.
 */
export function WorkplaceHome({
  assistantName,
  greeting,
  viewerLabel,
}: WorkplaceHomeProps) {
  const {
    banner,
    desks,
    dismissBanner,
    error: tasksError,
    loading: tasksLoading,
    refresh: reloadTasks,
    tasks,
  } = useWorkspaceState();
  const [dialogue, setDialogue] = useState<ActiveDialogue | null>(null);
  const [zone, setZone] = useState<ActiveZone | null>(null);
  const [taskBoardOpen, setTaskBoardOpen] = useState(false);

  const overlayOpen = dialogue !== null || zone !== null || taskBoardOpen;

  const hasDoneDesk = desks.some((desk) => desk.state === "done");

  useEffect(() => {
    if (taskBoardOpen) {
      reloadTasks().catch(() => {
        /* ignore refresh errors */
      });
    }
  }, [taskBoardOpen, reloadTasks]);

  const openReception = () => {
    setDialogue({
      speakerId: "assistant",
      speakerName: assistantName,
      speakerRole: "Coordinator",
      portraitIcon: "android",
      greeting,
    });
  };

  const openAgent = (desk: WorkspaceDesk) => {
    if (!desk.staffId) {
      return;
    }

    setDialogue({
      speakerId: desk.staffId,
      speakerName: desk.label,
      speakerRole: desk.role,
      portraitIcon: "human",
      greeting: `Hi boss! I'm ${desk.label}. What can I help with?`,
    });
  };

  const openAssistantForTask = (context: TaskDialogueContext) => {
    setTaskBoardOpen(false);
    setDialogue({
      speakerId: "assistant",
      speakerName: assistantName,
      speakerRole: "Coordinator",
      portraitIcon: "android",
      greeting: buildTaskDialogueGreeting(assistantName, context),
      taskId: context.taskId,
    });
  };

  const handleSelectZone = (selected: WorkspaceZone) => {
    if (selected === "taskboard") {
      setTaskBoardOpen(true);
      return;
    }

    setZone(ARCHIVE_ZONE);
  };

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
          <WorkspaceFloor
            assistantName={assistantName}
            desks={desks}
            hasDoneDesk={hasDoneDesk}
            onHire={() => setZone(HIRE_ZONE)}
            onSelectAgent={openAgent}
            onSelectReception={openReception}
            onSelectZone={handleSelectZone}
          />
        </main>
      </div>

      {banner ? (
        <div className="pointer-events-auto absolute top-20 left-1/2 z-40 w-[min(92vw,420px)] -translate-x-1/2">
          <PixelNotification
            message={`${banner.title} is ready to review.`}
            onDismiss={dismissBanner}
            title="Task complete"
          />
        </div>
      ) : null}

      {taskBoardOpen ? (
        <TaskBoardOverlay
          error={tasksError}
          loading={tasksLoading}
          onAskAssistant={openAssistantForTask}
          onClose={() => setTaskBoardOpen(false)}
          tasks={tasks}
        />
      ) : null}

      {dialogue ? (
        <DialogueOverlay
          greeting={dialogue.greeting}
          onClose={() => setDialogue(null)}
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
