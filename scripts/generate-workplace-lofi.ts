import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SAMPLE_RATE = 22_050;
const BPM = 72;
const BEAT_SEC = 60 / BPM;
const BAR_SEC = BEAT_SEC * 4;
const BARS = 16;
const DURATION_SEC = BAR_SEC * BARS;
const OUT_DIR = join(process.cwd(), "public/audio/workplace/music");
const OUT_FILE = "lofi-jazz-loop.wav";

/** ii–V–I–vi in C — mellow jazz for focus. */
const CHORD_PROGRESSION: { bass: number; notes: number[] }[] = [
  { bass: 50, notes: [62, 65, 69, 72] }, // Dm7
  { bass: 50, notes: [62, 65, 69, 72] },
  { bass: 55, notes: [55, 59, 62, 65] }, // G7
  { bass: 55, notes: [55, 59, 62, 65] },
  { bass: 48, notes: [60, 64, 67, 71] }, // Cmaj7
  { bass: 48, notes: [60, 64, 67, 71] },
  { bass: 45, notes: [57, 60, 64, 67] }, // Am7
  { bass: 45, notes: [57, 60, 64, 67] },
];

function midiToFreq(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12_989.9898) * 43_758.5453;
  return x - Math.floor(x);
}

function addPluck(
  samples: Float32Array,
  startSec: number,
  freq: number,
  durationSec: number,
  velocity: number
): void {
  const startSample = Math.floor(startSec * SAMPLE_RATE);
  const length = Math.floor(durationSec * SAMPLE_RATE);

  for (let i = 0; i < length; i += 1) {
    const idx = startSample + i;
    if (idx >= samples.length) {
      break;
    }

    const t = i / SAMPLE_RATE;
    const attack = 1 - Math.exp(-35 * t);
    const decay = Math.exp(-3.2 * t);
    const env = attack * decay;
    const tone =
      Math.sin(2 * Math.PI * freq * t) * 0.68 +
      Math.sin(2 * Math.PI * freq * 2 * t) * 0.22 +
      Math.sin(2 * Math.PI * freq * 3 * t) * 0.08;

    samples[idx] += tone * env * velocity;
  }
}

function addBassNote(
  samples: Float32Array,
  startSec: number,
  freq: number,
  durationSec: number,
  velocity: number
): void {
  const startSample = Math.floor(startSec * SAMPLE_RATE);
  const length = Math.floor(durationSec * SAMPLE_RATE);

  for (let i = 0; i < length; i += 1) {
    const idx = startSample + i;
    if (idx >= samples.length) {
      break;
    }

    const t = i / SAMPLE_RATE;
    const env = (1 - Math.exp(-18 * t)) * Math.exp(-1.4 * t);
    const tone =
      Math.sin(2 * Math.PI * freq * t) * 0.85 +
      Math.sin(2 * Math.PI * freq * 0.5 * t) * 0.15;

    samples[idx] += tone * env * velocity;
  }
}

function addKick(
  samples: Float32Array,
  startSec: number,
  velocity: number
): void {
  const startSample = Math.floor(startSec * SAMPLE_RATE);
  const length = Math.floor(0.14 * SAMPLE_RATE);

  for (let i = 0; i < length; i += 1) {
    const idx = startSample + i;
    if (idx >= samples.length) {
      break;
    }

    const t = i / SAMPLE_RATE;
    const pitch = 95 * Math.exp(-18 * t) + 48;
    const env = Math.exp(-14 * t);
    samples[idx] += Math.sin(2 * Math.PI * pitch * t) * env * velocity;
  }
}

function addBrushSnare(
  samples: Float32Array,
  startSec: number,
  velocity: number
): void {
  const startSample = Math.floor(startSec * SAMPLE_RATE);
  const length = Math.floor(0.09 * SAMPLE_RATE);

  for (let i = 0; i < length; i += 1) {
    const idx = startSample + i;
    if (idx >= samples.length) {
      break;
    }

    const t = i / SAMPLE_RATE;
    const env = Math.exp(-28 * t);
    const noise = pseudoRandom(idx * 13 + 7) * 2 - 1;
    const tone = Math.sin(2 * Math.PI * 180 * t) * 0.35;
    samples[idx] += (noise * 0.65 + tone) * env * velocity;
  }
}

