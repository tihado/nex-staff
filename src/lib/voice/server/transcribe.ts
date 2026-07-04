import { GRADIUM_API_BASE } from "../constants";
import type { VoiceTranscribeResult } from "../types";
import { getGradiumApiKey } from "./gradium-config";

interface GradiumSttMessage {
  text?: string;
  type: string;
}

function parseNdjsonTranscript(body: string): string {
  const segments: string[] = [];

  for (const line of body.split("\n")) {
    const trimmed = line.trim();

    if (!trimmed) {
      continue;
    }

    try {
      const message = JSON.parse(trimmed) as GradiumSttMessage;

      if (message.type === "text" && message.text) {
        segments.push(message.text);
      }
    } catch {
      // Skip malformed lines from the stream.
    }
  }

  return segments.join(" ").trim();
}

export async function transcribeWithGradium(options: {
  audio: Buffer;
  contentType: string;
  durationMs: number;
  locale?: string;
}): Promise<VoiceTranscribeResult> {
  const apiKey = getGradiumApiKey();
  const locale = options.locale ?? "en";
  const jsonConfig = encodeURIComponent(JSON.stringify({ language: locale }));

  const response = await fetch(
    `${GRADIUM_API_BASE}/post/speech/asr?json_config=${jsonConfig}`,
    {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": options.contentType,
      },
      body: new Uint8Array(options.audio),
    }
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      detail
        ? `Gradium STT failed (${response.status}): ${detail.slice(0, 200)}`
        : `Gradium STT failed (${response.status})`
    );
  }

  const body = await response.text();
  const text = parseNdjsonTranscript(body);

  if (!text) {
    throw new Error("No speech detected");
  }

  return {
    text,
    durationMs: options.durationMs,
    locale,
  };
}
