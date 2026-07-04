import { NextResponse } from "next/server";
import { getServerViewer } from "@/lib/viewer";
import {
  GRADIUM_STT_CONTENT_TYPES,
  MAX_RECORDING_MS,
} from "@/lib/voice/constants";
import { transcribeWithGradium } from "@/lib/voice/server/transcribe";

const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

function resolveContentType(mimeType: string): string | null {
  if (mimeType.includes("wav")) {
    return GRADIUM_STT_CONTENT_TYPES.wav;
  }

  if (mimeType.includes("ogg")) {
    return GRADIUM_STT_CONTENT_TYPES.ogg;
  }

  if (mimeType.includes("webm")) {
    return GRADIUM_STT_CONTENT_TYPES.webm;
  }

  return null;
}

export async function POST(req: Request) {
  const viewer = await getServerViewer();

  if (!viewer) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 }
    );
  }

  let formData: FormData;

  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const audioEntry = formData.get("audio");
  const audio = audioEntry instanceof File ? audioEntry : null;
  const locale = formData.get("locale");
  const durationRaw = formData.get("durationMs");

  if (!audio || audio.size === 0) {
    return NextResponse.json(
      { error: "Audio file is required" },
      { status: 400 }
    );
  }

  if (audio.size > MAX_AUDIO_BYTES) {
    return NextResponse.json(
      { error: "Audio file is too large" },
      { status: 413 }
    );
  }

  const contentType = resolveContentType(audio.type);

  if (!contentType) {
    return NextResponse.json(
      { error: "Unsupported audio format. Use WAV, WebM, or Ogg." },
      { status: 415 }
    );
  }

  const parsedDuration = Number(durationRaw);
  const durationMs =
    Number.isFinite(parsedDuration) && parsedDuration > 0
      ? Math.min(parsedDuration, MAX_RECORDING_MS)
      : MAX_RECORDING_MS;

  try {
    const buffer = Buffer.from(await audio.arrayBuffer());
    const result = await transcribeWithGradium({
      audio: buffer,
      contentType,
      durationMs,
      locale: typeof locale === "string" && locale ? locale : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Transcription failed";

    if (message.includes("GRADIUM_API_KEY")) {
      return NextResponse.json(
        {
          error: {
            code: "VOICE_UNAVAILABLE",
            message: "Voice service unavailable",
          },
        },
        { status: 503 }
      );
    }

    if (message === "No speech detected") {
      return NextResponse.json({ error: message }, { status: 422 });
    }

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
