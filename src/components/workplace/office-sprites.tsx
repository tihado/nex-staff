import { cn } from "@/lib/utils";

interface SpriteProps {
  className?: string;
  size?: number;
}

interface PixelWoodSignProps {
  className?: string;
  label: string;
}

/** Hanging wooden room sign — matches the pixel PLAY button style. */
export function PixelWoodSign({ label, className }: PixelWoodSignProps) {
  return (
    <div aria-hidden className={cn("flex flex-col items-center", className)}>
      <div className="pixel-wood-btn pointer-events-none px-3 py-1.5 font-[family-name:var(--font-pixel)] text-[9px] uppercase tracking-widest shadow-[6px_6px_0_0_rgba(0,0,0,0.55)]">
        {label}
      </div>
      <div className="flex gap-3">
        <span className="h-2 w-1.5 bg-[#c8c8c8] shadow-[inset_1px_0_0_#fff,inset_-1px_0_0_#888]" />
        <span className="h-2 w-1.5 bg-[#c8c8c8] shadow-[inset_1px_0_0_#fff,inset_-1px_0_0_#888]" />
      </div>
    </div>
  );
}

const DESK_TOP = "#9C6B3B";
const DESK_EDGE = "#6E4A22";
const DESK_SHADOW = "#573417";
const SCREEN_FRAME = "#2B2B33";
const SCREEN_GLOW = "#4FB6EA";
const KEYBOARD = "#D9CBB2";

/** Top-down desk with a monitor and keyboard, as seen from above. */
export function PixelDeskTopDown({ className, size = 72 }: SpriteProps) {
  return (
    <svg
      aria-hidden
      className={cn("sprite", className)}
      height={(size * 24) / 32}
      shapeRendering="crispEdges"
      viewBox="0 0 32 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Desk</title>
      {/* Desk surface */}
      <rect fill={DESK_SHADOW} height="16" width="32" x="0" y="7" />
      <rect fill={DESK_TOP} height="14" width="30" x="1" y="7" />
      <rect fill={DESK_EDGE} height="2" width="30" x="1" y="19" />
      {/* Monitor (top edge of desk) */}
      <rect fill={SCREEN_FRAME} height="8" width="14" x="9" y="0" />
      <rect fill={SCREEN_GLOW} height="5" width="11" x="11" y="1" />
      <rect fill="#BFECFF" height="2" width="4" x="12" y="2" />
      {/* Keyboard */}
      <rect fill={KEYBOARD} height="3" width="12" x="10" y="14" />
      <rect fill={DESK_EDGE} height="1" width="12" x="10" y="14" />
    </svg>
  );
}

const WORKER_PALETTE = [
  { hair: "#3A2A1A", shirt: "#C0392B", shirtSh: "#8F2A20" },
  { hair: "#5A3A22", shirt: "#2E86C1", shirtSh: "#21618C" },
  { hair: "#1F1B1B", shirt: "#57A93A", shirtSh: "#2F7D2E" },
  { hair: "#6B4A2A", shirt: "#8E5BD0", shirtSh: "#6E3FB0" },
  { hair: "#2B2B2B", shirt: "#E8A33D", shirtSh: "#C07E22" },
];

const SKIN = "#F0C088";
const SKIN_SH = "#D9A566";

interface WorkerSpriteProps extends SpriteProps {
  variant?: number;
}

/** Top-down worker: head, hair and shoulders seen from above. */
export function PixelWorkerTopDown({
  className,
  size = 40,
  variant = 0,
}: WorkerSpriteProps) {
  const palette = WORKER_PALETTE[variant % WORKER_PALETTE.length];

  return (
    <svg
      aria-hidden
      className={cn("sprite", className)}
      height={size}
      shapeRendering="crispEdges"
      viewBox="0 0 16 16"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Worker</title>
      {/* Shoulders */}
      <rect fill={palette.shirtSh} height="5" width="14" x="1" y="11" />
      <rect fill={palette.shirt} height="4" width="12" x="2" y="11" />
      {/* Head */}
      <rect fill={SKIN} height="8" width="8" x="4" y="3" />
      <rect fill={SKIN_SH} height="1" width="8" x="4" y="10" />
      {/* Hair (top-down covers crown + sides) */}
      <rect fill={palette.hair} height="4" width="8" x="4" y="2" />
      <rect fill={palette.hair} height="3" width="2" x="3" y="4" />
      <rect fill={palette.hair} height="3" width="2" x="11" y="4" />
    </svg>
  );
}

