import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

const GRADIUM_TTS_URL = "https://api.gradium.ai/api/post/speech/tts";
const DEFAULT_VOICE_ID = "YTpq7expH9539ERJ";
const OUT_DIR = join(process.cwd(), "public/audio/workplace/vocals");

interface VocalSpec {
  filename: string;
  jsonConfig: Record<string, number>;
  text: string;
}

const VOCALS: VocalSpec[] = [
  {
    filename: "hmm-1.wav",
    text: "hmm...",
    jsonConfig: { padding_bonus: 0.5, temp: 0.4 },
  },
  {
    filename: "gasp-1.wav",
    text: "oh!",
    jsonConfig: { padding_bonus: -1.5, temp: 0.9 },
  },
  {
    filename: "relief-1.wav",
    text: "phew",
    jsonConfig: { padding_bonus: 1.5, temp: 0.75 },
  },
];

async function synthesizeVocal(
  apiKey: string,
  spec: VocalSpec
): Promise<Buffer> {
  const response = await fetch(GRADIUM_TTS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      text: spec.text,
      voice_id: DEFAULT_VOICE_ID,
      output_format: "wav",
      only_audio: true,
      json_config: JSON.stringify(spec.jsonConfig),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Gradium TTS failed for ${spec.filename} (${response.status}): ${body}`
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function main() {
  const apiKey = process.env.GRADIUM_API_KEY;
  if (!apiKey) {
    throw new Error("GRADIUM_API_KEY is not set in .env");
  }

  mkdirSync(OUT_DIR, { recursive: true });

  for (const spec of VOCALS) {
    const wav = await synthesizeVocal(apiKey, spec);
    const outPath = join(OUT_DIR, spec.filename);
    writeFileSync(outPath, wav);
    console.log(`Wrote ${outPath} (${wav.length} bytes)`);
  }

  console.log("Done — workplace vocal clips generated.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
