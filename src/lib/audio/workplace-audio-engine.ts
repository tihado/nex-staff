import {
  ALL_WORKPLACE_AUDIO_URLS,
  WORKPLACE_AUDIO_CUES,
} from "./workplace-audio-cues";
import type {
  PlayCueOptions,
  WorkplaceAudioCue,
} from "./workplace-audio-types";
import {
  WORKPLACE_LOFI_FADE_IN_SEC,
  WORKPLACE_LOFI_FADE_OUT_SEC,
  WORKPLACE_LOFI_MUSIC_URL,
  WORKPLACE_LOFI_MUSIC_VOLUME,
} from "./workplace-music-config";

const MAX_CONCURRENT_FOOTSTEPS = 4;
const FOOTSTEP_CUES = new Set<WorkplaceAudioCue>([
  "footstep-staff",
  "footstep-landing",
]);

const VOCAL_CUES = new Set<WorkplaceAudioCue>([
  "vocal-hmm",
  "vocal-gasp",
  "vocal-relief",
]);

const CAT_CUES = new Set<WorkplaceAudioCue>(["cat-meow"]);

function pickVariant(cue: WorkplaceAudioCue): string {
  const variants = WORKPLACE_AUDIO_CUES[cue];
  return variants[Math.floor(Math.random() * variants.length)] ?? variants[0];
}

function randomPitch(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** Procedural chiptune thud when WAV assets are missing. */
function playProceduralFootstep(
  context: AudioContext,
  masterGain: GainNode,
  volume: number,
  pitch: number
): void {
  const durationSec = 0.07;
  const sampleRate = context.sampleRate;
  const length = Math.floor(sampleRate * durationSec);
  const buffer = context.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i += 1) {
    const t = i / sampleRate;
    const envelope = Math.exp(-22 * t);
    const tone = Math.sin(2 * Math.PI * 110 * pitch * t);
    const noise = Math.random() * 2 - 1;
    data[i] = (tone * 0.65 + noise * 0.35) * envelope * volume;
  }

  const source = context.createBufferSource();
  source.buffer = buffer;
  source.connect(masterGain);
  source.start();
}

/** Procedural long "meooo" when WAV assets are missing or still loading. */
function playProceduralMeow(
  context: AudioContext,
  masterGain: GainNode,
  volume: number,
  pitch: number
): void {
  const durationSec = 0.62;
  const sampleRate = context.sampleRate;
  const length = Math.floor(sampleRate * durationSec);
  const buffer = context.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i += 1) {
    const t = i / sampleRate;
    const progress = t / durationSec;
    const mBurst =
      progress < 0.06 ? Math.exp(-90 * t) * (Math.random() * 2 - 1) * 0.5 : 0;
    const vowelProgress = Math.max(0, Math.min(1, (progress - 0.05) / 0.7));
    const attack = Math.min(1, Math.max(0, (progress - 0.05) / 0.05));
    const sustain = progress < 0.72 ? 1 : Math.exp(-8 * (progress - 0.72));
    const envelope = attack * sustain;
    const eToO = vowelProgress ** 1.35;
    const glide = (760 - 420 * eToO) * pitch;
    const tone = Math.sin(2 * Math.PI * glide * t);
    const overtone = Math.sin(2 * Math.PI * glide * 1.65 * t) * 0.22;
    const oTail = Math.sin(2 * Math.PI * glide * 0.55 * t) * 0.18 * eToO;
    data[i] = (mBurst + (tone + overtone + oTail) * envelope) * volume;
  }

  const source = context.createBufferSource();
  source.buffer = buffer;
  source.connect(masterGain);
  source.start();
}

function defaultPitchForCue(isFootstep: boolean, isCat: boolean): number {
  if (isFootstep) {
    return randomPitch(0.92, 1.08);
  }
  if (isCat) {
    return randomPitch(0.94, 1.06);
  }
  return randomPitch(0.96, 1.04);
}

function defaultVolumeForCue(isFootstep: boolean, isCat: boolean): number {
  if (isFootstep) {
    return 0.35;
  }
  if (isCat) {
    return 0.42;
  }
  return 0.5;
}

export class WorkplaceAudioEngine {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private readonly buffers = new Map<string, AudioBuffer>();
  private loadPromise: Promise<void> | null = null;
  private activeFootsteps = 0;
  private activeVocal: AudioBufferSourceNode | null = null;
  private musicElement: HTMLAudioElement | null = null;
  private musicFadeFrame: number | null = null;
  private sfxEnabled = false;
  private musicEnabled = false;
  private readonly masterVolume = 0.55;

