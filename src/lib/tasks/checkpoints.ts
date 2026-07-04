export interface TaskCheckpoint {
  criteria: string;
  label: string;
  order: number;
}

function isTaskCheckpoint(value: unknown): value is TaskCheckpoint {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    typeof record.label === "string" &&
    typeof record.criteria === "string" &&
    typeof record.order === "number"
  );
}

export function parseTaskCheckpoints(
  metadata: Record<string, unknown>
): TaskCheckpoint[] {
  const raw = metadata.checkpoints;

  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter(isTaskCheckpoint)
    .sort((left, right) => left.order - right.order);
}
