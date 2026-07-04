import { DEFAULT_GRADIUM_VOICE_ID } from "../constants";

export function getGradiumApiKey(): string {
  const apiKey = process.env.GRADIUM_API_KEY;

  if (!apiKey) {
    throw new Error("GRADIUM_API_KEY is not set");
  }

  return apiKey;
}

export function resolveSpeakerVoiceId(speakerId: string): string {
  const envKey = `GRADIUM_VOICE_${speakerId.toUpperCase().replace(/[^A-Z0-9]/g, "_")}`;
  const speakerVoice = process.env[envKey];

  if (speakerVoice) {
    return speakerVoice;
  }

  return process.env.GRADIUM_VOICE_ID ?? DEFAULT_GRADIUM_VOICE_ID;
}
