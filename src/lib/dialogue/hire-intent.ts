const WRITE_SIGNAL =
  /\b(viết|blog|content|bài|article|write|writing|soạn|draft)\b/i;

const TASK_ABOUT_SUFFIX = /\b(?:về|about|on|for)\s+(.+)$/i;

const CONTENT_WRITER_ROLE = /content writer|writer/i;

export const DEFAULT_HIRE_WRITER_NAME = "Alex";

export interface WriteIntent {
  brief: string;
  suggestedName: string;
}

export function detectWriteIntent(text: string): WriteIntent | null {
  const brief = text.trim();

  if (!(brief && WRITE_SIGNAL.test(brief))) {
    return null;
  }

  return {
    brief,
    suggestedName: DEFAULT_HIRE_WRITER_NAME,
  };
}

export function summarizeTaskBrief(brief: string): string {
  const trimmed = brief.trim();

  const aboutMatch = trimmed.match(TASK_ABOUT_SUFFIX);

  if (aboutMatch?.[1]) {
    return aboutMatch[1].trim();
  }

  return trimmed;
}

export function hasContentWriterOnRoster(
  staff: Array<{ role: string }>
): boolean {
  return staff.some((member) => CONTENT_WRITER_ROLE.test(member.role));
}
