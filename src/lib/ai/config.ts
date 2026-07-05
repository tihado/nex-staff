export type LlmProvider = "google" | "openrouter";

export function getLlmProvider(): LlmProvider {
  return process.env.LLM_PROVIDER === "openrouter" ? "openrouter" : "google";
}

export const DEFAULT_OPENROUTER_MODEL =
  process.env.OPENROUTER_DEFAULT_MODEL ?? "google/gemini-2.5-flash";
