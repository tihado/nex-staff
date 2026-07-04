import { cn } from "@/lib/utils";

const LEAF_LIGHT = "#86D45A";
const LEAF_MID = "#57A93A";
const LEAF_DARK = "#2F7D2E";
const TRUNK = "#7A4A24";
const TRUNK_DARK = "#573417";
const CLOUD = "#FFFFFF";
const CLOUD_SHADOW = "#CDE7F5";
const GRASS_TOP = "#86D45A";
const GRASS_MID = "#57A93A";
const SOIL = "#4A2E1A";
const SOIL_DARK = "#35200F";
const SOIL_SPECK = "#6B4326";

interface SpriteProps {
  className?: string;
  size?: number;
}

/** Chunky pixel-art tree (filled foliage + trunk). */
export function PixelTree({ className, size = 64 }: SpriteProps) {
  return (
    <svg
      aria-hidden
      className={cn("sprite", className)}
      height={(size * 40) / 32}
      shapeRendering="crispEdges"
      viewBox="0 0 32 40"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Tree</title>
      {/* Trunk */}
      <rect fill={TRUNK} height="14" width="6" x="13" y="26" />
      <rect fill={TRUNK_DARK} height="14" width="3" x="16" y="26" />
      {/* Foliage — dark base */}
      <rect fill={LEAF_DARK} height="12" width="20" x="6" y="12" />
      <rect fill={LEAF_DARK} height="8" width="24" x="4" y="14" />
      <rect fill={LEAF_DARK} height="6" width="14" x="9" y="8" />
      <rect fill={LEAF_DARK} height="4" width="8" x="12" y="5" />
      {/* Mid green */}
      <rect fill={LEAF_MID} height="8" width="14" x="8" y="13" />
      <rect fill={LEAF_MID} height="5" width="8" x="11" y="8" />
      {/* Light highlights */}
      <rect fill={LEAF_LIGHT} height="3" width="5" x="12" y="6" />
      <rect fill={LEAF_LIGHT} height="3" width="4" x="9" y="11" />
    </svg>
  );
}

/** Small pixel-art bush. */
export function PixelBush({ className, size = 48 }: SpriteProps) {
  return (
    <svg
      aria-hidden
      className={cn("sprite", className)}
      height={(size * 14) / 24}
      shapeRendering="crispEdges"
      viewBox="0 0 24 14"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Bush</title>
      <rect fill={LEAF_DARK} height="8" width="20" x="2" y="6" />
      <rect fill={LEAF_DARK} height="4" width="6" x="5" y="3" />
      <rect fill={LEAF_DARK} height="4" width="6" x="13" y="3" />
      <rect fill={LEAF_MID} height="5" width="8" x="4" y="6" />
      <rect fill={LEAF_MID} height="3" width="4" x="6" y="4" />
      <rect fill={LEAF_LIGHT} height="2" width="3" x="6" y="4" />
    </svg>
  );
}

/** Fluffy pixel-art cloud with a light underside shadow. */
export function PixelCloud({ className, size = 96 }: SpriteProps) {
  return (
    <svg
      aria-hidden
      className={cn("sprite", className)}
      height={(size * 20) / 40}
      shapeRendering="crispEdges"
      viewBox="0 0 40 20"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Cloud</title>
      <rect fill={CLOUD} height="8" width="28" x="6" y="6" />
      <rect fill={CLOUD} height="5" width="16" x="10" y="3" />
      <rect fill={CLOUD} height="4" width="8" x="22" y="4" />
      <rect fill={CLOUD} height="6" width="34" x="3" y="9" />
      <rect fill={CLOUD_SHADOW} height="2" width="34" x="3" y="15" />
    </svg>
  );
}

/** Little pixel bird for the sky. */
export function PixelBird({ className, size = 28 }: SpriteProps) {
  return (
    <svg
      aria-hidden
      className={cn("sprite", className)}
      height={(size * 12) / 16}
      shapeRendering="crispEdges"
      viewBox="0 0 16 12"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Bird</title>
      <rect fill="#2E6DA4" height="2" width="4" x="4" y="3" />
      <rect fill="#2E6DA4" height="2" width="2" x="2" y="6" />
      <rect fill="#4A90D9" height="4" width="8" x="4" y="5" />
      <rect fill="#4A90D9" height="4" width="4" x="10" y="3" />
      <rect fill="#F5A623" height="1" width="2" x="14" y="5" />
      <rect fill="#12324F" height="1" width="1" x="12" y="4" />
    </svg>
  );
}

