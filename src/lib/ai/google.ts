import { createGoogle, type GoogleProvider } from "@ai-sdk/google";

export const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash" as const;

let provider: GoogleProvider | undefined;

function getGoogleProvider(): GoogleProvider {
  if (!provider) {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set");
    }
    provider = createGoogle({ apiKey });
  }
  return provider;
}

export function getGeminiModel(modelId: string = DEFAULT_GEMINI_MODEL) {
  return getGoogleProvider()(modelId);
}