const RUG = "#3F6C8C";
const RUG_SH = "#33566E";

/** Small pixel plant for room corners. */
export function PixelPlant({ className, size = 32 }: SpriteProps) {
  return (
    <svg
      aria-hidden
      className={cn("sprite", className)}
      height={size}
      shapeRendering="crispEdges"
      viewBox="0 0 16 16"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Plant</title>
      {/* Leaves */}
      <rect fill="#2F7D2E" height="6" width="10" x="3" y="1" />
      <rect fill="#57A93A" height="4" width="6" x="5" y="2" />
      <rect fill="#86D45A" height="2" width="3" x="6" y="3" />
      {/* Pot */}
      <rect fill="#B87D36" height="6" width="8" x="4" y="8" />
      <rect fill="#8F5E22" height="6" width="3" x="9" y="8" />
      <rect fill="#D9A566" height="1" width="8" x="4" y="8" />
    </svg>
  );
}

/** Tall potted plant for office corners. */
export function PixelTallPlant({ className, size = 40 }: SpriteProps) {
  return (
    <svg
      aria-hidden
      className={cn("sprite", className)}
      height={size}
      shapeRendering="crispEdges"
      viewBox="0 0 16 20"
      width={(size * 16) / 20}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Tall plant</title>
      <rect fill="#2F7D2E" height="4" width="12" x="2" y="0" />
      <rect fill="#57A93A" height="5" width="10" x="3" y="3" />
      <rect fill="#86D45A" height="4" width="8" x="4" y="6" />
      <rect fill="#2F7D2E" height="3" width="6" x="5" y="9" />
      <rect fill="#B87D36" height="8" width="6" x="5" y="12" />
      <rect fill="#8F5E22" height="8" width="2" x="9" y="12" />
    </svg>
  );
}

/** Bookshelf seen from above — rows of colorful spines. */
export function PixelBookshelfTopDown({ className, size = 56 }: SpriteProps) {
  const spines = ["#C0392B", "#2E86C1", "#57A93A", "#E8A33D", "#8E5BD0"];
  return (
    <svg
      aria-hidden
      className={cn("sprite", className)}
      height={(size * 20) / 28}
      shapeRendering="crispEdges"
      viewBox="0 0 28 20"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Bookshelf</title>
      <rect fill="#6E4A22" height="20" width="28" x="0" y="0" />
      <rect fill="#9C6B3B" height="18" width="26" x="1" y="1" />
      {spines.map((color, index) => (
        <rect
          fill={color}
          height="14"
          key={color}
          width="3"
          x={3 + index * 5}
          y="3"
        />
      ))}
      <rect fill="#573417" height="1" width="26" x="1" y="10" />
    </svg>
  );
}

/** Filing cabinet — top-down metal drawers. */
export function PixelFilingCabinet({ className, size = 40 }: SpriteProps) {
  return (
    <svg
      aria-hidden
      className={cn("sprite", className)}
      height={(size * 20) / 16}
      shapeRendering="crispEdges"
      viewBox="0 0 16 20"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Filing cabinet</title>
      <rect fill="#5A6270" height="20" width="16" x="0" y="0" />
      <rect fill="#7A8494" height="18" width="14" x="1" y="1" />
      <rect fill="#4A5058" height="1" width="14" x="1" y="7" />
      <rect fill="#4A5058" height="1" width="14" x="1" y="13" />
      <rect fill="#C2CAD4" height="1" width="4" x="6" y="4" />
      <rect fill="#C2CAD4" height="1" width="4" x="6" y="10" />
      <rect fill="#C2CAD4" height="1" width="4" x="6" y="16" />
    </svg>
  );
}

