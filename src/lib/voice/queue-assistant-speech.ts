import {
  extractFirstSpeakableSentence,
  extractSpeakableSentences,
  shouldLimitSpeakableToFirstSentence,
} from "./sentence-chunks";

interface QueueAssistantSpeechInput {
  isStreaming: boolean;
  queueSpeak: (text: string) => void;
  spokenPrefix: string;
  stopSpeaking: () => void;
  text: string;
}

/** Queue TTS for new assistant text; returns updated spoken prefix. */
export function queueAssistantSpeech({
  text,
  spokenPrefix,
  isStreaming,
  queueSpeak,
  stopSpeaking,
}: QueueAssistantSpeechInput): string {
  let prefix = spokenPrefix;

  if (prefix && !text.startsWith(prefix)) {
    prefix = "";
    stopSpeaking();
  }

  const remainder = text.slice(prefix.length).trim();

  if (!remainder) {
    return prefix;
  }

  if (shouldLimitSpeakableToFirstSentence(text)) {
    return queueLongAssistantSpeech({
      isStreaming,
      prefix,
      queueSpeak,
      stopSpeaking,
      text,
    });
  }

  const chunks = extractSpeakableSentences(remainder, {
    includePartial: !isStreaming,
    streaming: isStreaming,
  });

  for (const chunk of chunks) {
    queueSpeak(chunk);

    const chunkStart = text.indexOf(chunk, prefix.length);

    if (chunkStart >= 0) {
      prefix = text.slice(0, chunkStart + chunk.length);
    }
  }

  return prefix;
}

function queueLongAssistantSpeech({
  text,
  prefix,
  isStreaming,
  queueSpeak,
  stopSpeaking,
}: {
  isStreaming: boolean;
  prefix: string;
  queueSpeak: (text: string) => void;
  stopSpeaking: () => void;
  text: string;
}): string {
  const firstSentence = extractFirstSpeakableSentence(text, {
    allowPartial: !isStreaming,
  });

  if (!firstSentence) {
    return prefix;
  }

  const firstEnd = text.indexOf(firstSentence) + firstSentence.length;

  if (prefix.length > firstEnd) {
    stopSpeaking();
    return text;
  }

  if (prefix.length >= firstEnd) {
    return text;
  }

  queueSpeak(firstSentence);
  return text;
}
