export const STAFF_AVATAR_IDS = [
  "staff-01",
  "staff-02",
  "staff-03",
  "staff-04",
  "staff-05",
  "staff-06",
  "staff-07",
  "staff-08",
  "staff-09",
  "staff-10",
] as const;

export type StaffAvatarId = (typeof STAFF_AVATAR_IDS)[number];

const LEGACY_AVATAR_IDS = new Set(["default", "writer-01"]);

export function isStaffAvatarId(value: string): value is StaffAvatarId {
  return (STAFF_AVATAR_IDS as readonly string[]).includes(value);
}

export function pickRandomAvatarSprite(): StaffAvatarId {
  const index = Math.floor(Math.random() * STAFF_AVATAR_IDS.length);
  return STAFF_AVATAR_IDS[index] ?? "staff-01";
}

function hashStaffId(staffId: string): number {
  let hash = 0;
  for (const char of staffId) {
    hash = Math.imul(hash, 31) + char.charCodeAt(0);
  }
  return Math.abs(hash);
}

export function normalizeAvatarSprite(
  spriteId: string,
  staffId?: string
): StaffAvatarId {
  if (isStaffAvatarId(spriteId)) {
    return spriteId;
  }

  if (staffId) {
    const index = hashStaffId(staffId) % STAFF_AVATAR_IDS.length;
    return STAFF_AVATAR_IDS[index] ?? "staff-01";
  }

  if (LEGACY_AVATAR_IDS.has(spriteId)) {
    return "staff-01";
  }

  return "staff-01";
}
