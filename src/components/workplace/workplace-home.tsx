"use client";

import { useEffect, useState } from "react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { DialogueOverlay } from "@/components/dialogue/dialogue-overlay";
import { PixelButton, PixelIcon, PixelNotification } from "@/components/pixel";
import { TaskBoardOverlay } from "@/components/task-board/task-board-overlay";
import { useWorkspaceTasks } from "@/hooks/use-workspace-tasks";
import type { TaskSummary } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";
import {
  PixelAssistant,
  PixelBird,
  PixelBush,
  PixelButterfly,
  PixelCat,
  PixelCloud,
  PixelGround,
  PixelRabbit,
  PixelSun,
  PixelTree,
} from "./pixel-scenery";

interface WorkplaceHomeProps {
  assistantName: string;
  greeting: string;
  viewerLabel: string;
}

/**
 * Phase-0 workplace home (placeholder for #8): an 8-bit office scene with a
 * Reception zone that opens the RPG dialogue overlay. No dashboard, no chat list.
 */
export function WorkplaceHome({
  assistantName,
  greeting,
  viewerLabel,
}: WorkplaceHomeProps) {
  const [dialogueOpen, setDialogueOpen] = useState(false);
  const [taskBoardOpen, setTaskBoardOpen] = useState(false);
  const {
    acknowledgeCompletedDesks,
    banner,
    deskStates,
    dismissBanner,
    error: tasksError,
    loading: tasksLoading,
    reload: reloadTasks,
    tasks,
  } = useWorkspaceTasks(true);

  const hasDoneDesk = deskStates.some((desk) => desk.state === "done");

  useEffect(() => {
    if (taskBoardOpen) {
      reloadTasks().catch(() => {
        /* ignore refresh errors */
      });
    }
  }, [taskBoardOpen, reloadTasks]);

  const handleTaskSelect = (_task: TaskSummary) => {
    setTaskBoardOpen(false);
    setDialogueOpen(true);
  };

  const openTaskBoard = () => {
    acknowledgeCompletedDesks();
    setTaskBoardOpen(true);
  };

  useEffect(() => {
    if (dialogueOpen) {
      return;
    }

    const handler = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        setDialogueOpen(true);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [dialogueOpen]);

  return (
    <div
      className="relative flex min-h-full flex-1 flex-col overflow-hidden"
      style={{
        backgroundImage:
          "linear-gradient(180deg, var(--color-sky-top) 0%, var(--color-sky-mid) 55%, var(--color-sky-low) 100%)",
      }}
    >
      {/* Pixel HUD strip */}
      <header className="z-10 flex items-center justify-between border-wood border-b-[4px] bg-panel px-4 py-3 shadow-[0_4px_0_0_rgba(122,74,36,0.3)]">
        <h1 className="flex items-center gap-2 font-pixel text-[10px] text-ink uppercase tracking-widest sm:text-xs">
          <span className="text-leaf-dark">{"\u25A0"}</span> Nex Staff —
          Workspace
        </h1>
        <div className="flex items-center gap-3 font-pixel text-[10px] text-ink-muted">
          <span className="hidden sm:inline">{viewerLabel}</span>
          <SignOutButton />
        </div>
      </header>

      {/* Scene */}
      <main
        className={cn(
          "relative flex flex-1 flex-col transition-opacity",
          dialogueOpen && "pointer-events-none opacity-50"
        )}
      >
        {/* Sky decorations */}
        <div className="pointer-events-none absolute inset-0 select-none">
          {/* Sun */}
          <PixelSun
            className="pixel-sun-spin absolute top-6 right-8"
            size={92}
          />
          {/* Clouds */}
          <PixelCloud className="absolute top-8 left-8" size={132} />
          <PixelCloud className="absolute top-24 right-40" size={104} />
          <PixelCloud className="absolute top-16 left-1/2" size={84} />
          <PixelCloud className="absolute top-40 left-1/4" size={72} />
          <PixelCloud className="absolute top-6 left-2/3" size={96} />
          <PixelCloud className="absolute top-36 right-1/4" size={64} />
          <PixelCloud className="absolute top-52 left-3/4" size={80} />
          {/* Birds */}
          <PixelBird
            className="absolute top-32 left-1/3 animate-bounce"
            size={30}
          />
          <PixelBird className="absolute top-44 left-2/5" size={22} />
          <PixelBird className="absolute top-28 right-2/5" size={26} />
          <PixelBird
            className="absolute top-20 left-1/5 animate-bounce"
            size={20}
          />
          {/* Butterflies */}
          <PixelButterfly
            className="absolute top-1/2 left-12 animate-bounce"
            size={26}
          />
          <PixelButterfly
            className="absolute top-2/3 right-16 animate-bounce"
            size={22}
          />
          {/* Twinkling sparkles */}
          <PixelIcon
            className="absolute top-16 left-1/3 cursor-blink text-sun"
            name="sparkles"
            size={22}
          />
          <PixelIcon
            className="absolute top-52 left-1/5 text-white"
            name="sparkles"
            size={14}
          />
          <PixelIcon
            className="absolute top-24 right-1/3 cursor-blink text-sun"
            name="sparkles"
            size={18}
          />
          {/* Archive zone (placeholder until #9) */}
          <div className="pointer-events-auto absolute top-28 left-6 flex flex-col items-center gap-1 sm:left-16">
            <PixelIcon className="text-ink" name="archive" size={44} />
            <span className="rounded-none border-2 border-wood bg-panel px-1 font-pixel text-[8px] text-ink uppercase">
              Archive
            </span>
          </div>
          <button
            aria-label="Open task board"
            className="pointer-events-auto absolute top-28 right-6 flex flex-col items-center gap-1 sm:right-16"
            onClick={openTaskBoard}
            type="button"
          >
            <span className="relative">
              <PixelIcon className="text-ink" name="clipboard" size={44} />
              {hasDoneDesk ? (
                <span
                  aria-hidden
                  className="absolute -top-1 -right-1 flex size-5 animate-bounce items-center justify-center rounded-full border-2 border-wood bg-alert font-pixel text-[10px] text-white"
                >
                  !
                </span>
              ) : null}
            </span>
            <span className="rounded-none border-2 border-wood bg-panel px-1 font-pixel text-[8px] text-ink uppercase">
              Task Board
            </span>
          </button>
        </div>

        {/* Reception NPC */}
        <div className="relative z-[1] flex flex-1 flex-col items-center justify-center gap-4 px-6">
          {/* Speech bubble */}
          <div className="relative border-[3px] border-wood bg-panel px-4 py-2 shadow-[3px_3px_0_0_rgba(122,74,36,0.35)]">
            <span className="font-body text-[20px] text-ink leading-none">
              Hi boss! Click to talk.
            </span>
            <span className="absolute -bottom-[10px] left-6 h-0 w-0 border-t-[10px] border-t-wood border-r-[8px] border-r-transparent border-l-[8px] border-l-transparent" />
          </div>

          {/* Assistant sprite */}
          <button
            aria-label={`Talk to ${assistantName}`}
            className="group flex flex-col items-center gap-2"
            onClick={() => setDialogueOpen(true)}
            type="button"
          >
            <PixelAssistant
              className="animate-bounce transition-transform group-hover:scale-110"
              size={96}
            />
            {/* Reception counter */}
            <span className="flex h-10 w-40 items-center justify-center border-[4px] border-wood border-b-0 bg-panel font-pixel text-[9px] text-ink uppercase tracking-widest sm:w-56">
              Reception
            </span>
          </button>

          <div className="flex flex-col items-center gap-2">
            <PixelButton onClick={() => setDialogueOpen(true)}>
              {"\u25B6"} {assistantName}
            </PixelButton>
            <p className="font-pixel text-[9px] text-ink uppercase tracking-widest">
              [Enter / Click] Talk
            </p>
          </div>
        </div>

        {/* Trees, bushes & critters resting on the grass line */}
        <div className="pointer-events-none absolute inset-x-0 bottom-[168px] select-none">
          <PixelTree
            className="absolute bottom-0 left-4 sm:left-12"
            size={104}
          />
          <PixelTree className="absolute bottom-0 left-1/3" size={80} />
          <PixelTree
            className="absolute right-6 bottom-0 sm:right-20"
            size={120}
          />
          <PixelTree className="absolute right-1/3 bottom-0" size={72} />
          <PixelBush className="absolute bottom-0 left-1/4" size={60} />
          <PixelBush className="absolute right-2/5 bottom-0" size={48} />
          <PixelBush className="absolute bottom-0 left-2/3" size={54} />
          <PixelBush className="absolute right-1/4 bottom-0" size={44} />
          <PixelCat
            className="absolute bottom-0 left-1/2 animate-bounce"
            size={44}
          />
          <PixelRabbit className="absolute bottom-0 left-[38%]" size={40} />
        </div>

        {/* Grassy ground */}
        <PixelGround height={190} />
      </main>

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
          onClose={() => setTaskBoardOpen(false)}
          onSelectTask={handleTaskSelect}
          tasks={tasks}
        />
      ) : null}

      {dialogueOpen ? (
        <DialogueOverlay
          greeting={greeting}
          onClose={() => setDialogueOpen(false)}
          portraitIcon="android"
          speakerId="assistant"
          speakerName={assistantName}
          speakerRole="Coordinator"
        />
      ) : null}
    </div>
  );
}
