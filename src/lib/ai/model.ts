import { google as workflowGoogle } from "@workflow/ai/google";
import type { LanguageModel } from "ai";
import { DEFAULT_OPENROUTER_MODEL, getLlmProvider } from "@/lib/ai/config";
import { DEFAULT_GEMINI_MODEL, getGeminiModel } from "@/lib/ai/google";
import { getOpenRouterModel } from "@/lib/ai/openrouter";
import { openrouter as workflowOpenRouter } from "@/lib/ai/workflow-openrouter";

export const DEFAULT_LLM_MODEL =
  getLlmProvider() === "openrouter"
    ? DEFAULT_OPENROUTER_MODEL
    : DEFAULT_GEMINI_MODEL;

function resolveModelId(modelId?: string | null): string {
  const provider = getLlmProvider();

  if (modelId) {
    if (provider === "openrouter" && !modelId.includes("/")) {
      return `google/${modelId}`;
    }
    return modelId;
  }

  return DEFAULT_LLM_MODEL;
}

export function getLanguageModel(modelId?: string | null): LanguageModel {
  const resolved = resolveModelId(modelId);

  if (getLlmProvider() === "openrouter") {
    return getOpenRouterModel(resolved);
  }

  return getGeminiModel(resolved);
}

export function getWorkflowLanguageModel(modelId?: string | null) {
  const resolved = resolveModelId(modelId);

  if (getLlmProvider() === "openrouter") {
    return workflowOpenRouter(resolved);
  }

  return workflowGoogle(resolved);
}
