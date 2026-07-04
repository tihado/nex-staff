import { cn } from "@/lib/utils";

interface SpriteProps {
  className?: string;
  size?: number;
}

const WOOD_TOP = "#C9A66B";
const WOOD_MID = "#B8814A";
const WOOD_FRONT = "#9A6634";
const WOOD_DARK = "#6E4A22";
const MONITOR = "#1A1A22";
const CODE_GREEN = "#57A93A";
const CODE_DARK = "#2F7D2E";
const CHAIR = "#4A5568";
const CHAIR_HI = "#5A6578";
const CHAIR_DK = "#3A4558";
const CPU = "#8A9199";
const CPU_DK = "#6E7580";
const KEYBOARD = "#B8BCC4";
const MOUSE = "#9CA3AF";
const MUG = "#FFF6DF";

/** Oblique workstation — code monitor, keyboard, mouse, CPU tower, office chair. */
export function PixelDeskIso({ className, size = 80 }: SpriteProps) {
  return (
    <svg
      aria-hidden
      className={cn(
        "sprite drop-shadow-[3px_4px_0_rgba(0,0,0,0.35)]",
        className
      )}
      height={(size * 52) / 56}
      shapeRendering="crispEdges"
      viewBox="0 0 56 52"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Workstation</title>
      {/* CPU tower */}
      <rect fill={CPU_DK} height="18" width="8" x="2" y="30" />
      <rect fill={CPU} height="16" width="6" x="3" y="31" />
      <rect fill="#C0392B" height="1" width="2" x="5" y="34" />
      <rect fill="#57A93A" height="1" width="2" x="5" y="37" />
      {/* Chair */}
      <rect fill={CHAIR_DK} height="10" width="16" x="20" y="36" />
      <rect fill={CHAIR} height="8" width="12" x="22" y="37" />
      <rect fill={CHAIR_HI} height="6" width="8" x="24" y="28" />
      <rect fill={CHAIR_DK} height="4" width="10" x="25" y="26" />
      {/* Desktop */}
      <rect fill={WOOD_DARK} height="16" width="40" x="10" y="16" />
      <rect fill={WOOD_TOP} height="14" width="38" x="11" y="16" />
      <rect fill={WOOD_MID} height="2" width="38" x="11" y="28" />
      {/* Front face */}
      <rect fill={WOOD_FRONT} height="12" width="40" x="10" y="30" />
      <rect fill={WOOD_DARK} height="12" width="4" x="46" y="30" />
      {/* Monitor */}
      <rect fill={MONITOR} height="14" width="18" x="21" y="0" />
      <rect fill="#0D0D12" height="10" width="14" x="23" y="2" />
      <rect fill={CODE_GREEN} height="1" width="8" x="25" y="4" />
      <rect fill={CODE_DARK} height="1" width="6" x="25" y="6" />
      <rect fill={CODE_GREEN} height="1" width="10" x="25" y="8" />
      <rect fill={CODE_DARK} height="1" width="4" x="25" y="10" />
      <rect fill={MONITOR} height="2" width="8" x="26" y="14" />
      {/* Keyboard + mouse */}
      <rect fill={KEYBOARD} height="3" width="14" x="14" y="20" />
      <rect fill="#9CA3AF" height="1" width="12" x="15" y="21" />
      <rect fill={MOUSE} height="2" width="3" x="32" y="21" />
    </svg>
  );
}

const HIRE_WOOD_TOP = "#B8814A";
const HIRE_WOOD_MID = "#9A6634";
const HIRE_WOOD_FRONT = "#6E4A22";
const HIRE_WOOD_DARK = "#573417";
const HIRE_MONITOR = "#2B2B33";
const HIRE_SCREEN = "#4FB6EA";