/** Little pixel cat sitting on the grass. */
export function PixelCat({ className, size = 40 }: SpriteProps) {
  return (
    <svg
      aria-hidden
      className={cn("sprite", className)}
      height={(size * 14) / 16}
      shapeRendering="crispEdges"
      viewBox="0 0 16 14"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Cat</title>
      {/* Tail */}
      <rect fill="#E8964A" height="6" width="2" x="1" y="6" />
      {/* Body */}
      <rect fill="#E8964A" height="6" width="8" x="4" y="7" />
      {/* Head */}
      <rect fill="#E8964A" height="6" width="7" x="7" y="3" />
      {/* Ears */}
      <rect fill="#E8964A" height="2" width="2" x="7" y="1" />
      <rect fill="#E8964A" height="2" width="2" x="12" y="1" />
      {/* Eyes + nose */}
      <rect fill="#123" height="1" width="1" x="9" y="5" />
      <rect fill="#123" height="1" width="1" x="12" y="5" />
      <rect fill="#C9793A" height="1" width="1" x="10" y="6" />
      {/* Paws */}
      <rect fill="#C9793A" height="1" width="2" x="4" y="12" />
      <rect fill="#C9793A" height="1" width="2" x="9" y="12" />
    </svg>
  );
}

const SUN_CORE = "#FFD23F";
const SUN_RAY = "#FFB020";
const SUN_GLOW = "#FFF3C4";
const BUTTERFLY_WING = "#FF8FB1";
const BUTTERFLY_WING_DARK = "#E85D8A";
const BUTTERFLY_BODY = "#4A2E1A";
const RABBIT_FUR = "#F4E9DC";
const RABBIT_FUR_SHADOW = "#D9C7B4";
const RABBIT_INNER_EAR = "#F7B8C6";

/** Cheerful pixel sun with chunky rays. */
export function PixelSun({ className, size = 72 }: SpriteProps) {
  return (
    <svg
      aria-hidden
      className={cn("sprite", className)}
      height={size}
      shapeRendering="crispEdges"
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Sun</title>
      {/* Rays */}
      <rect fill={SUN_RAY} height="3" width="2" x="11" y="0" />
      <rect fill={SUN_RAY} height="3" width="2" x="11" y="21" />
      <rect fill={SUN_RAY} height="2" width="3" x="0" y="11" />
      <rect fill={SUN_RAY} height="2" width="3" x="21" y="11" />
      <rect fill={SUN_RAY} height="2" width="2" x="4" y="4" />
      <rect fill={SUN_RAY} height="2" width="2" x="18" y="4" />
      <rect fill={SUN_RAY} height="2" width="2" x="4" y="18" />
      <rect fill={SUN_RAY} height="2" width="2" x="18" y="18" />
      {/* Core */}
      <rect fill={SUN_CORE} height="10" width="14" x="5" y="7" />
      <rect fill={SUN_CORE} height="14" width="10" x="7" y="5" />
      {/* Highlight */}
      <rect fill={SUN_GLOW} height="3" width="3" x="9" y="8" />
    </svg>
  );
}

/** Fluttering pixel butterfly. */
export function PixelButterfly({ className, size = 24 }: SpriteProps) {
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
      <title>Butterfly</title>
      {/* Body */}
      <rect fill={BUTTERFLY_BODY} height="8" width="2" x="7" y="4" />
      {/* Antennae */}
      <rect fill={BUTTERFLY_BODY} height="2" width="1" x="6" y="2" />
      <rect fill={BUTTERFLY_BODY} height="2" width="1" x="9" y="2" />
      {/* Left wing */}
      <rect fill={BUTTERFLY_WING} height="4" width="5" x="2" y="4" />
      <rect fill={BUTTERFLY_WING} height="3" width="4" x="2" y="9" />
      <rect fill={BUTTERFLY_WING_DARK} height="2" width="2" x="3" y="5" />
      {/* Right wing */}
      <rect fill={BUTTERFLY_WING} height="4" width="5" x="9" y="4" />
      <rect fill={BUTTERFLY_WING} height="3" width="4" x="10" y="9" />
      <rect fill={BUTTERFLY_WING_DARK} height="2" width="2" x="11" y="5" />
    </svg>
  );
}

