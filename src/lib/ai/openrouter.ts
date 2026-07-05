import {
  createOpenRouter,
  type OpenRouterProvider,
} from "@openrouter/ai-sdk-provider";

let provider: OpenRouterProvider | undefined;

function getOpenRouterProvider(): OpenRouterProvider {
  if (!provider) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is not set");
    }
    provider = createOpenRouter({ apiKey });
  }
  return provider;
}

export function getOpenRouterModel(modelId: string) {
  return getOpenRouterProvider()(modelId);
}
