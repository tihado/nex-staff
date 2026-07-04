import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { PixelButton } from "./pixel-button";

interface PixelHUDAction {
  id: string;
  label: string;
  onClick?: () => void;
}

interface PixelHUDProps {
  actions?: PixelHUDAction[];
  children?: ReactNode;
  className?: string;
  subtitle?: string;
  title: string;
}

export function PixelHUD({
  title,
  subtitle,
  actions = [],
  className,
  children,
}: PixelHUDProps) {
  return (
    <header
      className={cn(
        "flex items-center justify-between gap-4 border-border-dialogue border-b-4 bg-bg-scene px-4 py-3 text-text-primary",
        className
      )}
    >
      <div className="min-w-0">
        <p className="truncate font-[family-name:var(--font-pixel)] text-[length:var(--font-size-nameplate)] uppercase tracking-wide">
          ■ {title}
        </p>
        {subtitle ? (
          <p className="mt-1 truncate font-[family-name:var(--font-body)] text-[length:var(--font-size-dialogue)] text-text-muted">
            {subtitle}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {actions.map((action) => (
          <PixelButton key={action.id} onClick={action.onClick} type="button">
            {action.label}
          </PixelButton>
        ))}
        {children}
      </div>
    </header>
  );
}