/** Small pixel rabbit resting on the grass. */
export function PixelRabbit({ className, size = 40 }: SpriteProps) {
  return (
    <svg
      aria-hidden
      className={cn("sprite", className)}
      height={(size * 16) / 16}
      shapeRendering="crispEdges"
      viewBox="0 0 16 16"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Rabbit</title>
      {/* Ears */}
      <rect fill={RABBIT_FUR} height="6" width="2" x="5" y="1" />
      <rect fill={RABBIT_FUR} height="6" width="2" x="9" y="1" />
      <rect fill={RABBIT_INNER_EAR} height="3" width="1" x="5" y="3" />
      <rect fill={RABBIT_INNER_EAR} height="3" width="1" x="10" y="3" />
      {/* Head + body */}
      <rect fill={RABBIT_FUR} height="6" width="8" x="4" y="6" />
      <rect fill={RABBIT_FUR} height="4" width="10" x="3" y="10" />
      {/* Tail */}
      <rect fill={RABBIT_FUR} height="3" width="3" x="12" y="10" />
      {/* Shadow underside */}
      <rect fill={RABBIT_FUR_SHADOW} height="1" width="10" x="3" y="13" />
      {/* Eye + nose */}
      <rect fill={BUTTERFLY_BODY} height="1" width="1" x="6" y="8" />
      <rect fill={RABBIT_INNER_EAR} height="1" width="1" x="8" y="9" />
    </svg>
  );
}

const RAINBOW_BANDS = [
  { id: "r", color: "#ff5b5b", r: 37 },
  { id: "o", color: "#ffa23f", r: 32 },
  { id: "y", color: "#ffd23f", r: 27 },
  { id: "g", color: "#57a93a", r: 22 },
  { id: "b", color: "#4fb6ea", r: 17 },
  { id: "v", color: "#9b5de5", r: 12 },
];

/** Chunky pixel rainbow arc. */
export function PixelRainbow({ className, size = 200 }: SpriteProps) {
  const cx = 42;
  const cy = 44;

  return (
    <svg
      aria-hidden
      className={cn("sprite", className)}
      height={(size * 44) / 84}
      shapeRendering="crispEdges"
      viewBox="0 0 84 44"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Rainbow</title>
      {RAINBOW_BANDS.map((band) => (
        <path
          d={`M ${cx - band.r} ${cy} A ${band.r} ${band.r} 0 0 1 ${cx + band.r} ${cy}`}
          fill="none"
          key={band.id}
          stroke={band.color}
          strokeWidth="5"
        />
      ))}
    </svg>
  );
}

const CASTLE_STONE = "#DAD0C1";
const CASTLE_STONE_SH = "#B7AB97";
const CASTLE_STONE_DK = "#8C8271";
const CASTLE_GATE = "#5B4A38";
const CASTLE_POLE = "#7A4A24";
const CASTLE_FLAG_A = "#4FB6EA";
const CASTLE_FLAG_B = "#D24B4B";

/** Pixel-art castle with towers, battlements, flags and a gate. */
export function PixelCastle({ className, size = 200 }: SpriteProps) {
  return (
    <svg
      aria-hidden
      className={cn("sprite", className)}
      height={size}
      shapeRendering="crispEdges"
      viewBox="0 0 48 48"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Castle</title>
      {/* Flag poles */}
      <rect fill={CASTLE_POLE} height="6" width="1" x="7" y="2" />
      <rect fill={CASTLE_POLE} height="6" width="1" x="40" y="2" />
      {/* Flags */}
      <rect fill={CASTLE_FLAG_A} height="3" width="5" x="8" y="2" />
      <rect fill={CASTLE_FLAG_B} height="3" width="5" x="35" y="2" />
      {/* Towers */}
      <rect fill={CASTLE_STONE} height="36" width="12" x="2" y="12" />
      <rect fill={CASTLE_STONE} height="36" width="12" x="34" y="12" />
      <rect fill={CASTLE_STONE_SH} height="36" width="4" x="10" y="12" />
      <rect fill={CASTLE_STONE_SH} height="36" width="4" x="42" y="12" />
      {/* Center wall */}
      <rect fill={CASTLE_STONE} height="26" width="24" x="12" y="22" />
      <rect fill={CASTLE_STONE_SH} height="26" width="6" x="30" y="22" />
      {/* Merlons — left tower */}
      <rect fill={CASTLE_STONE} height="4" width="3" x="2" y="8" />
      <rect fill={CASTLE_STONE} height="4" width="3" x="7" y="8" />
      <rect fill={CASTLE_STONE} height="4" width="3" x="11" y="8" />
      {/* Merlons — right tower */}
      <rect fill={CASTLE_STONE} height="4" width="3" x="34" y="8" />
      <rect fill={CASTLE_STONE} height="4" width="3" x="39" y="8" />
      <rect fill={CASTLE_STONE} height="4" width="3" x="43" y="8" />
      {/* Merlons — wall */}
      <rect fill={CASTLE_STONE} height="4" width="3" x="12" y="18" />
      <rect fill={CASTLE_STONE} height="4" width="3" x="18" y="18" />
      <rect fill={CASTLE_STONE} height="4" width="3" x="24" y="18" />
      <rect fill={CASTLE_STONE} height="4" width="3" x="30" y="18" />
      {/* Gate */}
      <rect fill={CASTLE_GATE} height="14" width="10" x="19" y="34" />
      <rect fill={CASTLE_GATE} height="3" width="8" x="20" y="31" />
      <rect fill={CASTLE_GATE} height="2" width="4" x="22" y="29" />
      <rect fill={CASTLE_STONE_DK} height="15" width="1" x="18" y="33" />
      <rect fill={CASTLE_STONE_DK} height="15" width="1" x="29" y="33" />
      {/* Windows */}
      <rect fill={CASTLE_GATE} height="5" width="3" x="6" y="20" />
      <rect fill={CASTLE_GATE} height="5" width="3" x="38" y="20" />
      <rect fill={CASTLE_GATE} height="4" width="3" x="15" y="26" />
      <rect fill={CASTLE_GATE} height="4" width="3" x="30" y="26" />
    </svg>
  );
}

