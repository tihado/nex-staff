"use client";

import { useCallback, useEffect } from "react";
import { ChoiceMenu } from "@/components/dialogue/choice-menu";
import { DialogueMarkdown } from "@/components/dialogue/dialogue-markdown";
import { DialoguePortrait } from "@/components/dialogue/dialogue-portrait";
import { PixelButton, PixelDialogueBox } from "@/components/pixel";
import {
  buildCompletionCutsceneGreeting,
  COMPLETION_CUTSCENE_CHOICES,
  COMPLETION_CUTSCENE_PREVIEW_CHOICES,
} from "@/lib/dialogue/completion-choices";
import type { PendingTaskCompletion } from "@/lib/notifications/service";

interface CompletionCutsceneOverlayProps {
  assistantName: string;
  completion: PendingTaskCompletion;
  onAcknowledge: (taskId: string) => void;
  onClose: () => void;
  onDelegateMore: () => void;
  onViewDeliverable: (taskId: string) => void;
}

export function CompletionCutsceneOverlay({
  assistantName,
  completion,
  onAcknowledge,
  onClose,
  onDelegateMore,
  onViewDeliverable,
}: CompletionCutsceneOverlayProps) {
  const greeting = buildCompletionCutsceneGreeting(
    completion.staffName,
    completion.title,
    completion.websitePreviewUrl
  );

  const choices = completion.websitePreviewUrl
    ? COMPLETION_CUTSCENE_PREVIEW_CHOICES
    : COMPLETION_CUTSCENE_CHOICES;

  const handleSelectChoice = useCallback(
    (choiceId: string) => {
      if (choiceId === "completion-preview" && completion.websitePreviewUrl) {
        window.open(
          completion.websitePreviewUrl,
          "_blank",
          "noopener,noreferrer"
        );
        onAcknowledge(completion.taskId);
        onClose();
        return;
      }

      if (choiceId === "completion-view") {
        onViewDeliverable(completion.taskId);
        return;
      }

      if (choiceId === "completion-delegate") {
        onAcknowledge(completion.taskId);
        onClose();
        onDelegateMore();
        return;
      }

      onAcknowledge(completion.taskId);
      onClose();
    },
    [
      completion.taskId,
      completion.websitePreviewUrl,
      onAcknowledge,
      onClose,
      onDelegateMore,
      onViewDeliverable,
    ]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onAcknowledge(completion.taskId);
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [completion.taskId, onAcknowledge, onClose]);

  return (
    <div
      aria-label={`Task completion from ${completion.staffName}`}
      className="fixed inset-0 z-50 flex flex-col"
      role="dialog"
    >
      <button
        aria-label="Close completion dialogue"
        className="absolute inset-0 cursor-default bg-black/50"
        onClick={() => {
          onAcknowledge(completion.taskId);
          onClose();
        }}
        tabIndex={-1}
        type="button"
      />

      <div className="absolute top-3 right-3 z-10">
        <PixelButton
          aria-label="Close (Esc)"
          onClick={() => {
            onAcknowledge(completion.taskId);
            onClose();
          }}
        >
          Close
        </PixelButton>
      </div>

      <div className="relative mt-auto flex flex-col gap-3 p-4 sm:p-6">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
          <div className="flex items-end gap-3 sm:gap-4">
            <DialoguePortrait icon="android" speakerId="assistant" />

            <div className="min-w-0 flex-1">
              <PixelDialogueBox speakerName={assistantName}>
                <DialogueMarkdown content={greeting} />
              </PixelDialogueBox>
            </div>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-3xl justify-end pr-0 sm:pr-28">
          <div className="w-full sm:max-w-sm">
            <ChoiceMenu choices={choices} onSelect={handleSelectChoice} />
          </div>
        </div>
      </div>
    </div>
  );
}
