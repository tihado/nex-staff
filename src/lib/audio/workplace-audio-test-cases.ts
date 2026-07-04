import type {
  PlayCueOptions,
  WorkplaceAudioCue,
} from "./workplace-audio-types";

export interface AudioTestStep {
  cue: WorkplaceAudioCue;
  delayMs: number;
  label?: string;
  volume?: number;
}

export interface AudioTestCase {
  description: string;
  id: string;
  label: string;
  steps: AudioTestStep[];
}

type PlayCueFn = (cue: WorkplaceAudioCue, options?: PlayCueOptions) => void;

function buildWalkSteps(options: {
  durationMs: number;
  includeLanding?: boolean;
  intervalMs: number;
  stepCue: "footstep-staff";
}): AudioTestStep[] {
  const { durationMs, includeLanding = true, intervalMs, stepCue } = options;
  const steps: AudioTestStep[] = [];

  for (let delayMs = 0; delayMs < durationMs; delayMs += intervalMs) {
    steps.push({
      cue: stepCue,
      delayMs,
      label: `${stepCue} @ ${delayMs}ms`,
      volume: 0.3,
    });
  }

  if (includeLanding) {
    steps.push({
      cue: "footstep-landing",
      delayMs: durationMs,
      label: "landing",
      volume: 0.25,
    });
  }

  return steps;
}

/** Scripted scenarios mirroring in-game animation triggers. */
export const WORKPLACE_AUDIO_TEST_CASES: AudioTestCase[] = [
  {
    id: "staff-walk-short",
    label: "Staff đi bộ (2s)",
    description:
      "Giả lập agent-walk-bob 500ms — footstep mỗi 250ms, kết thúc bằng landing.",
    steps: buildWalkSteps({
      stepCue: "footstep-staff",
      intervalMs: 250,
      durationMs: 2000,
    }),
  },
  {
    id: "staff-walk-long",
    label: "Staff đi xa (4.5s)",
    description: "Quãng đi dài hơn (tương đương distance ~40% trên floor).",
    steps: buildWalkSteps({
      stepCue: "footstep-staff",
      intervalMs: 250,
      durationMs: 4500,
    }),
  },
  {
    id: "cat-walk",
    label: "Mèo meooo (ngẫu nhiên)",
    description: "meow-2.wav — 25% mỗi lần mèo bắt đầu đi.",
    steps: [{ cue: "cat-meow", delayMs: 0, label: "meooo", volume: 0.44 }],
  },
  {
    id: "pantry-arrival",
    label: "Đến pantry (task xong)",
    description: "Walk 2.5s → landing → relief vocal sau 400ms (notify flow).",
    steps: [
      ...buildWalkSteps({
        stepCue: "footstep-staff",
        intervalMs: 250,
        durationMs: 2500,
        includeLanding: true,
      }),
      {
        cue: "vocal-relief",
        delayMs: 2900,
        label: "relief after arrival",
        volume: 0.45,
      },
    ],
  },
  {
    id: "task-progress-emotes",
    label: "Task đang chạy",
    description: "thinking (hmm) → progress 60% (gasp) như deriveAgent.",
    steps: [
      { cue: "vocal-hmm", delayMs: 0, label: "emote: thinking" },
      { cue: "vocal-gasp", delayMs: 1800, label: "emote: idea" },
    ],
  },
  {
    id: "idle-roam-walk",
    label: "Idle roam (bước chân)",
    description:
      "Nhân viên không task — ~70% cơ hội đi, kèm footstep sync agent-walk-bob.",
    steps: buildWalkSteps({
      stepCue: "footstep-staff",
      intervalMs: 250,
      durationMs: 3200,
      includeLanding: true,
    }),
  },
  {
    id: "idle-roam-landing",
    label: "Idle roam dừng",
    description: "Landing footstep khi dừng đi (không vocal).",
    steps: [{ cue: "footstep-landing", delayMs: 0, volume: 0.25 }],
  },
  {
    id: "polyphony-stress",
    label: "Polyphony cap (4 agents)",
    description:
      "4 footstep cùng lúc — engine chỉ phát tối đa 2 (MAX_CONCURRENT_FOOTSTEPS).",
    steps: [
      { cue: "footstep-staff", delayMs: 0, volume: 0.35 },
      { cue: "footstep-staff", delayMs: 0, volume: 0.35 },
      { cue: "footstep-staff", delayMs: 0, volume: 0.35 },
      { cue: "footstep-staff", delayMs: 0, volume: 0.35 },
      { cue: "footstep-staff", delayMs: 250, volume: 0.35 },
      { cue: "footstep-staff", delayMs: 250, volume: 0.35 },
    ],
  },
  {
    id: "all-vocals",
    label: "Tất cả vocal cues",
    description: "Phát lần lượt hmm, gasp, relief (Gradium pre-gen).",
    steps: [
      { cue: "vocal-hmm", delayMs: 0 },
      { cue: "vocal-gasp", delayMs: 2200 },
      { cue: "vocal-relief", delayMs: 4400 },
    ],
  },
];

export const WORKPLACE_AUDIO_CUE_BUTTONS: {
  cue: WorkplaceAudioCue;
  label: string;
}[] = [
  { cue: "footstep-staff", label: "Footstep" },
  { cue: "footstep-landing", label: "Landing" },
  { cue: "cat-meow", label: "Meooo" },
  { cue: "vocal-hmm", label: "Hmm" },
  { cue: "vocal-gasp", label: "Gasp" },
  { cue: "vocal-relief", label: "Relief" },
];

export function runAudioTestCase(
  testCase: AudioTestCase,
  playCue: PlayCueFn
): () => void {
  const timeouts: ReturnType<typeof setTimeout>[] = [];

  for (const step of testCase.steps) {
    timeouts.push(
      setTimeout(() => {
        playCue(step.cue, { volume: step.volume });
      }, step.delayMs)
    );
  }

  return () => {
    for (const timeout of timeouts) {
      clearTimeout(timeout);
    }
  };
}

export function getTestCaseDurationMs(testCase: AudioTestCase): number {
  let max = 0;
  for (const step of testCase.steps) {
    max = Math.max(max, step.delayMs);
  }
  return max + 800;
}
