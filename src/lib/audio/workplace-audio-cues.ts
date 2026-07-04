import type { WorkplaceAudioCue } from "./workplace-audio-types";

/** Maps cue IDs to one or more asset variants (random pick at play time). */
export const WORKPLACE_AUDIO_CUES: Record<
  WorkplaceAudioCue,
  readonly string[]
> = {
  "footstep-staff": ["/audio/workplace/footsteps/footstep-1.wav"],
  "footstep-landing": ["/audio/workplace/footsteps/footstep-landing.wav"],
  "vocal-hmm": ["/audio/workplace/vocals/hmm-1.wav"],
  "vocal-gasp": ["/audio/workplace/vocals/gasp-1.wav"],
  "vocal-relief": ["/audio/workplace/vocals/relief-1.wav"],
  "cat-meow": ["/audio/workplace/cat/meow-2.wav"],
};

export const ALL_WORKPLACE_AUDIO_URLS = [
  ...new Set(Object.values(WORKPLACE_AUDIO_CUES).flat()),
];
