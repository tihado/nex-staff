import { NextResponse } from "next/server";
import { getServerViewer } from "@/lib/viewer";
import { synthesizeWithGradium } from "@/lib/voice/server/synthesize";

interface SpeakRequestBody {
  locale?: string;
  speakerId?: string;
  text?: string;
}

export async function POST(req: Request) {
  const viewer = await getServerViewer();

  if (!viewer) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 }
    );
  }

  let body: SpeakRequestBody;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text = body.text?.trim();
  const speakerId = body.speakerId?.trim();

  if (!text) {
    return NextResponse.json({ error: "Text is required" }, { status: 400 });
  }

  if (!speakerId) {
    return NextResponse.json(
      { error: "speakerId is required" },
      { status: 400 }
    );
  }

  try {
    const result = await synthesizeWithGradium({
      text,
      speakerId,
      locale: body.locale,
    });

    return new NextResponse(new Uint8Array(result.audio), {
      status: 200,
      headers: {
        "Content-Type": result.contentType,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Speech synthesis failed";

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

    if (message === "Nothing to speak") {
      return NextResponse.json({ error: message }, { status: 422 });
    }

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
