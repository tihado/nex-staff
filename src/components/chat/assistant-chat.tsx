"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type FileUIPart } from "ai";
import { Loader2, Paperclip, SendHorizontal } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { AssistantUIMessage } from "@/lib/agents/assistant";
import {
  fetchAssistantChatHistory,
  getOrCreateAssistantChatId,
} from "@/lib/chat/assistant-session";
import { uploadDocument } from "@/lib/documents/upload-client";
import { cn } from "@/lib/utils";
import { FileAttachmentChip } from "./file-attachment-chip";
import { MessageMarkdown } from "./message-markdown";
import { PendingAttachmentChip } from "./pending-attachment-chip";

interface AssistantChatProps {
  assistantName: string;
  greeting: string;
}

interface PendingFileAttachment {
  file: File;
  id: string;
}

function getMessageText(message: AssistantUIMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
}

function getMessageFileParts(message: AssistantUIMessage): FileUIPart[] {
  return message.parts.filter(
    (part): part is FileUIPart => part.type === "file"
  );
}

function hasMessageContent(message: AssistantUIMessage): boolean {
  const hasText = getMessageText(message).trim().length > 0;
  const hasFiles = getMessageFileParts(message).length > 0;
  return hasText || hasFiles;
}

function ChatMessage({ message }: { message: AssistantUIMessage }) {
  const isUser = message.role === "user";
  const text = getMessageText(message);
  const files = getMessageFileParts(message);
  const variant = isUser ? "user" : "assistant";

  if (!hasMessageContent(message)) {
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
        <MessageMarkdown content={text} variant={variant} />
        {files.map((file) => (
          <FileAttachmentChip
            filename={file.filename}
            key={file.url}
            mediaType={file.mediaType}
            url={file.url}
            variant={variant}
          />
        ))}
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState("");
  const [pendingFiles, setPendingFiles] = useState<PendingFileAttachment[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
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
      generateId: () => crypto.randomUUID(),
      transport,
    });

  const isBusy =
    status === "submitted" || status === "streaming" || isUploading;

  const canSend =
    (input.trim().length > 0 || pendingFiles.length > 0) && !isBusy;

  function handleRemovePendingFile(id: string) {
    setPendingFiles((current) => current.filter((item) => item.id !== id));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const text = input.trim();
    const filesToUpload = pendingFiles;

    if ((!text && filesToUpload.length === 0) || isBusy) {
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      const uploadedFiles =
        filesToUpload.length > 0
          ? await Promise.all(
              filesToUpload.map((item) => uploadDocument(item.file))
            )
          : [];

      const messageText =
        text ||
        (uploadedFiles.length > 0 ? "Review the attached file(s)." : "");

      if (!messageText) {
        return;
      }

      await sendMessage({
        text: messageText,
        ...(uploadedFiles.length > 0
          ? {
              files: uploadedFiles.map((uploaded) => ({
                type: "file" as const,
                filename: uploaded.filename,
                mediaType: uploaded.mimeType,
                url: uploaded.blobUrl,
              })),
            }
          : {}),
      });

      setInput("");
      setPendingFiles([]);
    } catch (submitFailure) {
      setUploadError(
        submitFailure instanceof Error
          ? submitFailure.message
          : "Failed to send message with attachments."
      );
    } finally {
      setIsUploading(false);
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const selectedFiles = input.files;

    if (!selectedFiles || selectedFiles.length === 0 || isBusy) {
      input.value = "";
      return;
    }

    const newAttachments = Array.from(selectedFiles).map((file) => ({
      id: crypto.randomUUID(),
      file,
    }));

    input.value = "";
    setUploadError(null);
    setPendingFiles((current) => [...current, ...newAttachments]);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
          {messages.length === 0 ? (
            <div className="rounded-2xl border border-border border-dashed bg-muted/40 px-4 py-3 text-muted-foreground text-sm">
              <p className="font-medium text-foreground">{assistantName}</p>
              <p className="mt-1 leading-6">{greeting}</p>
            </div>
          ) : null}

          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}

          {isBusy ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="size-4 animate-spin" />
              <span>
                {isUploading
                  ? "Uploading document..."
                  : `${assistantName} is thinking...`}
              </span>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive text-sm">
              {error.message}
            </div>
          ) : null}

          {uploadError ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive text-sm">
              {uploadError}
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
        <form className="mx-auto w-full max-w-3xl" onSubmit={handleSubmit}>
          <input
            accept=".pdf,.md,.markdown,.txt,application/pdf,text/markdown,text/plain"
            className="sr-only"
            disabled={isBusy}
            id="assistant-chat-file-input"
            multiple
            onChange={handleFileChange}
            ref={fileInputRef}
            type="file"
          />

          <div className="overflow-hidden rounded-2xl border border-input bg-background shadow-xs focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
            {pendingFiles.length > 0 ? (
              <div className="flex flex-wrap gap-2 border-border border-b bg-muted/60 px-3 py-2.5">
                {pendingFiles.map((attachment) => (
                  <PendingAttachmentChip
                    disabled={isBusy}
                    filename={attachment.file.name}
                    key={attachment.id}
                    mediaType={attachment.file.type || undefined}
                    onRemove={() => handleRemovePendingFile(attachment.id)}
                  />
                ))}
              </div>
            ) : null}

            <label className="sr-only" htmlFor="assistant-chat-input">
              Message {assistantName}
            </label>
            <textarea
              className="max-h-40 min-h-12 w-full resize-none border-0 bg-transparent px-4 py-3 text-sm leading-6 outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isBusy}
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

            <div className="flex items-center justify-between px-2 pb-2">
              <Button
                aria-label="Attach document"
                disabled={isBusy}
                onClick={() => fileInputRef.current?.click()}
                size="icon-lg"
                type="button"
                variant="ghost"
              >
                <Paperclip />
              </Button>

              {status === "streaming" ? (
                <Button onClick={stop} type="button" variant="outline">
                  Stop
                </Button>
              ) : (
                <Button
                  aria-label="Send message"
                  disabled={!canSend}
                  size="icon-lg"
                  type="submit"
                >
                  <SendHorizontal />
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AssistantChat({ assistantName, greeting }: AssistantChatProps) {
  const [chatId, setChatId] = useState<string | null>(null);
  const [initialMessages, setInitialMessages] = useState<
    AssistantUIMessage[] | null
  >(null);

  useEffect(() => {
    let cancelled = false;

    async function loadChatHistory() {
      const id = getOrCreateAssistantChatId();
      const messages = await fetchAssistantChatHistory(id);

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
