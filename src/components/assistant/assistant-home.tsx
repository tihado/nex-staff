"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ReceptionOutdoorScene } from "@/components/assistant/reception-outdoor-scene";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { DialogueOverlay } from "@/components/dialogue/dialogue-overlay";
import { GameShell } from "@/components/layout";
import { PixelButton, PixelHUD } from "@/components/pixel";
import { PixelWoodSign } from "@/components/workplace/office-sprites";
import {
  PixelAssistant,
  PixelEntryArrow,
  PixelOfficeBuilding,
} from "@/components/workplace/pixel-scenery";
import { WorkplaceAudioProvider } from "@/components/workplace/workplace-audio-provider";
import { WorkplaceAudioToggle } from "@/components/workplace/workplace-audio-toggle";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

interface AssistantHomeProps {
  assistantName: string;
  greeting: string;
  viewerLabel: string;
}

/**
 * Issue #5 entry: outdoor reception with sky/grass scenery, Assistant dialogue,
 * and an office building (arrow → door) that leads to the workplace floor (#8).
 */
export function AssistantHome({
  assistantName,
  greeting,
  viewerLabel,
}: AssistantHomeProps) {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const [dialogueOpen, setDialogueOpen] = useState(false);

  const musicSuppressed = reducedMotion || dialogueOpen;
  const sfxSuppressed = true;

  useEffect(() => {
    if (dialogueOpen) {
      return;
    }

    const handler = (event: KeyboardEvent) => {
      const target = event.target;

      if (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "BUTTON" ||
          target.tagName === "A" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (event.key === "Enter") {
        setDialogueOpen(true);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [dialogueOpen]);

  const enterWorkplace = () => {
    router.push("/workplace");
  };

  return (
    <WorkplaceAudioProvider
      musicSuppressed={musicSuppressed}
      sfxSuppressed={sfxSuppressed}
    >
      <GameShell>
        <div className="flex min-h-0 flex-1 flex-col">
          <PixelHUD subtitle={viewerLabel} title="Nex Staff — Reception">
            <WorkplaceAudioToggle />
            <SignOutButton />
          </PixelHUD>

          <main
            className={cn(
              "relative min-h-0 flex-1 overflow-hidden transition-opacity",
              dialogueOpen && "pointer-events-none opacity-50"
            )}
          >
            <ReceptionOutdoorScene />

            <div className="relative z-[1] flex h-full flex-col items-center justify-end gap-4 px-4 pb-[120px] sm:flex-row sm:items-end sm:justify-between sm:px-8 sm:pb-[112px]">
              {/* Assistant — talk at reception */}
              <div className="flex w-full max-w-md flex-col items-center gap-4 sm:items-start">
                <div className="relative border-[4px] border-wood bg-panel/95 px-4 py-3 shadow-[4px_4px_0_0_rgba(0,0,0,0.45)] sm:max-w-xs">
                  <p className="font-[family-name:var(--font-body)] text-[20px] text-ink leading-snug sm:text-[22px]">
                    Hi boss! Click to talk to {assistantName}.
                  </p>
                  <span className="absolute -bottom-[12px] left-8 h-0 w-0 border-t-[12px] border-t-wood border-r-[10px] border-r-transparent border-l-[10px] border-l-transparent sm:left-10" />
                </div>

                <button
                  aria-label={`Talk to ${assistantName}`}
                  className="group relative flex flex-col items-center gap-2 sm:items-start"
                  onClick={() => setDialogueOpen(true)}
                  type="button"
                >
                  <PixelAssistant
                    className="transition-transform group-hover:scale-110"
                    size={88}
                  />
                  <span className="border-[3px] border-wood bg-panel px-3 py-1 font-[family-name:var(--font-pixel)] text-[9px] text-ink uppercase tracking-widest shadow-[3px_3px_0_0_rgba(0,0,0,0.35)]">
                    {assistantName}
                  </span>
                </button>

                <PixelButton onClick={() => setDialogueOpen(true)}>
                  ▶ Talk to {assistantName}
                </PixelButton>

                <p className="font-[family-name:var(--font-pixel)] text-[8px] text-ink uppercase tracking-widest [text-shadow:1px_1px_0_#fff6df]">
                  [Enter] Talk
                </p>
              </div>

              {/* Office building — workplace entry */}
              <button
                aria-label="Enter the workplace office floor"
                className="group relative flex shrink-0 flex-col items-center gap-2 focus-visible:outline-2 focus-visible:outline-pixel-accent focus-visible:outline-offset-4"
                onClick={enterWorkplace}
                type="button"
              >
                <PixelEntryArrow
                  className="advance-indicator absolute -top-10 left-1/2 -translate-x-1/2"
                  size={36}
                />
                <PixelOfficeBuilding
                  className="transition-transform group-hover:scale-105"
                  size={168}
                />
                <PixelWoodSign label="Workplace" />
                <span className="font-[family-name:var(--font-pixel)] text-[8px] text-ink uppercase tracking-widest [text-shadow:1px_1px_0_#fff6df]">
                  ▶ Enter workplace
                </span>
              </button>
            </div>
          </main>
        </div>

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
      </GameShell>
    </WorkplaceAudioProvider>
  );
}
