import type { AssistantUIMessage } from "@/lib/agents/assistant";

export const ASSISTANT_CHAT_STORAGE_KEY = "nex-staff-assistant-chat-id";

export function getOrCreateAssistantChatId(): string {
  const existingId = sessionStorage.getItem(ASSISTANT_CHAT_STORAGE_KEY);

  if (existingId) {
    return existingId;
  }

  const chatId = crypto.randomUUID();
  sessionStorage.setItem(ASSISTANT_CHAT_STORAGE_KEY, chatId);
  return chatId;
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
