import { createAgentUIStreamResponse } from "ai";
import { NextResponse } from "next/server";
import {
  type AssistantUIMessage,
  createAssistant,
} from "@/lib/agents/assistant";
import {
  ChatAccessError,
  ensureAssistantChat,
  persistChatMessage,
  persistChatMessages,
} from "@/lib/chat/persistence";
import { parseUuid } from "@/lib/chat/validation";
import { getServerViewer } from "@/lib/viewer";

export const maxDuration = 30;

interface ChatRequestBody {
  id?: string;
  messages?: AssistantUIMessage[];
}

function getLastUserMessage(
  messages: AssistantUIMessage[]
): AssistantUIMessage | undefined {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const candidate = messages[index];
    if (candidate.role === "user") {
      return candidate;
    }
  }

  return;
}

export async function POST(req: Request) {
  const viewer = await getServerViewer();

  if (!viewer) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: ChatRequestBody;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const chatId = parseUuid(body.id);
  const messages = body.messages;

  if (!chatId) {
    return NextResponse.json({ error: "Invalid chat id" }, { status: 400 });
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: "Messages are required" },
      { status: 400 }
    );
  }

  try {
    await ensureAssistantChat(viewer.id, chatId);
  } catch (error) {
    if (error instanceof ChatAccessError) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    throw error;
  }

  const lastUserMessage = getLastUserMessage(messages);

  if (lastUserMessage) {
    await persistChatMessage(chatId, lastUserMessage);
  }

  const agent = await createAssistant(viewer.id, { chatId });

  return createAgentUIStreamResponse({
    agent,
    uiMessages: messages,
    originalMessages: messages,
    onEnd: async ({ messages: persistedMessages }) => {
      try {
        await persistChatMessages(chatId, persistedMessages);
      } catch (error) {
        console.error("Failed to persist assistant chat messages", error);
      }
    },
  });
}
