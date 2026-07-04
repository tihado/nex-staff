import { GRADIUM_API_BASE, MAX_SPEAK_CHARS } from "../constants";
import { stripMarkdownForSpeech } from "../strip-markdown";
import { getGradiumApiKey, resolveSpeakerVoiceId } from "./gradium-config";

export interface SynthesizeSpeechResult {
  audio: Buffer;
  contentType: string;
}

export async function synthesizeWithGradium(options: {
  locale?: string;
  speakerId: string;
  text: string;
}): Promise<SynthesizeSpeechResult> {
  const apiKey = getGradiumApiKey();
  const plainText = stripMarkdownForSpeech(options.text).slice(
    0,
    MAX_SPEAK_CHARS
  );

  if (!plainText) {
    throw new Error("Nothing to speak");
  }

  const voiceId = resolveSpeakerVoiceId(options.speakerId);

  const response = await fetch(`${GRADIUM_API_BASE}/post/speech/tts`, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: plainText,
      voice_id: voiceId,
      output_format: "wav",
      only_audio: true,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      detail
        ? `Gradium TTS failed (${response.status}): ${detail.slice(0, 200)}`
        : `Gradium TTS failed (${response.status})`
    );
  }

  const contentType = response.headers.get("content-type") ?? "audio/wav";
  const arrayBuffer = await response.arrayBuffer();

  return {
    audio: Buffer.from(arrayBuffer),
    contentType,
  };
}
