import { STAFF_AVATAR_COMPONENTS } from "@/components/workplace/staff-avatars";
import { normalizeAvatarSprite } from "@/lib/staff/avatars";
import { cn } from "@/lib/utils";

interface StaffAvatarProps {
  className?: string;
  size?: number;
  spriteId: string;
  staffId?: string;
}

export function StaffAvatar({
  spriteId,
  staffId,
  size = 48,
  className,
}: StaffAvatarProps) {
  const normalizedId = normalizeAvatarSprite(spriteId, staffId);
  const AvatarComponent = STAFF_AVATAR_COMPONENTS[normalizedId];

  return <AvatarComponent className={cn(className)} size={size} />;
}