const GUARD_SKIN = "#E8A56E";
const GUARD_SKIN_SH = "#C67C4A";
const GUARD_HAIR = "#7A4A24";
const GUARD_SHIRT = "#C0392B";
const GUARD_SHIRT_SH = "#8F2A20";
const GUARD_PANTS = "#2E5F8A";
const GUARD_PANTS_SH = "#22496B";
const GUARD_SHOE = "#3A2A1A";
const GUARD_BLADE = "#C2CAD4";
const GUARD_BLADE_SH = "#8E97A3";
const GUARD_CROSS = "#D6A93F";
const GUARD_HILT = "#6B4A24";
const GUARD_EYE = "#2B2B2B";

/** Pixel-art gatekeeper guard holding a raised sword. */
export function PixelGuard({ className, size = 96 }: SpriteProps) {
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
      <title>Gatekeeper</title>
      {/* Sword blade */}
      <rect fill={GUARD_BLADE} height="4" width="2" x="12" y="0" />
      <rect fill={GUARD_BLADE_SH} height="4" width="1" x="13" y="0" />
      {/* Crossguard + hilt */}
      <rect fill={GUARD_CROSS} height="1" width="5" x="11" y="4" />
      <rect fill={GUARD_HILT} height="1" width="1" x="13" y="5" />
      {/* Hair */}
      <rect fill={GUARD_HAIR} height="2" width="6" x="6" y="3" />
      <rect fill={GUARD_HAIR} height="3" width="1" x="5" y="4" />
      <rect fill={GUARD_HAIR} height="2" width="1" x="12" y="4" />
      {/* Face */}
      <rect fill={GUARD_SKIN} height="4" width="6" x="6" y="5" />
      <rect fill={GUARD_HAIR} height="1" width="6" x="6" y="5" />
      <rect fill={GUARD_SKIN_SH} height="1" width="6" x="6" y="8" />
      <rect fill={GUARD_EYE} height="1" width="1" x="7" y="6" />
      <rect fill={GUARD_EYE} height="1" width="1" x="10" y="6" />
      {/* Torso */}
      <rect fill={GUARD_SHIRT} height="5" width="8" x="5" y="9" />
      <rect fill={GUARD_SHIRT_SH} height="5" width="2" x="11" y="9" />
      <rect fill={GUARD_SKIN_SH} height="1" width="4" x="7" y="9" />
      {/* Left arm (down) */}
      <rect fill={GUARD_SHIRT} height="2" width="1" x="4" y="9" />
      <rect fill={GUARD_SKIN} height="3" width="1" x="4" y="11" />
      <rect fill={GUARD_SKIN_SH} height="1" width="1" x="4" y="14" />
      {/* Right arm (raised, gripping sword) */}
      <rect fill={GUARD_SHIRT} height="1" width="1" x="13" y="9" />
      <rect fill={GUARD_SKIN} height="4" width="2" x="13" y="6" />
      <rect fill={GUARD_SKIN_SH} height="1" width="2" x="13" y="6" />
      {/* Belt */}
      <rect fill={GUARD_HILT} height="1" width="8" x="5" y="13" />
      {/* Pants */}
      <rect fill={GUARD_PANTS} height="3" width="6" x="6" y="14" />
      <rect fill={GUARD_PANTS_SH} height="3" width="3" x="9" y="14" />
      {/* Legs */}
      <rect fill={GUARD_SKIN} height="3" width="2" x="6" y="17" />
      <rect fill={GUARD_SKIN} height="3" width="2" x="10" y="17" />
      {/* Shoes */}
      <rect fill={GUARD_SHOE} height="1" width="2" x="6" y="19" />
      <rect fill={GUARD_SHOE} height="1" width="2" x="10" y="19" />
    </svg>
  );
}

