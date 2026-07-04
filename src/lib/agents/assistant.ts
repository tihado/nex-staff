import { type InferAgentUIMessage, ToolLoopAgent } from "ai";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { assistant } from "@/db/schema";
import { getGeminiModel } from "@/lib/ai/google";
import { DEFAULT_ASSISTANT_CONFIG } from "@/lib/assistant-defaults";
import { documentTools } from "@/lib/tools/documents";
import { staffTools } from "@/lib/tools/staff";

export interface AssistantRuntimeContext extends Record<string, unknown> {
  assistantId: string;
  chatId?: string;
  userId: string;
}

export interface CreateAssistantOptions {
  chatId?: string;
}

const assistantTools = {
  ...documentTools,
  ...staffTools,
} as const;

type AssistantTools = typeof assistantTools;

function buildToolsContext(userId: string) {
  return {
    list_documents: { userId },
    create_document: { userId },
    hire_staff: { userId },
    list_staff: { userId },
    get_staff: { userId },
    update_staff: { userId },
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

  const toolsContext = buildToolsContext(userId);

  return new ToolLoopAgent<never, AssistantTools, AssistantRuntimeContext>({
    model: getGeminiModel(modelId),
    instructions: assistantRow.instructions,
    tools: assistantTools,
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
