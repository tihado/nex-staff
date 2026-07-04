"use client";

import { useEffect } from "react";
import { PixelCloseButton, PixelIcon, PixelPanel } from "@/components/pixel";

interface ZoneOverlayProps {
  description: string;
  icon?: string;
  onClose: () => void;
  title: string;
}

/**
 * Placeholder overlay for zones that ship in later issues (Archive #9,
 * Task Board #14, Hire flow #11). Renders a pixel panel and closes on Esc.
 */
export function ZoneOverlay({
  description,
  icon = "clipboard",
  onClose,
  title,
}: ZoneOverlayProps) {
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
      aria-label={title}
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
      <PixelPanel className="relative z-10 w-full max-w-md" title={title}>
        <div className="flex flex-col items-center gap-4 p-6 text-center">
          <PixelIcon className="text-pixel-accent" name={icon} size={48} />
          <p className="font-[family-name:var(--font-body)] text-[length:var(--font-size-dialogue)] text-text-primary leading-snug">
            {description}
          </p>
          <PixelCloseButton label="[ OK ]" onClick={onClose} />
        </div>
      </PixelPanel>
    </div>
  );
}
