import type { ComponentType, ReactNode } from "react";
import type { StaffAvatarId } from "@/lib/staff/avatars";
import { cn } from "@/lib/utils";

interface SpriteProps {
  className?: string;
  size?: number;
}

const SKIN = "#E8A56E";
const SKIN_SH = "#C67C4A";
const EYE = "#2B2B2B";
const SHOE = "#3A2A1A";

function StaffSpriteBase({
  className,
  size = 96,
  title,
  children,
}: SpriteProps & { title: string; children: ReactNode }) {
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
      <title>{title}</title>
      {children}
    </svg>
  );
}

/** Red shirt, brown hair — classic guard style. */
export function StaffAvatar01({ className, size }: SpriteProps) {
  return (
    <StaffSpriteBase className={className} size={size} title="Staff 01">
      <rect fill="#7A4A24" height="2" width="6" x="6" y="3" />
      <rect fill={SKIN} height="4" width="6" x="6" y="5" />
      <rect fill={SKIN_SH} height="1" width="6" x="6" y="8" />
      <rect fill={EYE} height="1" width="1" x="7" y="6" />
      <rect fill={EYE} height="1" width="1" x="10" y="6" />
      <rect fill="#C0392B" height="5" width="8" x="5" y="9" />
      <rect fill="#8F2A20" height="5" width="2" x="11" y="9" />
      <rect fill="#2E5F8A" height="3" width="6" x="6" y="14" />
      <rect fill="#22496B" height="3" width="3" x="9" y="14" />
      <rect fill={SKIN} height="3" width="2" x="6" y="17" />
      <rect fill={SKIN} height="3" width="2" x="10" y="17" />
      <rect fill={SHOE} height="1" width="2" x="6" y="19" />
      <rect fill={SHOE} height="1" width="2" x="10" y="19" />
    </StaffSpriteBase>
  );
}

/** Purple hoodie, headphones. */
export function StaffAvatar02({ className, size }: SpriteProps) {
  return (
    <StaffSpriteBase className={className} size={size} title="Staff 02">
      <rect fill="#4AA8A0" height="2" width="8" x="6" y="0" />
      <rect fill="#2B1A0E" height="2" width="6" x="6" y="3" />
      <rect fill={SKIN} height="4" width="6" x="6" y="5" />
      <rect fill="#4AA8A0" height="5" width="3" x="3" y="6" />
      <rect fill="#4AA8A0" height="5" width="3" x="14" y="6" />
      <rect fill={EYE} height="1" width="1" x="7" y="6" />
      <rect fill={EYE} height="1" width="1" x="10" y="6" />
      <rect fill="#8E5BD0" height="6" width="14" x="3" y="14" />
      <rect fill="#6E3FB0" height="6" width="4" x="13" y="14" />
      <rect fill={SKIN} height="2" width="1" x="7" y="18" />
      <rect fill={SKIN} height="2" width="1" x="12" y="18" />
    </StaffSpriteBase>
  );
}

/** Green vest, blonde hair. */
export function StaffAvatar03({ className, size }: SpriteProps) {
  return (
    <StaffSpriteBase className={className} size={size} title="Staff 03">
      <rect fill="#F2C94C" height="2" width="6" x="6" y="3" />
      <rect fill={SKIN} height="4" width="6" x="6" y="5" />
      <rect fill={EYE} height="1" width="1" x="7" y="6" />
      <rect fill={EYE} height="1" width="1" x="10" y="6" />
      <rect fill="#FFFFFF" height="5" width="8" x="5" y="9" />
      <rect fill="#57A93A" height="5" width="8" x="5" y="11" />
      <rect fill="#2F7D2E" height="5" width="2" x="11" y="11" />
      <rect fill="#2E5F8A" height="3" width="6" x="6" y="14" />
      <rect fill={SKIN} height="3" width="2" x="6" y="17" />
      <rect fill={SKIN} height="3" width="2" x="10" y="17" />
      <rect fill={SHOE} height="1" width="2" x="6" y="19" />
      <rect fill={SHOE} height="1" width="2" x="10" y="19" />
    </StaffSpriteBase>
  );
}