/** Original empty-desk sprite — kept for "For hire" slots. */
export function PixelHireDeskIso({ className, size = 80 }: SpriteProps) {
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
      <title>Empty desk</title>
      <rect fill="#4A5058" height="8" width="14" x="17" y="28" />
      <rect fill="#5A6270" height="6" width="10" x="19" y="29" />
      <rect fill={HIRE_WOOD_DARK} height="14" width="36" x="6" y="14" />
      <rect fill={HIRE_WOOD_TOP} height="12" width="34" x="7" y="14" />
      <rect fill={HIRE_WOOD_MID} height="2" width="34" x="7" y="24" />
      <rect fill={HIRE_WOOD_FRONT} height="10" width="36" x="6" y="26" />
      <rect fill={HIRE_WOOD_DARK} height="10" width="4" x="38" y="26" />
      <rect fill={HIRE_MONITOR} height="12" width="16" x="16" y="0" />
      <rect fill={HIRE_SCREEN} height="8" width="12" x="18" y="2" />
      <rect fill="#BFECFF" height="2" width="4" x="20" y="3" />
      <rect fill={HIRE_MONITOR} height="2" width="6" x="21" y="12" />
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

/** Two-seater reception sofa (waiting area). */
export function PixelSofaIso({ className, size = 56 }: SpriteProps) {
  return (
    <svg
      aria-hidden
      className={cn(
        "sprite drop-shadow-[2px_3px_0_rgba(0,0,0,0.32)]",
        className
      )}
      height={(size * 28) / 40}
      shapeRendering="crispEdges"
      viewBox="0 0 40 28"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Sofa</title>
      <rect fill="#A85D78" height="8" width="6" x="2" y="4" />
      <rect fill="#A85D78" height="8" width="6" x="32" y="4" />
      <rect fill="#C9799A" height="10" width="36" x="2" y="4" />
      <rect fill="#E896B0" height="12" width="32" x="4" y="10" />
      <rect fill="#D47A98" height="4" width="32" x="4" y="10" />
      <rect fill="#573417" height="4" width="4" x="6" y="22" />
      <rect fill="#573417" height="4" width="4" x="30" y="22" />
    </svg>
  );
}

/** Low tea / coffee table for reception waiting area. */
export function PixelTeaTableIso({ className, size = 36 }: SpriteProps) {
  return (
    <svg
      aria-hidden
      className={cn(
        "sprite drop-shadow-[2px_2px_0_rgba(0,0,0,0.28)]",
        className
      )}
      height={(size * 20) / 28}
      shapeRendering="crispEdges"
      viewBox="0 0 28 20"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Tea table</title>
      <rect fill={WOOD_DARK} height="8" width="22" x="3" y="4" />
      <rect fill={WOOD_TOP} height="6" width="20" x="4" y="4" />
      <rect fill={WOOD_FRONT} height="5" width="22" x="3" y="10" />
      <rect fill="#8F5E22" height="3" width="6" x="11" y="5" />
      <rect fill={MUG} height="3" width="3" x="8" y="6" />
      <rect fill={MUG} height="3" width="3" x="17" y="6" />
      <rect fill="#573417" height="3" width="3" x="12" y="13" />
      <rect fill="#573417" height="3" width="3" x="16" y="13" />
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

/** Metal filing cabinet for the archive room. */
export function PixelFilingCabinetIso({ className, size = 36 }: SpriteProps) {
  return (
    <svg
      aria-hidden
      className={cn(
        "sprite drop-shadow-[2px_3px_0_rgba(0,0,0,0.35)]",
        className
      )}
      height={(size * 44) / 28}
      shapeRendering="crispEdges"
      viewBox="0 0 28 44"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Filing cabinet</title>
      <rect fill="#4A5058" height="42" width="24" x="2" y="0" />
      <rect fill="#7A8494" height="40" width="20" x="4" y="1" />
      <rect fill="#4A5058" height="1" width="20" x="4" y="15" />
      <rect fill="#4A5058" height="1" width="20" x="4" y="29" />
      <rect fill="#C2CAD4" height="1" width="6" x="11" y="8" />
      <rect fill="#C2CAD4" height="1" width="6" x="11" y="22" />
      <rect fill="#C2CAD4" height="1" width="6" x="11" y="36" />
      <rect fill="#2B2B33" height="4" width="24" x="2" y="40" />
    </svg>
  );
}

/** Document shelf with colored binders (archive room). */
export function PixelArchiveShelfIso({ className, size = 48 }: SpriteProps) {
  return (
    <svg
      aria-hidden
      className={cn(
        "sprite drop-shadow-[2px_3px_0_rgba(0,0,0,0.3)]",
        className
      )}
      height={(size * 32) / 40}
      shapeRendering="crispEdges"
      viewBox="0 0 40 32"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Archive shelf</title>
      <rect fill="#573417" height="32" width="40" x="0" y="0" />
      <rect fill="#6E4A22" height="30" width="6" x="34" y="1" />
      <rect fill="#9C6B3B" height="28" width="32" x="2" y="2" />
      <rect fill="#C0392B" height="10" width="4" x="4" y="4" />
      <rect fill="#2E86C1" height="10" width="4" x="10" y="4" />
      <rect fill="#57A93A" height="10" width="4" x="16" y="4" />
      <rect fill="#E8A33D" height="10" width="4" x="22" y="4" />
      <rect fill="#8E5BD0" height="10" width="4" x="28" y="4" />
      <rect fill="#573417" height="1" width="32" x="2" y="16" />
      <rect fill="#FF8FB1" height="8" width="4" x="4" y="18" />
      <rect fill="#4FB6EA" height="8" width="4" x="10" y="18" />
      <rect fill="#F5A623" height="8" width="4" x="16" y="18" />
    </svg>
  );
}

/** Short room partition wall (archive alcove). */
export function PixelRoomPartitionIso({ className, size = 48 }: SpriteProps) {
  return (
    <svg
      aria-hidden
      className={cn(
        "sprite drop-shadow-[2px_2px_0_rgba(0,0,0,0.3)]",
        className
      )}
      height={(size * 20) / 8}
      shapeRendering="crispEdges"
      viewBox="0 0 8 20"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Room partition</title>
      <rect fill="#1a2030" height="20" width="8" x="0" y="0" />
      <rect fill="#2a3548" height="20" width="3" x="0" y="0" />
      <rect fill="#0d1018" height="20" width="2" x="6" y="0" />
    </svg>
  );
}

/** Wall-mounted whiteboard with sticky notes (task board zone). */
export function PixelWhiteboardIso({ className, size = 64 }: SpriteProps) {
  return (
    <svg
      aria-hidden
      className={cn(
        "sprite drop-shadow-[2px_3px_0_rgba(0,0,0,0.35)]",
        className
      )}
      height={(size * 36) / 48}
      shapeRendering="crispEdges"
      viewBox="0 0 48 36"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Whiteboard</title>
      <rect fill="#6E4A22" height="36" width="48" x="0" y="0" />
      <rect fill="#F5F5F0" height="30" width="42" x="3" y="3" />
      <rect fill="#E8E8E0" height="30" width="4" x="41" y="3" />
      <rect fill="#FFF9C4" height="8" width="8" x="8" y="8" />
      <rect fill="#FFD6E8" height="7" width="7" x="20" y="10" />
      <rect fill="#C8F0C8" height="6" width="6" x="32" y="12" />
      <rect fill="#2B2B33" height="1" width="12" x="8" y="22" />
      <rect fill="#2B2B33" height="1" width="10" x="8" y="26" />
      <rect fill="#8A9199" height="4" width="2" x="23" y="32" />
    </svg>
  );
}