function addHiHat(
  samples: Float32Array,
  startSec: number,
  velocity: number
): void {
  const startSample = Math.floor(startSec * SAMPLE_RATE);
  const length = Math.floor(0.035 * SAMPLE_RATE);

  for (let i = 0; i < length; i += 1) {
    const idx = startSample + i;
    if (idx >= samples.length) {
      break;
    }

    const t = i / SAMPLE_RATE;
    const env = Math.exp(-55 * t);
    const noise = pseudoRandom(idx * 29 + 3) * 2 - 1;
    samples[idx] += noise * env * velocity;
  }
}

function applyLofiMix(samples: Float32Array): void {
  let prev = 0;
  const lpfAlpha = 0.22;

  for (let i = 0; i < samples.length; i += 1) {
    const vinyl = (pseudoRandom(i * 5 + 1) * 2 - 1) * 0.0025;
    const mixed = samples[i] + vinyl;
    const filtered = prev + lpfAlpha * (mixed - prev);
    prev = filtered;
    samples[i] = filtered * 0.92;
  }
}

function normalize(samples: Float32Array, peak = 0.88): void {
  let max = 0;
  for (const sample of samples) {
    max = Math.max(max, Math.abs(sample));
  }

  if (max <= 0) {
    return;
  }

  const scale = peak / max;
  for (let i = 0; i < samples.length; i += 1) {
    samples[i] *= scale;
  }
}

function synthesizeBar(samples: Float32Array, bar: number): void {
  const barStart = bar * BAR_SEC;
  const chord =
    CHORD_PROGRESSION[bar % CHORD_PROGRESSION.length] ?? CHORD_PROGRESSION[0];

  addBassNote(samples, barStart, midiToFreq(chord.bass), BEAT_SEC * 1.9, 0.22);
  addBassNote(
    samples,
    barStart + BEAT_SEC * 2,
    midiToFreq(chord.bass + (bar % 2 === 0 ? 7 : 4)),
    BEAT_SEC * 1.7,
    0.16
  );

  const compHits = [0, 1.5, 2.5, 3.25];
  const compVelocities = [0.11, 0.07, 0.09, 0.06];

  for (let hit = 0; hit < compHits.length; hit += 1) {
    const hitSec = barStart + compHits[hit] * BEAT_SEC;
    const velocity = compVelocities[hit] ?? 0.08;

    for (const note of chord.notes) {
      addPluck(
        samples,
        hitSec,
        midiToFreq(note),
        0.55,
        velocity / chord.notes.length
      );
    }
  }

  for (let beat = 0; beat < 4; beat += 1) {
    const beatSec = barStart + beat * BEAT_SEC;

    if (beat === 0 || beat === 2) {
      addKick(samples, beatSec, beat === 0 ? 0.2 : 0.14);
    }

    if (beat === 1 || beat === 3) {
      addBrushSnare(samples, beatSec, 0.09);
    }

    addHiHat(samples, beatSec, 0.025);
    addHiHat(samples, beatSec + BEAT_SEC * 0.5, 0.018);
  }
}

function synthesize(): Float32Array {
  const sampleCount = Math.floor(DURATION_SEC * SAMPLE_RATE);
  const samples = new Float32Array(sampleCount);

  for (let bar = 0; bar < BARS; bar += 1) {
    synthesizeBar(samples, bar);
  }

  applyLofiMix(samples);
  normalize(samples);
  return samples;
}

function encodeWav(samples: Float32Array): Buffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = SAMPLE_RATE * blockAlign;
  const dataSize = samples.length * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (const sample of samples) {
    const clamped = Math.max(-1, Math.min(1, sample));
    buffer.writeInt16LE(Math.round(clamped * 32_767), offset);
    offset += 2;
  }

  return buffer;
}

function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const wav = encodeWav(synthesize());
  const outPath = join(OUT_DIR, OUT_FILE);
  writeFileSync(outPath, wav);

  console.log(
    `Wrote ${outPath} (${wav.length} bytes, ${DURATION_SEC.toFixed(1)}s @ ${BPM} BPM)`
  );
}

main();
