import { MAX_SPEAK_CHARS } from "./constants";

const SENTENCE_BOUNDARY = /[^.!?]+[.!?]+[\])'"`]*\s*|[^.!?]+$/g;
const SENTENCE_END = /[.!?][\])'"`]*\s*$/;

const STREAMING_CHUNK_MIN_CHARS = 120;

/** True when assistant reply is long enough to speak only the first sentence. */
export function shouldLimitSpeakableToFirstSentence(
  text: string,
  limit = MAX_SPEAK_CHARS
): boolean {
  return text.trim().length > limit;
}

/** First complete sentence, or the full trimmed text when partial is allowed. */
export function extractFirstSpeakableSentence(
  text: string,
  options: { allowPartial: boolean }
): string | null {
  const trimmed = text.trim();

  if (!trimmed) {
    return null;
  }

  const raw = trimmed.match(SENTENCE_BOUNDARY) ?? [trimmed];
  const first = raw[0]?.trim();

  if (!first) {
    return null;
  }

  if (SENTENCE_END.test(first) || options.allowPartial) {
    return first;
  }

  return null;
}

/** Split text into speakable sentence chunks; drops trailing fragment while streaming. */
export function extractSpeakableSentences(
  text: string,
  options: { includePartial: boolean; streaming?: boolean }
): string[] {
  const trimmed = text.trim();

  if (!trimmed) {
    return [];
  }

  const raw = trimmed.match(SENTENCE_BOUNDARY) ?? [trimmed];
  const sentences = raw.map((part) => part.trim()).filter(Boolean);

  if (options.includePartial) {
    return sentences;
  }

  if (sentences.length === 0) {
    return [];
  }

  const endsWithPunctuation = SENTENCE_END.test(trimmed);

  if (endsWithPunctuation) {
    return sentences;
  }

  const complete = sentences.slice(0, -1);

  if (
    options.streaming &&
    complete.length === 0 &&
    trimmed.length >= STREAMING_CHUNK_MIN_CHARS
  ) {
    const breakAt = trimmed.lastIndexOf(" ", STREAMING_CHUNK_MIN_CHARS);

    if (breakAt > 40) {
      return [trimmed.slice(0, breakAt).trim()];
    }
  }

  return complete;
}
