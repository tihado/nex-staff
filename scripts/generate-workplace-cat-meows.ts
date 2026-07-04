import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT_DIR = join(process.cwd(), "public/audio/workplace/cat");
const TMP_DIR = join(process.cwd(), ".tmp/cat-meow-src");

/** CC0 realistic cat meow — Micro Pack, cc0-sounds.exi.software */
const CC0_SOURCE = {
  filename: "meow-2.wav",
  url: "https://cc0-sounds.exi.software/sounds/Micro%20Pack%20-%20Cat%20Meows/Cat%20Meows%20-%20Food%20Time%207.wav",
  label: "Food Time 7 (medium meow)",
} as const;

function requireFfmpeg(): void {
  try {
    execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
  } catch {
    throw new Error(
      "ffmpeg is required to process cat meow clips. Install ffmpeg and re-run pnpm audio:generate-cat-meows"
    );
  }
}

async function download(url: string, dest: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url} (${response.status})`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  writeFileSync(dest, buffer);
}

function processClip(sourcePath: string, destPath: string): void {
  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-i",
      sourcePath,
      "-af",
      [
        "silenceremove=start_periods=1:start_silence=0.015:start_threshold=-42dB",
        "areverse",
        "silenceremove=start_periods=1:start_silence=0.015:start_threshold=-42dB",
        "areverse",
        "highpass=f=120",
        "lowpass=f=9000",
        "loudnorm=I=-18:TP=-2:LRA=9",
      ].join(","),
      "-ar",
      "22050",
      "-ac",
      "1",
      "-sample_fmt",
      "s16",
      destPath,
    ],
    { stdio: "pipe" }
  );
}

async function main() {
  requireFfmpeg();
  mkdirSync(OUT_DIR, { recursive: true });
  mkdirSync(TMP_DIR, { recursive: true });

  const rawPath = join(TMP_DIR, "meow-2-raw.wav");
  const outPath = join(OUT_DIR, CC0_SOURCE.filename);

  console.log(`Downloading ${CC0_SOURCE.label}…`);
  await download(CC0_SOURCE.url, rawPath);

  console.log(`Processing ${CC0_SOURCE.filename}…`);
  processClip(rawPath, outPath);

  const { size } = await import("node:fs/promises").then((fs) =>
    fs.stat(outPath)
  );
  console.log(`Wrote ${outPath} (${size} bytes)`);

  rmSync(TMP_DIR, { recursive: true, force: true });
  console.log("Done — cat meow clip ready.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