/** Water cooler for the pantry. */
export function PixelWaterCooler({ className, size = 36 }: SpriteProps) {
  return (
    <svg
      aria-hidden
      className={cn("sprite", className)}
      height={size}
      shapeRendering="crispEdges"
      viewBox="0 0 16 16"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Water cooler</title>
      <rect fill="#E8E8E8" height="6" width="10" x="3" y="0" />
      <rect fill="#BFECFF" height="4" width="8" x="4" y="1" />
      <rect fill="#5A6270" height="8" width="12" x="2" y="6" />
      <rect fill="#7A8494" height="6" width="10" x="3" y="7" />
      <rect fill="#2E86C1" height="2" width="2" x="7" y="9" />
    </svg>
  );
}

/** Office swivel chair — top-down. */
export function PixelOfficeChair({ className, size = 32 }: SpriteProps) {
  return (
    <svg
      aria-hidden
      className={cn("sprite", className)}
      height={size}
      shapeRendering="crispEdges"
      viewBox="0 0 16 16"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Office chair</title>
      <rect fill="#2B2B33" height="4" width="4" x="6" y="12" />
      <rect fill="#4A5058" height="8" width="10" x="3" y="4" />
      <rect fill="#5A6270" height="6" width="8" x="4" y="5" />
      <rect fill="#7A8494" height="2" width="6" x="5" y="6" />
    </svg>
  );
}

/** Meeting table — top-down oval desk for reception. */
export function PixelMeetingTable({ className, size = 64 }: SpriteProps) {
  return (
    <svg
      aria-hidden
      className={cn("sprite", className)}
      height={(size * 20) / 32}
      shapeRendering="crispEdges"
      viewBox="0 0 32 20"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Meeting table</title>
      <rect fill="#573417" height="16" rx="0" width="28" x="2" y="2" />
      <rect fill="#9C6B3B" height="14" width="26" x="3" y="3" />
      <rect fill="#D9CBB2" height="3" width="6" x="13" y="8" />
      <rect fill="#2B2B33" height="4" width="4" x="6" y="14" />
      <rect fill="#2B2B33" height="4" width="4" x="22" y="14" />
    </svg>
  );
}

/** Orange office cat — top-down, curled up. */
export function PixelCatTopDown({ className, size = 36 }: SpriteProps) {
  return (
    <svg
      aria-hidden
      className={cn("sprite", className)}
      height={size}
      shapeRendering="crispEdges"
      viewBox="0 0 16 16"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Office cat</title>
      <rect fill="#E8964A" height="8" width="10" x="3" y="5" />
      <rect fill="#C9793A" height="6" width="8" x="4" y="6" />
      <rect fill="#E8964A" height="5" width="6" x="8" y="3" />
      <rect fill="#E8964A" height="2" width="2" x="8" y="1" />
      <rect fill="#E8964A" height="2" width="2" x="12" y="1" />
      <rect fill="#123" height="1" width="1" x="10" y="5" />
      <rect fill="#123" height="1" width="1" x="12" y="5" />
      <rect fill="#E8964A" height="3" width="2" x="2" y="7" />
    </svg>
  );
}

/** Wall clock for the pantry. */
export function PixelWallClock({ className, size = 40 }: SpriteProps) {
  return (
    <svg
      aria-hidden
      className={cn("sprite", className)}
      height={size}
      shapeRendering="crispEdges"
      viewBox="0 0 16 16"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Wall clock</title>
      <rect fill="#6E4A22" height="16" width="16" x="0" y="0" />
      <rect fill="#FFF6DF" height="14" width="14" x="1" y="1" />
      <rect fill="#E8E0D0" height="12" width="12" x="2" y="2" />
      <rect fill="#2B2B33" height="5" width="1" x="7" y="4" />
      <rect fill="#C0392B" height="4" width="1" x="8" y="5" />
      <rect fill="#2B2B33" height="1" width="1" x="7" y="7" />
      <rect fill="#7A4A24" height="1" width="2" x="7" y="0" />
    </svg>
  );
}

