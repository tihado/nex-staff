import { cn } from "@/lib/utils";

interface SpriteProps {
  className?: string;
  size?: number;
}

const WOOD_TOP = "#B8814A";
const WOOD_MID = "#9A6634";
const WOOD_FRONT = "#6E4A22";
const WOOD_DARK = "#573417";
const MONITOR = "#2B2B33";
const SCREEN = "#4FB6EA";
const MUG = "#FFF6DF";

/**
 * Oblique desk — desktop + front face + monitor + coffee mug (RPG / Stardew style).
 */
export function PixelDeskIso({ className, size = 80 }: SpriteProps) {
  return (
    <svg
      aria-hidden
      className={cn(
        "sprite drop-shadow-[3px_4px_0_rgba(0,0,0,0.35)]",
        className
      )}
      height={(size * 44) / 48}
      shapeRendering="crispEdges"
      viewBox="0 0 48 44"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Desk</title>
      {/* Chair back (behind desk) */}
      <rect fill="#4A5058" height="8" width="14" x="17" y="28" />
      <rect fill="#5A6270" height="6" width="10" x="19" y="29" />
      {/* Desktop top */}
      <rect fill={WOOD_DARK} height="14" width="36" x="6" y="14" />
      <rect fill={WOOD_TOP} height="12" width="34" x="7" y="14" />
      <rect fill={WOOD_MID} height="2" width="34" x="7" y="24" />
      {/* Front face */}
      <rect fill={WOOD_FRONT} height="10" width="36" x="6" y="26" />
      <rect fill={WOOD_DARK} height="10" width="4" x="38" y="26" />
      {/* Monitor */}
      <rect fill={MONITOR} height="12" width="16" x="16" y="0" />
      <rect fill={SCREEN} height="8" width="12" x="18" y="2" />
      <rect fill="#BFECFF" height="2" width="4" x="20" y="3" />
      <rect fill={MONITOR} height="2" width="6" x="21" y="12" />
      {/* Keyboard + mug on desk */}
      <rect fill="#D9CBB2" height="2" width="10" x="10" y="18" />
      <rect fill={MUG} height="4" width="4" x="30" y="16" />
      <rect fill="#8F5E22" height="1" width="4" x="30" y="16" />
    </svg>
  );
}

const WORKER_SHIRTS = [
  { hair: "#3A2A1A", shirt: "#C0392B", pants: "#2E5F8A" },
  { hair: "#5A3A22", shirt: "#2E86C1", pants: "#21618C" },
  { hair: "#1F1B1B", shirt: "#57A93A", pants: "#2F7D2E" },
  { hair: "#6B4A2A", shirt: "#8E5BD0", pants: "#6E3FB0" },
  { hair: "#2B2B2B", shirt: "#E8A33D", pants: "#8F5E22" },
];

interface CharacterIsoProps extends SpriteProps {
  variant?: number;
}

/** South-facing character (toward viewer) for 2.5D office scenes. */
export function PixelCharacterIso({
  className,
  size = 48,
  variant = 0,
}: CharacterIsoProps) {
  const palette = WORKER_SHIRTS[variant % WORKER_SHIRTS.length];

  return (
    <svg
      aria-hidden
      className={cn(
        "sprite drop-shadow-[2px_3px_0_rgba(0,0,0,0.4)]",
        className
      )}
      height={(size * 40) / 32}
      shapeRendering="crispEdges"
      viewBox="0 0 32 40"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Character</title>
      {/* Shadow ellipse */}
      <rect fill="rgba(0,0,0,0.25)" height="4" width="16" x="8" y="36" />
      {/* Legs */}
      <rect fill={palette.pants} height="8" width="5" x="10" y="28" />
      <rect fill={palette.pants} height="8" width="5" x="17" y="28" />
      {/* Body */}
      <rect fill={palette.shirt} height="10" width="14" x="9" y="18" />
      <rect fill="#123" height="1" width="14" x="9" y="24" />
      {/* Arms */}
      <rect fill={palette.shirt} height="6" width="3" x="6" y="19" />
      <rect fill={palette.shirt} height="6" width="3" x="23" y="19" />
      {/* Head */}
      <rect fill="#F0C088" height="10" width="10" x="11" y="8" />
      <rect fill={palette.hair} height="4" width="10" x="11" y="6" />
      <rect fill={palette.hair} height="3" width="2" x="10" y="9" />
      <rect fill={palette.hair} height="3" width="2" x="20" y="9" />
      <rect fill="#123" height="1" width="1" x="13" y="12" />
      <rect fill="#123" height="1" width="1" x="18" y="12" />
    </svg>
  );
}

