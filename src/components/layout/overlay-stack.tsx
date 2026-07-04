"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { cn } from "@/lib/utils";

type OverlayLayerId = "scene" | "overlay" | "modal" | "notification";

interface OverlayStackContextValue {
  registerLayer: (id: OverlayLayerId, active: boolean) => void;
}

const OverlayStackContext = createContext<OverlayStackContextValue | null>(
  null
);

function useOverlayStackContext() {
  const context = useContext(OverlayStackContext);
  if (!context) {
    throw new Error("OverlayStack.Layer must be used within OverlayStack");
  }
  return context;
}

interface OverlayStackProps {
  children: ReactNode;
  className?: string;
}

const LAYER_Z_INDEX: Record<OverlayLayerId, number> = {
  scene: 10,
  overlay: 20,
  modal: 30,
  notification: 40,
};

export function OverlayStack({ children, className }: OverlayStackProps) {
  const [backdropLayers, setBackdropLayers] = useState<Set<OverlayLayerId>>(
    new Set()
  );

  const registerLayer = useCallback((id: OverlayLayerId, active: boolean) => {
    if (id === "scene" || id === "notification") {
      return;
    }

    setBackdropLayers((prev) => {
      const next = new Set(prev);
      if (active) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const value = useMemo(() => ({ registerLayer }), [registerLayer]);
  const showBackdrop = backdropLayers.size > 0;

  return (
    <OverlayStackContext.Provider value={value}>
      <div className={cn("relative flex min-h-0 flex-1 flex-col", className)}>
        {children}
        {showBackdrop ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[15] bg-[var(--overlay-backdrop)]"
          />
        ) : null}
      </div>
    </OverlayStackContext.Provider>
  );
}

interface OverlayStackLayerProps {
  active?: boolean;
  children: ReactNode;
  className?: string;
  id: OverlayLayerId;
}

function OverlayStackLayer({
  id,
  children,
  className,
  active = true,
}: OverlayStackLayerProps) {
  const { registerLayer } = useOverlayStackContext();

  useEffect(() => {
    registerLayer(id, active);
    return () => registerLayer(id, false);
  }, [active, id, registerLayer]);

  if (!active) {
    return null;
  }

  const isScene = id === "scene";

  return (
    <div
      className={cn(
        isScene
          ? "relative flex min-h-0 flex-1 flex-col"
          : "pointer-events-auto absolute inset-0 flex flex-col",
        className
      )}
      style={{ zIndex: LAYER_Z_INDEX[id] }}
    >
      {children}
    </div>
  );
}

OverlayStack.Layer = OverlayStackLayer;
