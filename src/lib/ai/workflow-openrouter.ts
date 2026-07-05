import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export function openrouter(modelId: string) {
  return async () => {
    "use step";

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is not set");
    }

    return await createOpenRouter({ apiKey })(modelId);
  };
}