const AS_CAP = "#C0392B";
const AS_CAP_SH = "#8F2A20";
const AS_HAIR = "#5A3A22";
const AS_SKIN = "#F0C088";
const AS_SKIN_SH = "#D9A566";
const AS_GLASS = "#3FB6AE";
const AS_LENS = "#BFECE8";
const AS_PHONE = "#4AA8A0";
const AS_PHONE_SH = "#357E78";
const AS_HOODIE = "#8E5BD0";
const AS_HOODIE_SH = "#6E3FB0";
const AS_CUP = "#E8B23F";
const AS_EYE = "#2B2B2B";

/** Pixel-art assistant: cap, headphones, big glasses, purple hoodie. */
export function PixelAssistant({ className, size = 96 }: SpriteProps) {
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
      <title>Assistant</title>
      {/* Headphone band + cap */}
      <rect fill={AS_PHONE} height="2" width="8" x="6" y="0" />
      <rect fill={AS_CAP} height="3" width="10" x="5" y="2" />
      <rect fill={AS_CAP_SH} height="1" width="10" x="5" y="4" />
      <rect fill={AS_CAP} height="1" width="3" x="14" y="4" />
      {/* Hair */}
      <rect fill={AS_HAIR} height="2" width="2" x="5" y="5" />
      <rect fill={AS_HAIR} height="2" width="2" x="13" y="5" />
      {/* Face */}
      <rect fill={AS_SKIN} height="8" width="8" x="6" y="5" />
      <rect fill={AS_SKIN_SH} height="1" width="8" x="6" y="12" />
      {/* Headphone ear cups */}
      <rect fill={AS_PHONE} height="5" width="3" x="3" y="6" />
      <rect fill={AS_PHONE_SH} height="5" width="1" x="3" y="6" />
      <rect fill={AS_PHONE} height="5" width="3" x="14" y="6" />
      <rect fill={AS_PHONE_SH} height="5" width="1" x="16" y="6" />
      {/* Glasses */}
      <rect fill={AS_GLASS} height="5" width="5" x="5" y="6" />
      <rect fill={AS_GLASS} height="5" width="5" x="10" y="6" />
      <rect fill={AS_LENS} height="3" width="3" x="6" y="7" />
      <rect fill={AS_LENS} height="3" width="3" x="11" y="7" />
      <rect fill={AS_GLASS} height="1" width="2" x="9" y="8" />
      <rect fill={AS_EYE} height="1" width="1" x="7" y="8" />
      <rect fill={AS_EYE} height="1" width="1" x="12" y="8" />
      {/* Smile */}
      <rect fill={AS_EYE} height="1" width="2" x="9" y="11" />
      {/* Hoodie */}
      <rect fill={AS_HOODIE_SH} height="1" width="8" x="6" y="13" />
      <rect fill={AS_HOODIE} height="6" width="14" x="3" y="14" />
      <rect fill={AS_HOODIE_SH} height="6" width="4" x="13" y="14" />
      <rect fill={AS_HOODIE_SH} height="6" width="1" x="9" y="14" />
      {/* Cup in hands */}
      <rect fill={AS_SKIN} height="2" width="1" x="7" y="18" />
      <rect fill={AS_SKIN} height="2" width="1" x="12" y="18" />
      <rect fill={AS_CUP} height="2" width="4" x="8" y="18" />
    </svg>
  );
}

const KING_CROWN = "#F2C94C";
const KING_CROWN_SH = "#D6A93F";
const KING_JEWEL = "#C0392B";
const KING_HAIR = "#6B4A2A";
const KING_SKIN = "#F0C088";
const KING_COLLAR = "#FFFFFF";
const KING_ROBE = "#C0392B";
const KING_ROBE_SH = "#8F2A20";
const KING_ROBE_GOLD = "#F2C94C";
const KING_EYE = "#2B2B2B";

