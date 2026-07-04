import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import { assistant } from "@/db/schema";
import { auth } from "@/lib/auth";
import { provisionAssistantForUser } from "@/lib/provision-assistant";

export interface ServerViewer {
  assistantId: string;
  email: string;
  id: string;
  image: string | null;
  name: string | null;
}

export async function getServerViewer(): Promise<ServerViewer | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return null;
  }

  let assistantRow = await db.query.assistant.findFirst({
    where: eq(assistant.userId, session.user.id),
    columns: { id: true },
  });

  if (!assistantRow) {
    await provisionAssistantForUser(session.user.id);
    assistantRow = await db.query.assistant.findFirst({
      where: eq(assistant.userId, session.user.id),
      columns: { id: true },
    });
  }

  if (!assistantRow) {
    throw new Error(
      `Failed to provision assistant for user ${session.user.id}`
    );
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    image: session.user.image ?? null,
    assistantId: assistantRow.id,
  };
}
