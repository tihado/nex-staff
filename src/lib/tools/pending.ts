export const PENDING_TOOL_RESULT = {
  pending: true,
} as const;

export function pendingToolExecute(): typeof PENDING_TOOL_RESULT {
  return PENDING_TOOL_RESULT;
}