  setSfxEnabled(enabled: boolean): void {
    this.sfxEnabled = enabled;
  }

  setMusicEnabled(enabled: boolean): void {
    const wasEnabled = this.musicEnabled;
    this.musicEnabled = enabled;

    if (!enabled) {
      this.stopBackgroundMusic();
      return;
    }

    if (!wasEnabled) {
      this.startBackgroundMusic().catch(() => undefined);
    }
  }

  isSfxEnabled(): boolean {
    return this.sfxEnabled;
  }

  isMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  isUnlocked(): boolean {
    return this.context?.state === "running";
  }

  async unlock(): Promise<void> {
    if (typeof window === "undefined") {
      return;
    }

    if (!this.context) {
      this.context = new AudioContext();
      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = this.masterVolume;
      this.masterGain.connect(this.context.destination);
    }

    if (this.context.state === "suspended") {
      await this.context.resume();
    }

    await this.ensureBuffersLoaded();

    if (this.musicEnabled) {
      await this.startBackgroundMusic();
    }
  }

  /** Start music synchronously inside a click/key handler (keeps user activation). */
  primeBackgroundMusicFromGesture(): void {
    if (typeof window === "undefined") {
      return;
    }

    const element = this.getMusicElement();
    element.volume = 0;

    element
      .play()
      .then(() => {
        this.fadeMusicVolumeTo(
          WORKPLACE_LOFI_MUSIC_VOLUME,
          WORKPLACE_LOFI_FADE_IN_SEC
        );
      })
      .catch(() => undefined);
  }

  async startBackgroundMusic(): Promise<void> {
    if (!this.musicEnabled || typeof window === "undefined") {
      return;
    }

    const element = this.getMusicElement();

    if (!element.paused) {
      if (element.volume < WORKPLACE_LOFI_MUSIC_VOLUME * 0.4) {
        this.fadeMusicVolumeTo(
          WORKPLACE_LOFI_MUSIC_VOLUME,
          WORKPLACE_LOFI_FADE_IN_SEC
        );
      }
      return;
    }

    element.volume = 0;

    try {
      await element.play();
      this.fadeMusicVolumeTo(
        WORKPLACE_LOFI_MUSIC_VOLUME,
        WORKPLACE_LOFI_FADE_IN_SEC
      );
    } catch {
      // Browser blocked playback until the next user gesture.
    }
  }

  stopBackgroundMusic(): void {
    this.cancelMusicFade();

    const element = this.musicElement;
    if (!element || element.paused) {
      if (element) {
        element.volume = 0;
      }
      return;
    }

    const startVolume = element.volume;
    const startedAt = performance.now();
    const durationMs = WORKPLACE_LOFI_FADE_OUT_SEC * 1000;

    const step = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / durationMs);
      element.volume = startVolume * (1 - progress);

      if (progress < 1) {
        this.musicFadeFrame = requestAnimationFrame(step);
        return;
      }

