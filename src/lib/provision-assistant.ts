import { eq } from "drizzle-orm";
import { db } from "@/db";
import { assistant } from "@/db/schema";
import {
  DEFAULT_ASSISTANT_CONFIG,
  DEFAULT_ASSISTANT_INSTRUCTIONS,
  DEFAULT_ASSISTANT_NAME,
} from "@/lib/assistant-defaults";

export async function provisionAssistantForUser(userId: string): Promise<void> {
  const existing = await db.query.assistant.findFirst({
    where: eq(assistant.userId, userId),
    columns: { id: true },
  });

  if (existing) {
    return;
  }

  await db.insert(assistant).values({
    userId,
    name: DEFAULT_ASSISTANT_NAME,
    instructions: DEFAULT_ASSISTANT_INSTRUCTIONS,
    config: DEFAULT_ASSISTANT_CONFIG,
  });
}
