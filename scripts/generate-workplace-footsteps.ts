import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SAMPLE_RATE = 22_050;
const OUT_DIR = join(process.cwd(), "public/audio/workplace/footsteps");

interface ToneSpec {
  amplitude: number;
  decay: number;
  durationSec: number;
  filename: string;
  frequency: number;
  noiseMix: number;
}

const FOOTSTEPS: ToneSpec[] = [
  {
    filename: "footstep-1.wav",
    durationSec: 0.08,
    frequency: 110,
    noiseMix: 0.35,
    decay: 18,
    amplitude: 0.55,
  },
  {
    filename: "footstep-landing.wav",
    durationSec: 0.1,
    frequency: 85,
    noiseMix: 0.45,
    decay: 14,
    amplitude: 0.48,
  },
];

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12_989.9898) * 43_758.5453;
  return x - Math.floor(x);
}

function synthesize(spec: ToneSpec): Float32Array {
  const sampleCount = Math.max(1, Math.round(spec.durationSec * SAMPLE_RATE));
  const samples = new Float32Array(sampleCount);

  for (let i = 0; i < sampleCount; i += 1) {
    const t = i / SAMPLE_RATE;
    const envelope = Math.exp(-spec.decay * t);
    const tone = Math.sin(2 * Math.PI * spec.frequency * t);
    const noise = pseudoRandom(i * 17 + spec.frequency) * 2 - 1;
    const mixed = tone * (1 - spec.noiseMix) + noise * spec.noiseMix;
    samples[i] = mixed * envelope * spec.amplitude;
  }

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

  for (const spec of FOOTSTEPS) {
    const wav = encodeWav(synthesize(spec));
    const outPath = join(OUT_DIR, spec.filename);
    writeFileSync(outPath, wav);
    console.log(`Wrote ${outPath} (${wav.length} bytes)`);
  }
}

main();
