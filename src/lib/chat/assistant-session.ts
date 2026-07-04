import type { AssistantUIMessage } from "@/lib/agents/assistant";

export const ASSISTANT_CHAT_STORAGE_KEY = "nex-staff-assistant-chat-id";

export interface DialogueChatContext {
  speakerId: string;
  taskId?: string;
}

function dialogueChatStorageKey(context: DialogueChatContext): string {
  if (context.taskId) {
    return `nex-staff-chat-task-${context.taskId}`;
  }

  if (context.speakerId === "assistant") {
    return ASSISTANT_CHAT_STORAGE_KEY;
  }

  return `nex-staff-chat-staff-${context.speakerId}`;
}

export function getOrCreateDialogueChatId(
  context: DialogueChatContext
): string {
  const storageKey = dialogueChatStorageKey(context);
  const existingId = sessionStorage.getItem(storageKey);

  if (existingId) {
    return existingId;
  }

  const chatId = crypto.randomUUID();
  sessionStorage.setItem(storageKey, chatId);
  return chatId;
}

export function getOrCreateAssistantChatId(): string {
  return getOrCreateDialogueChatId({ speakerId: "assistant" });
}

export async function fetchAssistantChatHistory(
  chatId: string
): Promise<AssistantUIMessage[]> {
  try {
    const response = await fetch(`/api/chats/${chatId}`);

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as {
      messages?: AssistantUIMessage[];
    };

    return data.messages ?? [];
  } catch {
    return [];
  }
}
