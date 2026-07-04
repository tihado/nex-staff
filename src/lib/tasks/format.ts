export function truncateTaskBrief(brief: string, maxLength = 48): string {
  const trimmed = brief.trim();

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength - 1).trimEnd()}…`;
}
