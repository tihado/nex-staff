"use client";

import { useCallback, useState } from "react";
import { PixelButton } from "@/components/pixel";
import { uiStrings } from "@/lib/i18n/ui";

type MergeState = "idle" | "confirm" | "loading" | "merged" | "error";

function mergeButtonLabel(state: MergeState): string {
  if (state === "merged") {
    return uiStrings.coder.prMerged;
  }

  if (state === "loading") {
    return uiStrings.coder.merging;
  }

  if (state === "confirm") {
    return uiStrings.coder.confirmMerge;
  }

  return uiStrings.coder.mergeToMain;
}

interface CoderPrActionButtonsProps {
  onMerged?: () => void;
  prMerged?: boolean;
  prUrl?: string | null;
  taskId?: string;
  websitePreviewUrl?: string | null;
}

export function CoderPrActionButtons({
  taskId,
  websitePreviewUrl,
  prUrl,
  prMerged = false,
  onMerged,
}: CoderPrActionButtonsProps) {
  const [mergeState, setMergeState] = useState<MergeState>(
    prMerged ? "merged" : "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canMerge = Boolean(taskId && prUrl && mergeState !== "merged");
  const showPreview = Boolean(websitePreviewUrl);
  const showMerge =
    canMerge ||
    mergeState === "loading" ||
    mergeState === "merged" ||
    mergeState === "error";

  const handleMerge = useCallback(async () => {
    if (!(taskId && prUrl) || mergeState === "merged") {
      return;
    }

    if (mergeState === "idle") {
      setMergeState("confirm");
      setErrorMessage(null);
      return;
    }

    if (mergeState !== "confirm") {
      return;
    }

    setMergeState("loading");
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/tasks/${taskId}/merge-pr`, {
        method: "POST",
      });
      const body = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(body.error ?? uiStrings.coder.mergeFailed);
      }

      setMergeState("merged");
      onMerged?.();
    } catch (error) {
      setMergeState("error");
      setErrorMessage(
        error instanceof Error ? error.message : uiStrings.coder.mergeFailed
      );
    }
  }, [mergeState, onMerged, prUrl, taskId]);

  if (!(showPreview || showMerge)) {
    return null;
  }

  return (
    <>
      {showPreview ? (
        <PixelButton
          onClick={() => {
            window.open(websitePreviewUrl, "_blank", "noopener,noreferrer");
          }}
          type="button"
        >
          {uiStrings.deliverable.openWebsitePreview}
        </PixelButton>
      ) : null}
      {showMerge ? (
        <PixelButton
          disabled={mergeState === "loading" || mergeState === "merged"}
          onClick={() => {
            handleMerge().catch(() => {
              /* handled in handleMerge */
            });
          }}
          type="button"
        >
          {mergeButtonLabel(mergeState)}
        </PixelButton>
      ) : null}
      {mergeState === "confirm" ? (
        <p className="w-full basis-full text-right font-body text-[15px] text-ink-muted">
          {uiStrings.coder.mergeConfirm}
        </p>
      ) : null}
      {errorMessage ? (
        <p className="w-full basis-full text-right font-body text-[15px] text-alert">
          {errorMessage}
        </p>
      ) : null}
    </>
  );
}