/** Espresso / coffee machine for the pantry counter. */
export function PixelCoffeeMachine({ className, size = 44 }: SpriteProps) {
  return (
    <svg
      aria-hidden
      className={cn("sprite", className)}
      height={size}
      shapeRendering="crispEdges"
      viewBox="0 0 20 20"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Coffee machine</title>
      <rect fill="#4A5058" height="14" width="14" x="3" y="2" />
      <rect fill="#7A8494" height="12" width="12" x="4" y="3" />
      <rect fill="#2B2B33" height="4" width="8" x="6" y="4" />
      <rect fill="#4FB6EA" height="2" width="4" x="7" y="5" />
      <rect fill="#573417" height="3" width="4" x="8" y="10" />
      <rect fill="#6E4A22" height="4" width="16" x="2" y="16" />
      <rect fill="#C0392B" height="2" width="2" x="5" y="8" />
      <rect fill="#57A93A" height="2" width="2" x="13" y="8" />
    </svg>
  );
}

/** Coffee mug on the pantry counter. */
export function PixelCoffeeCup({ className, size = 24 }: SpriteProps) {
  return (
    <svg
      aria-hidden
      className={cn("sprite", className)}
      height={size}
      shapeRendering="crispEdges"
      viewBox="0 0 16 16"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Coffee cup</title>
      <rect fill="#FFF6DF" height="8" width="10" x="2" y="5" />
      <rect fill="#E8E0D0" height="6" width="8" x="3" y="6" />
      <rect fill="#6E4A22" height="8" width="2" x="12" y="4" />
      <rect fill="#573417" height="2" width="10" x="2" y="4" />
      <rect fill="#8F5E22" height="4" width="8" x="3" y="7" />
      <rect fill="#6E4A22" height="1" width="10" x="2" y="12" />
    </svg>
  );
}

/** Potted flowers for office corners. */
export function PixelFlower({ className, size = 28 }: SpriteProps) {
  return (
    <svg
      aria-hidden
      className={cn("sprite", className)}
      height={size}
      shapeRendering="crispEdges"
      viewBox="0 0 16 16"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Flowers</title>
      <rect fill="#FF8FB1" height="3" width="3" x="3" y="2" />
      <rect fill="#FFD23F" height="3" width="3" x="7" y="1" />
      <rect fill="#FF8FB1" height="3" width="3" x="10" y="3" />
      <rect fill="#E85D8A" height="2" width="2" x="4" y="3" />
      <rect fill="#57A93A" height="4" width="2" x="7" y="5" />
      <rect fill="#2F7D2E" height="2" width="4" x="6" y="7" />
      <rect fill="#B87D36" height="5" width="6" x="5" y="10" />
      <rect fill="#8F5E22" height="5" width="2" x="9" y="10" />
    </svg>
  );
}

/** Wide wall bookshelf — office library row. */
export function PixelBookshelfWall({ className, size = 72 }: SpriteProps) {
  const spines = [
    { id: "r", color: "#C0392B" },
    { id: "b", color: "#2E86C1" },
    { id: "g", color: "#57A93A" },
    { id: "y", color: "#E8A33D" },
    { id: "v", color: "#8E5BD0" },
    { id: "p", color: "#FF8FB1" },
    { id: "c", color: "#4FB6EA" },
  ];
  return (
    <svg
      aria-hidden
      className={cn("sprite", className)}
      height={(size * 16) / 36}
      shapeRendering="crispEdges"
      viewBox="0 0 36 16"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Bookshelf</title>
      <rect fill="#6E4A22" height="16" width="36" x="0" y="0" />
      <rect fill="#9C6B3B" height="14" width="34" x="1" y="1" />
      {spines.map((spine, index) => (
        <rect
          fill={spine.color}
          height="10"
          key={spine.id}
          width="3"
          x={2 + index * 5}
          y="3"
        />
      ))}
      <rect fill="#573417" height="1" width="34" x="1" y="8" />
    </svg>
  );
}

