import type { UIMessage } from "ai";
import { and, asc, desc, eq, lt } from "drizzle-orm";
import { db } from "@/db";
import { chat, chatEvent, message } from "@/db/schema";
import {
  ASSISTANT_CHAT_TYPE,
  DEFAULT_CHAT_LIST_LIMIT,
  MAX_CHAT_LIST_LIMIT,
} from "@/lib/chat/constants";
import { isUuid } from "@/lib/chat/validation";

export class ChatAccessError extends Error {
  constructor(message = "Chat not found") {
    super(message);
    this.name = "ChatAccessError";
  }
}

export interface ChatListItem {
  createdAt: Date;
  id: string;
  metadata: Record<string, unknown>;
  title: string | null;
  updatedAt: Date;
}

export interface ChatDetail {
  createdAt: Date;
  events: Array<{
    createdAt: Date;
    eventIndex: number;
    id: string;
    payload: Record<string, unknown>;
  }>;
  id: string;
  messages: UIMessage[];
  metadata: Record<string, unknown>;
  title: string | null;
  updatedAt: Date;
}

function messageRowToUiMessage(row: typeof message.$inferSelect): UIMessage {
  const stored = row.content as UIMessage;

  return {
    ...stored,
    id: row.id,
    role: stored.role ?? (row.role as UIMessage["role"]),
  };
}

function resolveMessageId(uiMessage: UIMessage): {
  id: string;
  message: UIMessage;
} {
  if (isUuid(uiMessage.id)) {
    return { id: uiMessage.id, message: uiMessage };
  }

  const id = crypto.randomUUID();

  return {
    id,
    message: { ...uiMessage, id },
  };
}

export async function ensureAssistantChat(
  userId: string,
  chatId: string
): Promise<void> {
  const existing = await db.query.chat.findFirst({
    where: eq(chat.id, chatId),
    columns: { userId: true },
  });

  if (existing) {
    if (existing.userId !== userId) {
      throw new ChatAccessError();
    }

    return;
  }

  await db.insert(chat).values({
    id: chatId,
    userId,
    metadata: { type: ASSISTANT_CHAT_TYPE },
    updatedAt: new Date(),
  });
}

export async function persistChatMessage(
  chatId: string,
  uiMessage: UIMessage
): Promise<void> {
  const { id: messageId, message: storedMessage } = resolveMessageId(uiMessage);

  await db
    .insert(message)
    .values({
      id: messageId,
      chatId,
      role: storedMessage.role,
      content: storedMessage,
    })
    .onConflictDoUpdate({
      target: message.id,
      set: {
        role: storedMessage.role,
        content: storedMessage,
      },
    });

  await db
    .update(chat)
    .set({ updatedAt: new Date() })
    .where(eq(chat.id, chatId));
}

export async function persistChatMessages(
  chatId: string,
  uiMessages: UIMessage[]
): Promise<void> {
  for (const uiMessage of uiMessages) {
    await persistChatMessage(chatId, uiMessage);
  }
}

export async function loadChatMessages(chatId: string): Promise<UIMessage[]> {
  const rows = await db.query.message.findMany({
    where: eq(message.chatId, chatId),
    orderBy: [asc(message.createdAt)],
  });

  return rows.map(messageRowToUiMessage);
}

export async function getChatDetailForUser(
  chatId: string,
  userId: string
): Promise<ChatDetail> {
  const chatRow = await db.query.chat.findFirst({
    where: and(eq(chat.id, chatId), eq(chat.userId, userId)),
  });

  if (!chatRow) {
    throw new ChatAccessError();
  }

  const [messages, events] = await Promise.all([
    loadChatMessages(chatId),
    db.query.chatEvent.findMany({
      where: eq(chatEvent.chatId, chatId),
      orderBy: [asc(chatEvent.eventIndex)],
    }),
  ]);

  return {
    id: chatRow.id,
    title: chatRow.title,
    metadata: chatRow.metadata ?? {},
    createdAt: chatRow.createdAt,
    updatedAt: chatRow.updatedAt,
    messages,
    events: events.map((event) => ({
      id: event.id,
      eventIndex: event.eventIndex,
      payload: event.payload as Record<string, unknown>,
      createdAt: event.createdAt,
    })),
  };
}

export async function listChatsForUser(
  userId: string,
  options: { cursor?: string; limit?: number } = {}
): Promise<{ chats: ChatListItem[]; nextCursor: string | null }> {
  const limit = Math.min(
    options.limit ?? DEFAULT_CHAT_LIST_LIMIT,
    MAX_CHAT_LIST_LIMIT
  );

  const cursorChat = options.cursor
    ? await db.query.chat.findFirst({
        where: and(eq(chat.id, options.cursor), eq(chat.userId, userId)),
        columns: { updatedAt: true },
      })
    : null;

  if (options.cursor && !cursorChat) {
    throw new ChatAccessError();
  }

  const rows = await db.query.chat.findMany({
    where: cursorChat
      ? and(eq(chat.userId, userId), lt(chat.updatedAt, cursorChat.updatedAt))
      : eq(chat.userId, userId),
    orderBy: [desc(chat.updatedAt)],
    limit: limit + 1,
  });

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;

  return {
    chats: page.map((row) => ({
      id: row.id,
      title: row.title,
      metadata: row.metadata ?? {},
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    })),
    nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
  };
}