      element.pause();
      element.currentTime = 0;
      element.volume = 0;
      this.musicFadeFrame = null;
    };

    this.musicFadeFrame = requestAnimationFrame(step);
  }

  private getMusicElement(): HTMLAudioElement {
    if (!this.musicElement) {
      this.musicElement = new Audio(WORKPLACE_LOFI_MUSIC_URL);
      this.musicElement.loop = true;
      this.musicElement.preload = "auto";
    }

    return this.musicElement;
  }

  private cancelMusicFade(): void {
    if (this.musicFadeFrame !== null) {
      cancelAnimationFrame(this.musicFadeFrame);
      this.musicFadeFrame = null;
    }
  }

  private fadeMusicVolumeTo(target: number, durationSec: number): void {
    const element = this.musicElement;
    if (!element) {
      return;
    }

    this.cancelMusicFade();

    const startVolume = element.volume;
    const startedAt = performance.now();
    const durationMs = durationSec * 1000;

    const step = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / durationMs);
      element.volume = startVolume + (target - startVolume) * progress;

      if (progress < 1) {
        this.musicFadeFrame = requestAnimationFrame(step);
        return;
      }

      element.volume = target;
      this.musicFadeFrame = null;
    };

    this.musicFadeFrame = requestAnimationFrame(step);
  }

  stopVocal(): void {
    if (!this.activeVocal) {
      return;
    }

    try {
      this.activeVocal.stop();
    } catch {
      // Already stopped.
    }
    this.activeVocal.disconnect();
    this.activeVocal = null;
  }

  private async ensureBuffersLoaded(): Promise<void> {
    if (!this.context) {
      return;
    }

    if (this.loadPromise) {
      await this.loadPromise;
      return;
    }

    this.loadPromise = (async () => {
      const ctx = this.context;
      if (!ctx) {
        return;
      }

      await Promise.all(
        ALL_WORKPLACE_AUDIO_URLS.map(async (url) => {
          if (this.buffers.has(url)) {
            return;
          }

          try {
            const response = await fetch(url, { credentials: "same-origin" });
            if (!response.ok) {
              return;
            }
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
            this.buffers.set(url, audioBuffer);
          } catch {
            // Missing assets should not break the workspace.
          }
        })
      );
    })();

    await this.loadPromise;
  }

  playCue(cue: WorkplaceAudioCue, options: PlayCueOptions = {}): void {
    if (!(this.sfxEnabled && this.context && this.masterGain)) {
      return;
    }

    if (this.context.state !== "running") {
      return;
    }

    const isFootstep = FOOTSTEP_CUES.has(cue);
    const isVocal = VOCAL_CUES.has(cue);
    const isCat = CAT_CUES.has(cue);

    if (isVocal) {
      this.stopVocal();
    }
    if (isFootstep && this.activeFootsteps >= MAX_CONCURRENT_FOOTSTEPS) {
      return;
    }

    const url = pickVariant(cue);
    const buffer = this.buffers.get(url);
    const pitch = options.pitch ?? defaultPitchForCue(isFootstep, isCat);
    const volume = options.volume ?? defaultVolumeForCue(isFootstep, isCat);

    if (!buffer) {
      this.playCueFallback(cue, {
        isCat,
        isFootstep,
        options,
        pitch,
        url,
        volume,
      });
      return;
    }

    this.playBufferedCue({
      buffer,
      isFootstep,
      isVocal,
      pitch,
      volume,
    });
  }

  private playCueFallback(
    cue: WorkplaceAudioCue,
    args: {
      isCat: boolean;
      isFootstep: boolean;
      options: PlayCueOptions;
      pitch: number;
      url: string;
      volume: number;
    }
  ): void {
    const { isCat, isFootstep, options, pitch, url, volume } = args;

    if (!(this.context && this.masterGain)) {
      return;
    }

    if (isFootstep) {
      if (this.activeFootsteps >= MAX_CONCURRENT_FOOTSTEPS) {
        return;
      }
      this.activeFootsteps += 1;
      playProceduralFootstep(this.context, this.masterGain, volume, pitch);
      setTimeout(() => {
        this.activeFootsteps = Math.max(0, this.activeFootsteps - 1);
      }, 80);
      return;
    }

    if (isCat) {
      playProceduralMeow(this.context, this.masterGain, volume, pitch);
      return;
    }

    if (this.loadPromise) {
      this.loadPromise
        .then(() => {
          if (
            this.sfxEnabled &&
            this.context?.state === "running" &&
            this.buffers.has(url)
          ) {
            this.playCue(cue, options);
          }
        })
        .catch(() => undefined);
    }
  }

  private playBufferedCue(args: {
    buffer: AudioBuffer;
    isFootstep: boolean;
    isVocal: boolean;
    pitch: number;
    volume: number;
  }): void {
    const { buffer, isFootstep, isVocal, pitch, volume } = args;

    if (!(this.context && this.masterGain)) {
      return;
    }

    const source = this.context.createBufferSource();
    const gain = this.context.createGain();

    source.buffer = buffer;
    source.playbackRate.value = isVocal ? pitch * 1.12 : pitch;
    gain.gain.value = volume;

    source.connect(gain);
    gain.connect(this.masterGain);
    source.start();

    if (isVocal) {
      this.activeVocal = source;
      source.onended = () => {
        if (this.activeVocal === source) {
          this.activeVocal = null;
        }
      };
    }

    if (isFootstep) {
      this.activeFootsteps += 1;
      source.onended = () => {
        this.activeFootsteps = Math.max(0, this.activeFootsteps - 1);
      };
    }
  }
}

let engineSingleton: WorkplaceAudioEngine | null = null;

export function getWorkplaceAudioEngine(): WorkplaceAudioEngine {
  if (!engineSingleton) {
    engineSingleton = new WorkplaceAudioEngine();
  }
  return engineSingleton;
}
