"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PixelButton } from "@/components/pixel/pixel-button";
import { PixelPanel } from "@/components/pixel/pixel-panel";
import { WorkplaceAudioPreviewAgent } from "@/components/workplace/workplace-audio-preview-agent";
import { useWorkplaceAudio } from "@/components/workplace/workplace-audio-provider";
import {
  type AudioTestCase,
  getTestCaseDurationMs,
  runAudioTestCase,
  WORKPLACE_AUDIO_CUE_BUTTONS,
  WORKPLACE_AUDIO_TEST_CASES,
} from "@/lib/audio/workplace-audio-test-cases";
import type { WorkplaceAudioCue } from "@/lib/audio/workplace-audio-types";
import { cn } from "@/lib/utils";

interface WorkplaceAudioDebugPanelProps {
  className?: string;
  /** Floating overlay on workplace vs full-page layout. */
  variant?: "floating" | "page";
}

export function WorkplaceAudioDebugPanel({
  className,
  variant = "floating",
}: WorkplaceAudioDebugPanelProps) {
  const { enabled, playCue, setEnabled, unlock, unlocked } =
    useWorkplaceAudio();
  const cancelRef = useRef<(() => void) | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(variant === "floating");

  const stopScenario = useCallback(() => {
    cancelRef.current?.();
    cancelRef.current = null;
    setRunningId(null);
  }, []);

  useEffect(() => stopScenario, [stopScenario]);

  const ensureAudioReady = useCallback(async () => {
    if (!enabled) {
      setEnabled(true);
    }
    await unlock();
  }, [enabled, setEnabled, unlock]);

  const playSingleCue = useCallback(
    async (cue: WorkplaceAudioCue) => {
      stopScenario();
      await ensureAudioReady();
      playCue(cue);
    },
    [ensureAudioReady, playCue, stopScenario]
  );

  const runScenario = useCallback(
    async (testCase: AudioTestCase) => {
      stopScenario();
      await ensureAudioReady();
      setRunningId(testCase.id);
      cancelRef.current = runAudioTestCase(testCase, playCue);

      const durationMs = getTestCaseDurationMs(testCase);
      setTimeout(() => {
        setRunningId((current) => (current === testCase.id ? null : current));
      }, durationMs);
    },
    [ensureAudioReady, playCue, stopScenario]
  );

  const panelBody = (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 font-[family-name:var(--font-body)] text-[14px] text-ink">
        <span
          className={cn(
            "rounded border px-2 py-0.5 font-[family-name:var(--font-pixel)] text-[9px] uppercase",
            enabled ? "border-success bg-success/10" : "border-wood bg-panel"
          )}
        >
          SND {enabled ? "on" : "off"}
        </span>
        <span
          className={cn(
            "rounded border px-2 py-0.5 font-[family-name:var(--font-pixel)] text-[9px] uppercase",
            unlocked ? "border-success bg-success/10" : "border-wood bg-panel"
          )}
        >
          ctx {unlocked ? "ready" : "locked"}
        </span>
        {runningId ? (
          <span className="font-[family-name:var(--font-pixel)] text-[9px] text-pixel-accent uppercase">
            ▶ {runningId}
          </span>
        ) : null}
      </div>

      <WorkplaceAudioPreviewAgent runningId={runningId} />

      <section>
        <h3 className="mb-2 font-[family-name:var(--font-pixel)] text-[10px] text-ink uppercase tracking-wide">
          Single cues
        </h3>
        <div className="flex flex-wrap gap-2">
          {WORKPLACE_AUDIO_CUE_BUTTONS.map(({ cue, label }) => (
            <PixelButton
              key={cue}
              onClick={() => playSingleCue(cue)}
              type="button"
            >
              {label}
            </PixelButton>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-2 font-[family-name:var(--font-pixel)] text-[10px] text-ink uppercase tracking-wide">
          Scenarios
        </h3>
        <ul className="flex flex-col gap-2">
          {WORKPLACE_AUDIO_TEST_CASES.map((testCase) => (
            <li
              className="border-2 border-wood bg-panel/60 p-2"
              key={testCase.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-[family-name:var(--font-pixel)] text-[10px] text-ink uppercase">
                    {testCase.label}
                  </p>
                  <p className="mt-1 font-[family-name:var(--font-body)] text-[13px] text-ink-muted leading-snug">
                    {testCase.description}
                  </p>
                  <p className="mt-1 font-[family-name:var(--font-body)] text-[11px] text-ink-muted/80">
                    {testCase.steps.length} steps · ~
                    {Math.round(getTestCaseDurationMs(testCase) / 100) / 10}s
                  </p>
                </div>
                <PixelButton
                  disabled={runningId === testCase.id}
                  onClick={() => runScenario(testCase)}
                  type="button"
                >
                  {runningId === testCase.id ? "Playing…" : "Run"}
                </PixelButton>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {runningId ? (
        <PixelButton onClick={stopScenario} type="button">
          Stop scenario
        </PixelButton>
      ) : null}
    </div>
  );

  if (variant === "page") {
    return (
      <div className={cn("mx-auto w-full max-w-2xl p-4", className)}>
        <PixelPanel title="Workplace Audio — Test Cases">
          {panelBody}
        </PixelPanel>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "fixed right-4 bottom-4 z-[100] w-[min(100vw-2rem,24rem)]",
        className
      )}
    >
      <PixelPanel title={collapsed ? "Audio debug" : "Workplace audio — test"}>
        <div className="mb-2 flex justify-end">
          <button
            className="font-[family-name:var(--font-pixel)] text-[9px] text-ink uppercase underline"
            onClick={() => setCollapsed((value) => !value)}
            type="button"
          >
            {collapsed ? "Expand" : "Collapse"}
          </button>
        </div>
        {collapsed ? (
          <p className="font-[family-name:var(--font-body)] text-[13px] text-ink-muted">
            Dev-only panel. Expand to run sound scenarios.
          </p>
        ) : (
          panelBody
        )}
      </PixelPanel>
    </div>
  );
}
