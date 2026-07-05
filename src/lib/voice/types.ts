export type VoiceInputState = "idle" | "listening" | "transcribing";

export interface VoiceTranscribeResult {
  durationMs: number;
  locale: string;
  text: string;
}

export interface VoiceSpeakRequest {
  locale?: string;
  speakerId: string;
  text: string;
}

export interface VoicePreferences {
  inputEnabled: boolean;
  locale: string;
  outputEnabled: boolean;
}

export const DEFAULT_VOICE_PREFERENCES: VoicePreferences = {
  inputEnabled: true,
  outputEnabled: true,
  locale: "en",
};