/** Wall bookshelf with visible depth (against back wall). */
export function PixelBookshelfIso({ className, size = 64 }: SpriteProps) {
  return (
    <svg
      aria-hidden
      className={cn(
        "sprite drop-shadow-[2px_3px_0_rgba(0,0,0,0.3)]",
        className
      )}
      height={(size * 28) / 40}
      shapeRendering="crispEdges"
      viewBox="0 0 40 28"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Bookshelf</title>
      <rect fill="#573417" height="28" width="40" x="0" y="0" />
      <rect fill="#6E4A22" height="26" width="6" x="34" y="1" />
      <rect fill="#9C6B3B" height="24" width="32" x="2" y="2" />
      <rect fill="#C0392B" height="8" width="4" x="4" y="4" />
      <rect fill="#2E86C1" height="8" width="4" x="9" y="4" />
      <rect fill="#57A93A" height="8" width="4" x="14" y="4" />
      <rect fill="#E8A33D" height="8" width="4" x="19" y="4" />
      <rect fill="#8E5BD0" height="8" width="4" x="24" y="4" />
      <rect fill="#573417" height="1" width="32" x="2" y="14" />
      <rect fill="#FF8FB1" height="6" width="4" x="4" y="16" />
      <rect fill="#4FB6EA" height="6" width="4" x="10" y="16" />
    </svg>
  );
}

/** 3D room divider wall segment. */
export function PixelWallSegment({
  className,
  horizontal = false,
  length = 120,
}: SpriteProps & { horizontal?: boolean; length?: number }) {
  const height = horizontal ? 10 : 14;
  const width = horizontal ? length : 10;

  return (
    <svg
      aria-hidden
      className={cn("sprite", className)}
      height={height}
      shapeRendering="crispEdges"
      viewBox={horizontal ? `0 0 ${length} 10` : "0 0 10 14"}
      width={width}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Wall</title>
      {horizontal ? (
        <>
          <rect fill="#1a2030" height="10" width={length} x="0" y="0" />
          <rect fill="#2a3548" height="4" width={length} x="0" y="0" />
          <rect fill="#0d1018" height="2" width={length} x="0" y="8" />
        </>
      ) : (
        <>
          <rect fill="#1a2030" height="14" width="10" x="0" y="0" />
          <rect fill="#2a3548" height="14" width="3" x="0" y="0" />
          <rect fill="#0d1018" height="14" width="2" x="8" y="0" />
        </>
      )}
    </svg>
  );
}

/** Vending machine (pantry). */
export function PixelVendingIso({ className, size = 40 }: SpriteProps) {
  return (
    <svg
      aria-hidden
      className={cn(
        "sprite drop-shadow-[2px_3px_0_rgba(0,0,0,0.35)]",
        className
      )}
      height={(size * 52) / 32}
      shapeRendering="crispEdges"
      viewBox="0 0 32 52"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Vending machine</title>
      <rect fill="#4A5058" height="50" width="28" x="2" y="0" />
      <rect fill="#7A8494" height="48" width="24" x="4" y="1" />
      <rect fill="#2B2B33" height="20" width="20" x="6" y="4" />
      <rect fill="#C0392B" height="4" width="6" x="8" y="8" />
      <rect fill="#57A93A" height="4" width="6" x="16" y="8" />
      <rect fill="#FFD23F" height="4" width="6" x="8" y="14" />
      <rect fill="#4FB6EA" height="4" width="6" x="16" y="14" />
      <rect fill="#6E4A22" height="14" width="28" x="2" y="38" />
    </svg>
  );
}

