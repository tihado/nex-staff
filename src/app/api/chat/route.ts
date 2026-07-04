import { createAgentUIStreamResponse } from "ai";
import { NextResponse } from "next/server";
import {
  type AssistantUIMessage,
  createAssistant,
} from "@/lib/agents/assistant";
import {
  getStreamErrorMessage,
  logAssistantError,
} from "@/lib/assistant/errors";
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
  taskId?: string;
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
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 }
    );
  }

  let body: ChatRequestBody;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const chatId = parseUuid(body.id);
  const taskId = body.taskId ? parseUuid(body.taskId) : null;
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
    try {
      await persistChatMessage(chatId, lastUserMessage);
    } catch (error) {
      logAssistantError("persist-user-message", error);
      return NextResponse.json(
        {
          error: { code: "INTERNAL_ERROR", message: "Failed to save message" },
        },
        { status: 500 }
      );
    }
  }

  let agent: Awaited<ReturnType<typeof createAssistant>>;

  try {
    agent = await createAssistant(viewer.id, {
      chatId,
      taskId: taskId ?? undefined,
    });
  } catch (error) {
    logAssistantError("create-assistant", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Assistant unavailable" } },
      { status: 500 }
    );
  }

  return createAgentUIStreamResponse({
    agent,
    uiMessages: messages,
    originalMessages: messages,
    generateMessageId: () => crypto.randomUUID(),
    onError: getStreamErrorMessage,
    onEnd: async ({ messages: persistedMessages }) => {
      try {
        await persistChatMessages(chatId, persistedMessages);
      } catch (error) {
        logAssistantError("persist-assistant-messages", error);
      }
    },
  });
}
