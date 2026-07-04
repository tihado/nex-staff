export type FootstepCue = "footstep-staff" | "footstep-landing";

export type VocalCue = "vocal-hmm" | "vocal-gasp" | "vocal-relief";

export type CatCue = "cat-meow";

export type WorkplaceAudioCue = FootstepCue | VocalCue | CatCue;

export interface PlayCueOptions {
  pitch?: number;
  volume?: number;
}

export interface WorkplaceAudioContextValue {
  enabled: boolean;
  playCue: (cue: WorkplaceAudioCue, options?: PlayCueOptions) => void;
  setEnabled: (enabled: boolean) => void;
  stopVocal: () => void;
  unlock: () => Promise<void>;
  unlocked: boolean;
}
