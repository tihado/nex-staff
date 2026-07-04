import { type InferAgentUIMessage, ToolLoopAgent } from "ai";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { assistant } from "@/db/schema";
import { getGeminiModel } from "@/lib/ai/google";
import { DEFAULT_ASSISTANT_CONFIG } from "@/lib/assistant-defaults";
import { documentTools } from "@/lib/tools/documents";

export interface AssistantRuntimeContext extends Record<string, unknown> {
  assistantId: string;
  chatId?: string;
  userId: string;
}

export interface CreateAssistantOptions {
  chatId?: string;
}

type AssistantTools = typeof documentTools;

function buildDocumentToolsContext(userId: string) {
  return {
    list_documents: { userId },
    create_document: { userId },
  } as const;
}

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

  const toolsContext = buildDocumentToolsContext(userId);

  return new ToolLoopAgent<never, AssistantTools, AssistantRuntimeContext>({
    model: getGeminiModel(modelId),
    instructions: assistantRow.instructions,
    tools: documentTools,
    toolsContext,
    prepareCall: async (call) => ({
      ...call,
      runtimeContext,
      toolsContext,
    }),
  });
}

export type AssistantAgent = Awaited<ReturnType<typeof createAssistant>>;
export type AssistantUIMessage = InferAgentUIMessage<AssistantAgent>;
