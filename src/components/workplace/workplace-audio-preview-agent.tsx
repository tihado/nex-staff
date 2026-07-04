"use client";

import { useEffect, useState } from "react";
import { PixelCharacterIso } from "@/components/workplace/office-sprites-iso";
import { cn } from "@/lib/utils";

interface WorkplaceAudioPreviewAgentProps {
  runningId: string | null;
}

const WALK_SCENARIOS = new Set([
  "staff-walk-short",
  "staff-walk-long",
  "pantry-arrival",
  "polyphony-stress",
  "idle-roam-walk",
]);

function walkDurationMs(runningId: string): number {
  if (runningId === "pantry-arrival") {
    return 2500;
  }
  if (runningId === "staff-walk-long") {
    return 4500;
  }
  if (runningId === "idle-roam-walk") {
    return 3200;
  }
  return 2000;
}

/** Visual agent preview synced to the active audio test scenario. */
export function WorkplaceAudioPreviewAgent({
  runningId,
}: WorkplaceAudioPreviewAgentProps) {
  const [emote, setEmote] = useState<string | null>(null);
  const [isWalking, setIsWalking] = useState(false);
  const [showRelief, setShowRelief] = useState(false);

  useEffect(() => {
    if (!runningId) {
      setEmote(null);
      setIsWalking(false);
      setShowRelief(false);
      return;
    }

    setShowRelief(false);
    setEmote(null);

    if (runningId === "cat-walk") {
      setIsWalking(true);
      setShowRelief(false);
      setEmote("meow");
      const walkTimer = setTimeout(() => {
        setIsWalking(false);
        setEmote(null);
      }, 3200);
      return () => clearTimeout(walkTimer);
    }

    if (WALK_SCENARIOS.has(runningId)) {
      setIsWalking(true);
      const duration = walkDurationMs(runningId);

      const reliefTimer =
        runningId === "pantry-arrival"
          ? setTimeout(() => setShowRelief(true), 2900)
          : undefined;

      const walkTimer = setTimeout(() => setIsWalking(false), duration);

      return () => {
        clearTimeout(walkTimer);
        if (reliefTimer) {
          clearTimeout(reliefTimer);
        }
      };
    }

    if (runningId === "task-progress-emotes") {
      setEmote("thinking");
      const ideaTimer = setTimeout(() => setEmote("idea"), 1800);
      return () => clearTimeout(ideaTimer);
    }

    if (runningId === "idle-roam-landing") {
      setIsWalking(false);
      return;
    }

    if (runningId === "all-vocals") {
      setEmote("thinking");
      const t1 = setTimeout(() => setEmote("idea"), 4400);
      const t2 = setTimeout(() => setShowRelief(true), 6600);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }

    return;
  }, [runningId]);

  return (
    <div className="flex flex-col items-center gap-3 border-2 border-wood bg-panel/80 p-4">
      <p className="font-[family-name:var(--font-pixel)] text-[9px] text-ink uppercase tracking-wide">
        Preview agent
      </p>
      <div className="relative flex flex-col items-center">
        {emote === "thinking" ? (
          <span className="absolute -top-5 font-[family-name:var(--font-pixel)] text-[10px] text-ink">
            …
          </span>
        ) : null}
        {emote === "idea" ? (
          <span className="absolute -top-5 font-[family-name:var(--font-pixel)] text-[10px] text-pixel-accent">
            !
          </span>
        ) : null}
        {emote === "meow" ? (
          <span className="absolute -top-5 font-[family-name:var(--font-pixel)] text-[10px] text-sun">
            meooo
          </span>
        ) : null}
        {showRelief ? (
          <span className="absolute -top-5 font-[family-name:var(--font-pixel)] text-[10px] text-success">
            ~phew~
          </span>
        ) : null}
        <span
          className={cn(
            "relative",
            isWalking &&
              (runningId === "cat-walk"
                ? "agent-walk-bob-slow"
                : "agent-walk-bob")
          )}
        >
          <PixelCharacterIso size={48} variant={0} />
        </span>
      </div>
      <p className="font-[family-name:var(--font-body)] text-[12px] text-ink-muted">
        {runningId
          ? `Scenario: ${runningId}`
          : "Chọn Run để xem animation khớp audio"}
      </p>
    </div>
  );
}
