import { type InferAgentUIMessage, isStepCount, ToolLoopAgent } from "ai";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { assistant } from "@/db/schema";
import { getGeminiModel } from "@/lib/ai/google";
import {
  ASSISTANT_MAX_STEPS,
  DEFAULT_ASSISTANT_CONFIG,
} from "@/lib/assistant-defaults";
import { type AssistantTools, assistantTools } from "@/lib/tools/assistant";

export interface AssistantRuntimeContext extends Record<string, unknown> {
  assistantId: string;
  chatId?: string;
  userId: string;
}

export interface CreateAssistantOptions {
  chatId?: string;
}

type AssistantAgentTools = AssistantTools;

function buildToolsContext(userId: string) {
  return {
    list_documents: { userId },
    create_document: { userId },
    hire_staff: { userId },
    list_staff: { userId },
    get_staff: { userId },
    update_staff: { userId },
    check_task_status: { userId },
    list_active_tasks: { userId },
    get_task_events: { userId },
    get_task_preview: { userId },
  } as const;
}

/**
 * Load the user's Assistant from DB and return a configured `ToolLoopAgent`.
 * Instructions and model come from the `assistant` row (provisioned on signup).
 */
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

  return new ToolLoopAgent<never, AssistantAgentTools, AssistantRuntimeContext>(
    {
      model: getGeminiModel(modelId),
      instructions: assistantRow.instructions,
      tools: assistantTools,
      toolsContext,
      stopWhen: isStepCount(ASSISTANT_MAX_STEPS),
      prepareCall: async (call) => ({
        ...call,
        runtimeContext,
        toolsContext,
      }),
    }
  );
}

export type AssistantAgent = Awaited<ReturnType<typeof createAssistant>>;
export type AssistantUIMessage = InferAgentUIMessage<AssistantAgent>;