/** Long coffee bar counter for the pantry. */
export function PixelCoffeeBar({ className, size = 80 }: SpriteProps) {
  return (
    <svg
      aria-hidden
      className={cn("sprite", className)}
      height={(size * 14) / 40}
      shapeRendering="crispEdges"
      viewBox="0 0 40 14"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Coffee bar</title>
      <rect fill="#573417" height="12" width="40" x="0" y="2" />
      <rect fill="#9C6B3B" height="10" width="38" x="1" y="2" />
      <rect fill="#4A5058" height="6" width="8" x="4" y="3" />
      <rect fill="#7A8494" height="4" width="6" x="5" y="4" />
      <rect fill="#FFF6DF" height="4" width="4" x="16" y="4" />
      <rect fill="#FFF6DF" height="4" width="4" x="22" y="4" />
      <rect fill="#8F5E22" height="3" width="6" x="30" y="5" />
      <rect fill="#6E4A22" height="2" width="38" x="1" y="11" />
    </svg>
  );
}

/** Snack shelf / mini vending rack. */
export function PixelSnackShelf({ className, size = 36 }: SpriteProps) {
  return (
    <svg
      aria-hidden
      className={cn("sprite", className)}
      height={(size * 20) / 16}
      shapeRendering="crispEdges"
      viewBox="0 0 16 20"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Snack shelf</title>
      <rect fill="#5A6270" height="20" width="16" x="0" y="0" />
      <rect fill="#E8E0D0" height="18" width="14" x="1" y="1" />
      <rect fill="#C0392B" height="3" width="4" x="2" y="3" />
      <rect fill="#E8A33D" height="3" width="4" x="7" y="3" />
      <rect fill="#57A93A" height="3" width="4" x="11" y="3" />
      <rect fill="#FFD23F" height="3" width="4" x="2" y="8" />
      <rect fill="#8E5BD0" height="3" width="4" x="7" y="8" />
      <rect fill="#4FB6EA" height="3" width="4" x="11" y="8" />
      <rect fill="#4A5058" height="1" width="14" x="1" y="7" />
      <rect fill="#4A5058" height="1" width="14" x="1" y="12" />
    </svg>
  );
}

/** Small cafe table for pantry hangout. */
export function PixelCafeTable({ className, size = 40 }: SpriteProps) {
  return (
    <svg
      aria-hidden
      className={cn("sprite", className)}
      height={size}
      shapeRendering="crispEdges"
      viewBox="0 0 16 16"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Cafe table</title>
      <rect fill="#6E4A22" height="10" width="10" x="3" y="3" />
      <rect fill="#9C6B3B" height="8" width="8" x="4" y="4" />
      <rect fill="#D9CBB2" height="2" width="4" x="6" y="6" />
      <rect fill="#573417" height="2" width="2" x="7" y="13" />
    </svg>
  );
}

/** A blue meeting-room rug used behind the reception table. */
export function PixelRug({ className, size = 96 }: SpriteProps) {
  return (
    <svg
      aria-hidden
      className={cn("sprite", className)}
      height={(size * 20) / 32}
      shapeRendering="crispEdges"
      viewBox="0 0 32 20"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Rug</title>
      <rect fill={RUG_SH} height="20" width="32" x="0" y="0" />
      <rect fill={RUG} height="16" width="28" x="2" y="2" />
      <rect
        fill="none"
        height="12"
        stroke="#BFECFF"
        strokeWidth="1"
        width="24"
        x="4"
        y="4"
      />
    </svg>
  );
}
