"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Loader2, SendHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { AssistantUIMessage } from "@/lib/agents/assistant";
import { cn } from "@/lib/utils";

const ASSISTANT_CHAT_STORAGE_KEY = "nex-staff-assistant-chat-id";

interface AssistantChatProps {
  assistantName: string;
  greeting: string;
}

function getMessageText(message: AssistantUIMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
}

function getOrCreateChatId(): string {
  const existingId = sessionStorage.getItem(ASSISTANT_CHAT_STORAGE_KEY);

  if (existingId) {
    return existingId;
  }

  const chatId = crypto.randomUUID();
  sessionStorage.setItem(ASSISTANT_CHAT_STORAGE_KEY, chatId);
  return chatId;
}

function ChatMessage({ message }: { message: AssistantUIMessage }) {
  const isUser = message.role === "user";
  const text = getMessageText(message);

  if (!text) {
    return null;
  }

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[min(100%,42rem)] rounded-2xl px-4 py-3 text-sm leading-7 shadow-sm",
          isUser
            ? "bg-primary text-primary-foreground"
            : "border border-border bg-card text-card-foreground"
        )}
      >
        <p className="whitespace-pre-wrap">{text}</p>
      </div>
    </div>
  );
}

function AssistantChatPanel({
  assistantName,
  chatId,
  greeting,
  initialMessages,
}: AssistantChatProps & {
  chatId: string;
  initialMessages: AssistantUIMessage[];
}) {
  const [input, setInput] = useState("");
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
      }),
    []
  );

  const { messages, sendMessage, status, error, stop } =
    useChat<AssistantUIMessage>({
      id: chatId,
      messages: initialMessages,
      transport,
    });

  const isBusy = status === "submitted" || status === "streaming";

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = input.trim();

    if (!text || isBusy) {
      return;
    }

    sendMessage({ text });
    setInput("");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
          <div className="rounded-2xl border border-border border-dashed bg-muted/40 px-4 py-3 text-muted-foreground text-sm">
            <p className="font-medium text-foreground">{assistantName}</p>
            <p className="mt-1 leading-6">{greeting}</p>
          </div>

          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}

          {isBusy ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="size-4 animate-spin" />
              <span>{assistantName} is thinking...</span>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive text-sm">
              {error.message}
            </div>
          ) : null}

          <div
            aria-hidden
            ref={(node) => {
              node?.scrollIntoView({ behavior: "smooth", block: "end" });
            }}
          />
        </div>
      </div>

      <div className="border-border border-t bg-background/95 px-4 py-4 backdrop-blur sm:px-6">
        <form
          className="mx-auto flex w-full max-w-3xl items-end gap-3"
          onSubmit={handleSubmit}
        >
          <label className="sr-only" htmlFor="assistant-chat-input">
            Message {assistantName}
          </label>
          <textarea
            className="min-h-12 flex-1 resize-none rounded-2xl border border-input bg-background px-4 py-3 text-sm leading-6 shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={status === "submitted"}
            id="assistant-chat-input"
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder={`Message ${assistantName}...`}
            rows={1}
            value={input}
          />

          {status === "streaming" ? (
            <Button onClick={stop} type="button" variant="outline">
              Stop
            </Button>
          ) : (
            <Button
              aria-label="Send message"
              disabled={!input.trim() || isBusy}
              size="icon-lg"
              type="submit"
            >
              <SendHorizontal />
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}

async function fetchChatHistory(chatId: string): Promise<AssistantUIMessage[]> {
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

export function AssistantChat({ assistantName, greeting }: AssistantChatProps) {
  const [chatId, setChatId] = useState<string | null>(null);
  const [initialMessages, setInitialMessages] = useState<
    AssistantUIMessage[] | null
  >(null);

  useEffect(() => {
    let cancelled = false;

    async function loadChatHistory() {
      const id = getOrCreateChatId();
      const messages = await fetchChatHistory(id);

      if (cancelled) {
        return;
      }

      setInitialMessages(messages);
      setChatId(id);
    }

    loadChatHistory();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!chatId || initialMessages === null) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-6 text-muted-foreground text-sm">
        <Loader2 className="mr-2 size-4 animate-spin" />
        Loading conversation...
      </div>
    );
  }

  return (
    <AssistantChatPanel
      assistantName={assistantName}
      chatId={chatId}
      greeting={greeting}
      initialMessages={initialMessages}
    />
  );
}