/** Pixel-art king (boss): jewelled crown, beard, royal robe. */
export function PixelKing({ className, size = 96 }: SpriteProps) {
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
      <title>King</title>
      {/* Crown points */}
      <rect fill={KING_CROWN} height="2" width="2" x="5" y="1" />
      <rect fill={KING_CROWN} height="2" width="2" x="9" y="1" />
      <rect fill={KING_CROWN} height="2" width="2" x="13" y="1" />
      {/* Crown band */}
      <rect fill={KING_CROWN} height="2" width="10" x="5" y="3" />
      <rect fill={KING_CROWN_SH} height="1" width="10" x="5" y="4" />
      <rect fill={KING_JEWEL} height="1" width="2" x="9" y="3" />
      {/* Hair */}
      <rect fill={KING_HAIR} height="3" width="2" x="5" y="5" />
      <rect fill={KING_HAIR} height="3" width="2" x="13" y="5" />
      {/* Face */}
      <rect fill={KING_SKIN} height="6" width="8" x="6" y="5" />
      <rect fill={KING_EYE} height="1" width="1" x="8" y="7" />
      <rect fill={KING_EYE} height="1" width="1" x="11" y="7" />
      {/* Beard */}
      <rect fill={KING_HAIR} height="3" width="8" x="6" y="9" />
      <rect fill={KING_SKIN} height="1" width="4" x="8" y="9" />
      <rect fill={KING_EYE} height="1" width="2" x="9" y="10" />
      {/* Collar */}
      <rect fill={KING_COLLAR} height="1" width="10" x="5" y="12" />
      <rect fill={KING_COLLAR} height="1" width="12" x="4" y="13" />
      {/* Robe */}
      <rect fill={KING_ROBE} height="6" width="12" x="4" y="14" />
      <rect fill={KING_ROBE_SH} height="6" width="3" x="13" y="14" />
      <rect fill={KING_ROBE_GOLD} height="6" width="2" x="9" y="14" />
      <rect fill="#4FB6EA" height="1" width="2" x="9" y="13" />
    </svg>
  );
}

interface PixelGroundProps {
  className?: string;
  height?: number;
}

const BLADE_LINE = 16;
const GRASS_BODY = 46;

/** Full-width grassy ground with a jagged grass edge and a tall soil layer. */
export function PixelGround({ className, height = 190 }: PixelGroundProps) {
  const bladeHeights = [9, 15, 7, 12, 8, 14, 6, 11];
  const grassBottom = BLADE_LINE + GRASS_BODY;

  return (
    <div
      className={cn("relative w-full overflow-hidden", className)}
      style={{ height }}
    >
      {/* Soil */}
      <div className="absolute inset-0" style={{ background: SOIL_DARK }} />
      <div
        className="absolute inset-x-0 bottom-0"
        style={{ background: SOIL, height: height - grassBottom }}
      />
      {/* Soil specks */}
      <div
        className="absolute"
        style={{
          background: SOIL_SPECK,
          bottom: 26,
          height: 5,
          left: "18%",
          width: 5,
        }}
      />
      <div
        className="absolute"
        style={{
          background: SOIL_SPECK,
          bottom: 52,
          height: 5,
          left: "62%",
          width: 5,
        }}
      />
      <div
        className="absolute"
        style={{
          background: SOIL_SPECK,
          bottom: 18,
          height: 5,
          left: "80%",
          width: 5,
        }}
      />
      <div
        className="absolute"
        style={{
          background: SOIL_SPECK,
          bottom: 40,
          height: 5,
          left: "38%",
          width: 5,
        }}
      />
      {/* Grass body (below the blade line) */}
      <div
        className="absolute inset-x-0"
        style={{ background: GRASS_MID, height: GRASS_BODY, top: BLADE_LINE }}
      />
      <div
        className="absolute inset-x-0"
        style={{ background: GRASS_TOP, height: 10, top: BLADE_LINE }}
      />
      {/* Jagged grass blades rising from the grass line into the sky */}
      <div
        className="absolute inset-x-0 top-0 flex items-end"
        style={{ height: BLADE_LINE }}
      >
        {Array.from({ length: 72 }, (_, index) => {
          const blade = bladeHeights[index % bladeHeights.length];
          return (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: static decorative blades
              key={index}
              style={{
                background: GRASS_TOP,
                height: blade,
                width: `${100 / 72}%`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
