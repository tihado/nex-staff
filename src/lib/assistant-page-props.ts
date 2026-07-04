import { eq } from "drizzle-orm";
import { db } from "@/db";
import { assistant } from "@/db/schema";
import {
  DEFAULT_ASSISTANT_CONFIG,
  DEFAULT_ASSISTANT_NAME,
} from "@/lib/assistant-defaults";
import { getServerViewer } from "@/lib/viewer";

export interface AssistantPageProps {
  assistantName: string;
  greeting: string;
  viewerLabel: string;
}

export async function getAssistantPageProps(): Promise<AssistantPageProps | null> {
  const viewer = await getServerViewer();

  if (!viewer) {
    return null;
  }

  const assistantRow = await db.query.assistant.findFirst({
    where: eq(assistant.userId, viewer.id),
    columns: { name: true, config: true },
  });

  return {
    assistantName: assistantRow?.name ?? DEFAULT_ASSISTANT_NAME,
    greeting:
      assistantRow?.config?.greeting ?? DEFAULT_ASSISTANT_CONFIG.greeting,
    viewerLabel: viewer.name ?? viewer.email,
  };
}