/** Pink lounge armchair (reception / hangout). */
export function PixelLoungeChairIso({ className, size = 36 }: SpriteProps) {
  return (
    <svg
      aria-hidden
      className={cn(
        "sprite drop-shadow-[2px_2px_0_rgba(0,0,0,0.3)]",
        className
      )}
      height={(size * 28) / 24}
      shapeRendering="crispEdges"
      viewBox="0 0 24 28"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Lounge chair</title>
      <rect fill="#C9799A" height="8" width="18" x="3" y="2" />
      <rect fill="#E896B0" height="14" width="16" x="4" y="8" />
      <rect fill="#A85D78" height="14" width="4" x="16" y="8" />
      <rect fill="#573417" height="4" width="4" x="5" y="22" />
      <rect fill="#573417" height="4" width="4" x="15" y="22" />
    </svg>
  );
}

/** Potted plant with visible pot depth. */
export function PixelPlantIso({ className, size = 36 }: SpriteProps) {
  return (
    <svg
      aria-hidden
      className={cn(
        "sprite drop-shadow-[2px_2px_0_rgba(0,0,0,0.25)]",
        className
      )}
      height={(size * 32) / 24}
      shapeRendering="crispEdges"
      viewBox="0 0 24 32"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Plant</title>
      <rect fill="#2F7D2E" height="8" width="16" x="4" y="0" />
      <rect fill="#57A93A" height="6" width="12" x="6" y="2" />
      <rect fill="#86D45A" height="3" width="6" x="9" y="4" />
      <rect fill="#8F5E22" height="10" width="10" x="7" y="14" />
      <rect fill="#B87D36" height="10" width="8" x="7" y="14" />
      <rect fill="#573417" height="10" width="3" x="14" y="14" />
      <rect fill="#6E4A22" height="8" width="12" x="6" y="22" />
    </svg>
  );
}

/** Coffee mug (prominent, on bar counter). */
export function PixelMugIso({ className, size = 20 }: SpriteProps) {
  return (
    <svg
      aria-hidden
      className={cn("sprite", className)}
      height={(size * 16) / 14}
      shapeRendering="crispEdges"
      viewBox="0 0 14 16"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Coffee mug</title>
      <rect fill="#FFF6DF" height="10" width="10" x="1" y="4" />
      <rect fill="#8F5E22" height="4" width="10" x="1" y="4" />
      <rect fill="#6E4A22" height="8" width="2" x="11" y="5" />
      <rect fill="#573417" height="2" width="10" x="1" y="13" />
    </svg>
  );
}

/** Wall clock (pantry). */
export function PixelClockIso({ className, size = 32 }: SpriteProps) {
  return (
    <svg
      aria-hidden
      className={cn(
        "sprite drop-shadow-[1px_2px_0_rgba(0,0,0,0.3)]",
        className
      )}
      height={size}
      shapeRendering="crispEdges"
      viewBox="0 0 16 16"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Clock</title>
      <rect fill="#6E4A22" height="16" width="16" x="0" y="0" />
      <rect fill="#FFF6DF" height="14" width="14" x="1" y="1" />
      <rect fill="#2B2B33" height="5" width="1" x="7" y="4" />
      <rect fill="#C0392B" height="4" width="1" x="8" y="5" />
    </svg>
  );
}

