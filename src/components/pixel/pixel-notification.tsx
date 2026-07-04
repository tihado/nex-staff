"use client";

import { useEffect } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

interface PixelNotificationProps {
  autoDismissMs?: number;
  className?: string;
  message: string;
  onDismiss?: () => void;
  title: string;
  visible?: boolean;
}

export function PixelNotification({
  title,
  message,
  visible = true,
  onDismiss,
  autoDismissMs = 4000,
  className,
}: PixelNotificationProps) {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!(visible && onDismiss) || autoDismissMs <= 0) {
      return;
    }

    const timer = window.setTimeout(onDismiss, autoDismissMs);
    return () => window.clearTimeout(timer);
  }, [autoDismissMs, onDismiss, visible]);

  if (!visible) {
    return null;
  }

  return (
    <div
      aria-live="assertive"
      className={cn(
        "pointer-events-auto border-4 border-border-dialogue bg-bg-dialogue px-6 py-4 text-center shadow-[var(--pixel-shadow)]",
        !reducedMotion && "pixel-notification-enter",
        className
      )}
      role="status"
    >
      <p className="font-[family-name:var(--font-pixel)] text-[length:var(--font-size-nameplate)] text-highlight">
        ★ {title} ★
      </p>
      <p className="mt-2 font-[family-name:var(--font-body)] text-[length:var(--font-size-dialogue)] text-text-primary">
        {message}
      </p>
    </div>
  );
}