/** Blue cap, orange shirt. */
export function StaffAvatar04({ className, size }: SpriteProps) {
  return (
    <StaffSpriteBase className={className} size={size} title="Staff 04">
      <rect fill="#2E6DA4" height="3" width="10" x="5" y="2" />
      <rect fill="#1A4A72" height="1" width="10" x="5" y="4" />
      <rect fill={SKIN} height="4" width="6" x="6" y="5" />
      <rect fill={EYE} height="1" width="1" x="7" y="6" />
      <rect fill={EYE} height="1" width="1" x="10" y="6" />
      <rect fill="#F5A623" height="5" width="8" x="5" y="9" />
      <rect fill="#D48806" height="5" width="2" x="11" y="9" />
      <rect fill="#4A3728" height="3" width="6" x="6" y="14" />
      <rect fill={SKIN} height="3" width="2" x="6" y="17" />
      <rect fill={SKIN} height="3" width="2" x="10" y="17" />
      <rect fill={SHOE} height="1" width="2" x="6" y="19" />
      <rect fill={SHOE} height="1" width="2" x="10" y="19" />
    </StaffSpriteBase>
  );
}

/** Pink hair, teal blouse. */
export function StaffAvatar05({ className, size }: SpriteProps) {
  return (
    <StaffSpriteBase className={className} size={size} title="Staff 05">
      <rect fill="#E84393" height="3" width="8" x="5" y="2" />
      <rect fill="#E84393" height="2" width="2" x="4" y="4" />
      <rect fill="#E84393" height="2" width="2" x="14" y="4" />
      <rect fill={SKIN} height="4" width="6" x="6" y="5" />
      <rect fill={EYE} height="1" width="1" x="7" y="6" />
      <rect fill={EYE} height="1" width="1" x="10" y="6" />
      <rect fill="#3FB6AE" height="5" width="8" x="5" y="9" />
      <rect fill="#2A8A84" height="5" width="2" x="11" y="9" />
      <rect fill="#6B4A24" height="3" width="6" x="6" y="14" />
      <rect fill={SKIN} height="3" width="2" x="6" y="17" />
      <rect fill={SKIN} height="3" width="2" x="10" y="17" />
      <rect fill={SHOE} height="1" width="2" x="6" y="19" />
      <rect fill={SHOE} height="1" width="2" x="10" y="19" />
    </StaffSpriteBase>
  );
}

/** Glasses, gray sweater. */
export function StaffAvatar06({ className, size }: SpriteProps) {
  return (
    <StaffSpriteBase className={className} size={size} title="Staff 06">
      <rect fill="#4A3728" height="2" width="6" x="6" y="3" />
      <rect fill={SKIN} height="4" width="6" x="6" y="5" />
      <rect fill="#3FB6AE" height="4" width="4" x="5" y="6" />
      <rect fill="#3FB6AE" height="4" width="4" x="11" y="6" />
      <rect fill="#BFECE8" height="2" width="2" x="6" y="7" />
      <rect fill="#BFECE8" height="2" width="2" x="12" y="7" />
      <rect fill={EYE} height="1" width="1" x="7" y="7" />
      <rect fill={EYE} height="1" width="1" x="12" y="7" />
      <rect fill="#7A8A9A" height="5" width="8" x="5" y="9" />
      <rect fill="#5A6A7A" height="5" width="2" x="11" y="9" />
      <rect fill="#2E5F8A" height="3" width="6" x="6" y="14" />
      <rect fill={SKIN} height="3" width="2" x="6" y="17" />
      <rect fill={SKIN} height="3" width="2" x="10" y="17" />
      <rect fill={SHOE} height="1" width="2" x="6" y="19" />
      <rect fill={SHOE} height="1" width="2" x="10" y="19" />
    </StaffSpriteBase>
  );
}

/** Beret, cream shirt. */
export function StaffAvatar07({ className, size }: SpriteProps) {
  return (
    <StaffSpriteBase className={className} size={size} title="Staff 07">
      <rect fill="#C0392B" height="2" width="8" x="5" y="2" />
      <rect fill="#8F2A20" height="1" width="8" x="5" y="3" />
      <rect fill="#2B1A0E" height="2" width="6" x="6" y="4" />
      <rect fill={SKIN} height="4" width="6" x="6" y="5" />
      <rect fill={EYE} height="1" width="1" x="7" y="6" />
      <rect fill={EYE} height="1" width="1" x="10" y="6" />
      <rect fill="#FFF9C4" height="5" width="8" x="5" y="9" />
      <rect fill="#E8D88A" height="5" width="2" x="11" y="9" />
      <rect fill="#4A3728" height="3" width="6" x="6" y="14" />
      <rect fill={SKIN} height="3" width="2" x="6" y="17" />
      <rect fill={SKIN} height="3" width="2" x="10" y="17" />
      <rect fill={SHOE} height="1" width="2" x="6" y="19" />
      <rect fill={SHOE} height="1" width="2" x="10" y="19" />
    </StaffSpriteBase>
  );
}