/** Coffee bar counter (oblique front). */
export function PixelBarCounterIso({ className, size = 96 }: SpriteProps) {
  return (
    <svg
      aria-hidden
      className={cn(
        "sprite drop-shadow-[3px_4px_0_rgba(0,0,0,0.35)]",
        className
      )}
      height={(size * 20) / 48}
      shapeRendering="crispEdges"
      viewBox="0 0 48 20"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Bar counter</title>
      <rect fill={WOOD_DARK} height="16" width="48" x="0" y="0" />
      <rect fill={WOOD_TOP} height="8" width="46" x="1" y="0" />
      <rect fill={WOOD_FRONT} height="10" width="48" x="0" y="8" />
      <rect fill="#4A5058" height="6" width="10" x="4" y="2" />
      <rect fill={MUG} height="4" width="4" x="20" y="2" />
      <rect fill={MUG} height="4" width="4" x="28" y="2" />
      <rect fill={MUG} height="4" width="4" x="36" y="2" />
    </svg>
  );
}

/** Small cafe table (pantry hangout). */
export function PixelCafeTableIso({ className, size = 44 }: SpriteProps) {
  return (
    <svg
      aria-hidden
      className={cn(
        "sprite drop-shadow-[2px_3px_0_rgba(0,0,0,0.3)]",
        className
      )}
      height={(size * 24) / 32}
      shapeRendering="crispEdges"
      viewBox="0 0 32 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Cafe table</title>
      <rect fill={WOOD_DARK} height="12" width="24" x="4" y="4" />
      <rect fill={WOOD_TOP} height="10" width="22" x="5" y="4" />
      <rect fill={WOOD_FRONT} height="6" width="24" x="4" y="14" />
      <rect fill={MUG} height="3" width="3" x="14" y="7" />
    </svg>
  );
}

/** Water cooler (pantry). */
export function PixelWaterCoolerIso({ className, size = 28 }: SpriteProps) {
  return (
    <svg
      aria-hidden
      className={cn(
        "sprite drop-shadow-[2px_3px_0_rgba(0,0,0,0.3)]",
        className
      )}
      height={(size * 40) / 24}
      shapeRendering="crispEdges"
      viewBox="0 0 24 40"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Water cooler</title>
      <rect fill="#E8E8E8" height="36" width="18" x="3" y="0" />
      <rect fill="#4FB6EA" height="14" width="14" x="5" y="2" />
      <rect fill="#2E86C1" height="4" width="14" x="5" y="14" />
      <rect fill="#6E4A22" height="6" width="18" x="3" y="34" />
    </svg>
  );
}

/** Fridge (pantry). */
export function PixelFridgeIso({ className, size = 36 }: SpriteProps) {
  return (
    <svg
      aria-hidden
      className={cn(
        "sprite drop-shadow-[2px_3px_0_rgba(0,0,0,0.35)]",
        className
      )}
      height={(size * 52) / 28}
      shapeRendering="crispEdges"
      viewBox="0 0 28 52"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Fridge</title>
      <rect fill="#C8CDD4" height="50" width="24" x="2" y="0" />
      <rect fill="#E8ECF0" height="48" width="20" x="4" y="1" />
      <rect fill="#2B2B33" height="1" width="20" x="4" y="24" />
      <rect fill="#8A9199" height="8" width="2" x="20" y="8" />
      <rect fill="#8A9199" height="8" width="2" x="20" y="30" />
    </svg>
  );
}

/** Cat sitting (work area). */
export function PixelCatIso({ className, size = 32 }: SpriteProps) {
  return (
    <svg
      aria-hidden
      className={cn(
        "sprite drop-shadow-[2px_2px_0_rgba(0,0,0,0.25)]",
        className
      )}
      height={(size * 20) / 28}
      shapeRendering="crispEdges"
      viewBox="0 0 28 20"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Cat</title>
      <rect fill="rgba(0,0,0,0.2)" height="3" width="14" x="7" y="17" />
      <rect fill="#E8964A" height="8" width="14" x="7" y="8" />
      <rect fill="#E8964A" height="6" width="8" x="14" y="4" />
      <rect fill="#E8964A" height="2" width="2" x="14" y="2" />
      <rect fill="#E8964A" height="2" width="2" x="20" y="2" />
      <rect fill="#123" height="1" width="1" x="16" y="7" />
      <rect fill="#123" height="1" width="1" x="19" y="7" />
    </svg>
  );
}
