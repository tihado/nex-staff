import { type InferAgentUIMessage, ToolLoopAgent } from "ai";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { assistant } from "@/db/schema";
import { getGeminiModel } from "@/lib/ai/google";
import { DEFAULT_ASSISTANT_CONFIG } from "@/lib/assistant-defaults";

export interface AssistantRuntimeContext extends Record<string, unknown> {
  assistantId: string;
  chatId?: string;
  userId: string;
}

export interface CreateAssistantOptions {
  chatId?: string;
}

type AssistantTools = Record<string, never>;

export async function createAssistant(
  userId: string,
  options: CreateAssistantOptions = {}
) {
  const assistantRow = await db.query.assistant.findFirst({
    where: eq(assistant.userId, userId),
  });

  if (!assistantRow) {
    throw new Error(`Assistant not found for user ${userId}`);
  }

  const modelId = assistantRow.config?.model ?? DEFAULT_ASSISTANT_CONFIG.model;

  const runtimeContext: AssistantRuntimeContext = {
    userId,
    assistantId: assistantRow.id,
    chatId: options.chatId,
  };

  return new ToolLoopAgent<never, AssistantTools, AssistantRuntimeContext>({
    model: getGeminiModel(modelId),
    instructions: assistantRow.instructions,
    tools: {},
    prepareCall: async (call) => ({
      ...call,
      runtimeContext,
    }),
  });
}

export type AssistantAgent = Awaited<ReturnType<typeof createAssistant>>;
export type AssistantUIMessage = InferAgentUIMessage<AssistantAgent>;