/** Spiky hair, yellow jacket. */
export function StaffAvatar08({ className, size }: SpriteProps) {
  return (
    <StaffSpriteBase className={className} size={size} title="Staff 08">
      <rect fill="#F2C94C" height="2" width="2" x="5" y="2" />
      <rect fill="#F2C94C" height="2" width="2" x="9" y="1" />
      <rect fill="#F2C94C" height="2" width="2" x="13" y="2" />
      <rect fill={SKIN} height="4" width="6" x="6" y="5" />
      <rect fill={EYE} height="1" width="1" x="7" y="6" />
      <rect fill={EYE} height="1" width="1" x="10" y="6" />
      <rect fill="#F5A623" height="5" width="10" x="4" y="9" />
      <rect fill="#D48806" height="5" width="3" x="11" y="9" />
      <rect fill="#2E5F8A" height="3" width="6" x="6" y="14" />
      <rect fill={SKIN} height="3" width="2" x="6" y="17" />
      <rect fill={SKIN} height="3" width="2" x="10" y="17" />
      <rect fill={SHOE} height="1" width="2" x="6" y="19" />
      <rect fill={SHOE} height="1" width="2" x="10" y="19" />
    </StaffSpriteBase>
  );
}

/** Ponytail, navy blazer. */
export function StaffAvatar09({ className, size }: SpriteProps) {
  return (
    <StaffSpriteBase className={className} size={size} title="Staff 09">
      <rect fill="#2B1A0E" height="2" width="6" x="6" y="3" />
      <rect fill="#2B1A0E" height="4" width="2" x="3" y="5" />
      <rect fill={SKIN} height="4" width="6" x="6" y="5" />
      <rect fill={EYE} height="1" width="1" x="7" y="6" />
      <rect fill={EYE} height="1" width="1" x="10" y="6" />
      <rect fill="#1A3A5C" height="5" width="8" x="5" y="9" />
      <rect fill="#0F2840" height="5" width="2" x="11" y="9" />
      <rect fill="#FFFFFF" height="1" width="4" x="7" y="10" />
      <rect fill="#4A3728" height="3" width="6" x="6" y="14" />
      <rect fill={SKIN} height="3" width="2" x="6" y="17" />
      <rect fill={SKIN} height="3" width="2" x="10" y="17" />
      <rect fill={SHOE} height="1" width="2" x="6" y="19" />
      <rect fill={SHOE} height="1" width="2" x="10" y="19" />
    </StaffSpriteBase>
  );
}

/** Beanie, olive shirt. */
export function StaffAvatar10({ className, size }: SpriteProps) {
  return (
    <StaffSpriteBase className={className} size={size} title="Staff 10">
      <rect fill="#57A93A" height="3" width="8" x="5" y="2" />
      <rect fill="#2F7D2E" height="1" width="8" x="5" y="4" />
      <rect fill={SKIN} height="4" width="6" x="6" y="5" />
      <rect fill={EYE} height="1" width="1" x="7" y="6" />
      <rect fill={EYE} height="1" width="1" x="10" y="6" />
      <rect fill="#6B8E4E" height="5" width="8" x="5" y="9" />
      <rect fill="#4A6B32" height="5" width="2" x="11" y="9" />
      <rect fill="#4A3728" height="3" width="6" x="6" y="14" />
      <rect fill={SKIN} height="3" width="2" x="6" y="17" />
      <rect fill={SKIN} height="3" width="2" x="10" y="17" />
      <rect fill={SHOE} height="1" width="2" x="6" y="19" />
      <rect fill={SHOE} height="1" width="2" x="10" y="19" />
    </StaffSpriteBase>
  );
}

export const STAFF_AVATAR_COMPONENTS: Record<
  StaffAvatarId,
  ComponentType<SpriteProps>
> = {
  "staff-01": StaffAvatar01,
  "staff-02": StaffAvatar02,
  "staff-03": StaffAvatar03,
  "staff-04": StaffAvatar04,
  "staff-05": StaffAvatar05,
  "staff-06": StaffAvatar06,
  "staff-07": StaffAvatar07,
  "staff-08": StaffAvatar08,
  "staff-09": StaffAvatar09,
  "staff-10": StaffAvatar10,
};
