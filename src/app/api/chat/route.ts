import { createAgentUIStreamResponse } from "ai";
import { createAssistant } from "@/lib/agents/assistant";
import { getServerViewer } from "@/lib/viewer";

export const maxDuration = 30;

export async function POST(req: Request) {
  const viewer = await getServerViewer();

  if (!viewer) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages, id: chatId } = await req.json();

  const agent = await createAssistant(viewer.id, { chatId });

  return createAgentUIStreamResponse({
    agent,
    uiMessages: messages,
  });
}
