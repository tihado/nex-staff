export const GRADIUM_API_BASE = "https://api.gradium.ai/api";

export const MAX_RECORDING_MS = 60_000;
export const MAX_SPEAK_CHARS = 500;

export const DEFAULT_GRADIUM_VOICE_ID = "YTpq7expH9539ERJ";

export const VOICE_PREFERENCES_STORAGE_KEY = "nex-staff-voice-preferences";

export const RECORDING_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
] as const;

export const GRADIUM_STT_CONTENT_TYPES = {
  wav: "audio/wav",
  webm: "audio/webm",
  ogg: "audio/ogg",
} as const;
