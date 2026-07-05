import { type InferAgentUIMessage, isStepCount, ToolLoopAgent } from "ai";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { assistant } from "@/db/schema";
import { ensureEnglishResponseRule } from "@/lib/agents/language";
import { getLanguageModel } from "@/lib/ai/model";
import {
  ASSISTANT_MAX_STEPS,
  DEFAULT_ASSISTANT_CONFIG,
  DEFAULT_ASSISTANT_INSTRUCTIONS,
} from "@/lib/assistant-defaults";
import { getTaskStatusForUser } from "@/lib/tasks/service";
import { type AssistantTools, assistantTools } from "@/lib/tools/assistant";

export interface AssistantRuntimeContext extends Record<string, unknown> {
  assistantId: string;
  chatId?: string;
  userId: string;
}

export interface CreateAssistantOptions {
  chatId?: string;
  taskId?: string;
}

async function buildTaskFocusInstructions(
  userId: string,
  taskId: string
): Promise<string | null> {
  const snapshot = await getTaskStatusForUser(userId, taskId);

  if (!snapshot) {
    return null;
  }

  const currentStep = snapshot.currentStep ?? "none";

  return [
    "--- Task focus ---",
    `The user opened dialogue while reviewing task ${taskId}.`,
    `Brief: ${snapshot.brief}`,
    `Staff: ${snapshot.staffName}`,
    `Status: ${snapshot.status}, progress: ${snapshot.progressPercent}%.`,
    `Current step: ${currentStep}.`,
    "Ask if they need anything related to this task.",
    `Use check_task_status, get_task_events, or get_task_preview with taskId ${taskId} when helpful.`,
    "Use stop_task when the user wants to cancel a running task (confirm first unless they were explicit).",
    "Do not delegate a duplicate task unless they ask.",
  ].join("\n");
}

type AssistantAgentTools = AssistantTools;

function buildToolsContext(userId: string, chatId?: string) {
  const taskContext = { userId, chatId };

  return {
    list_documents: { userId },
    create_document: { userId },
    hire_staff: { userId },
    list_staff: { userId },
    get_staff: { userId },
    update_staff: { userId },
    delegate_task: taskContext,
    check_task_status: taskContext,
    list_active_tasks: taskContext,
    get_task_events: taskContext,
    get_task_preview: taskContext,
    get_deliverable: taskContext,
    stop_task: taskContext,
    steer_task: taskContext,
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
  let instructions = DEFAULT_ASSISTANT_INSTRUCTIONS;

  if (options.taskId) {
    const taskFocus = await buildTaskFocusInstructions(userId, options.taskId);

    if (taskFocus) {
      instructions = `${instructions}\n\n${taskFocus}`;
    }
  }

  instructions = ensureEnglishResponseRule(instructions);

  const runtimeContext: AssistantRuntimeContext = {
    userId,
    assistantId: assistantRow.id,
    chatId: options.chatId,
  };

  const toolsContext = buildToolsContext(userId, options.chatId);

  return new ToolLoopAgent<never, AssistantAgentTools, AssistantRuntimeContext>(
    {
      model: getLanguageModel(modelId),
      instructions,
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
