"use client";

import type { Components } from "streamdown";
import { Streamdown } from "streamdown";
import { cn } from "@/lib/utils";

interface DialogueMarkdownProps {
  className?: string;
  content: string;
  isAnimating?: boolean;
  variant?: "assistant" | "user";
}

function createPixelComponents(variant: "assistant" | "user"): Components {
  const isUser = variant === "user";

  return {
    p: ({ children }) => (
      <p className="not-first:mt-2 whitespace-pre-wrap">{children}</p>
    ),
    strong: ({ children }) => (
      <strong className="font-semibold text-ink">{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
    ul: ({ children }) => (
      <ul className="mt-2 list-disc space-y-1 pl-5">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="mt-2 list-decimal space-y-1 pl-5">{children}</ol>
    ),
    li: ({ children }) => <li>{children}</li>,
    a: ({ href, children }) => (
      <a
        className="text-pixel-accent underline underline-offset-2"
        href={href}
        rel="noopener noreferrer"
        target="_blank"
      >
        {children}
      </a>
    ),
    code: ({ className, children }) => {
      const isBlock = Boolean(className);

      if (isBlock) {
        return <code className={className}>{children}</code>;
      }

      return (
        <code
          className={cn(
            "rounded px-1 py-0.5 font-mono text-[0.9em]",
            isUser ? "bg-panel/80" : "bg-nameplate-bg/60"
          )}
        >
          {children}
        </code>
      );
    },
    pre: ({ children }) => (
      <pre className="mt-2 overflow-x-auto rounded border border-border-dialogue bg-nameplate-bg/40 px-2 py-2 font-mono text-[10px] leading-6">
        {children}
      </pre>
    ),
    blockquote: ({ children }) => (
      <blockquote className="mt-2 border-pixel-accent border-l-2 pl-3 italic">
        {children}
      </blockquote>
    ),
    h1: ({ children }) => (
      <p className="mt-2 font-semibold text-ink text-sm">{children}</p>
    ),
    h2: ({ children }) => (
      <p className="mt-2 font-semibold text-ink">{children}</p>
    ),
    h3: ({ children }) => (
      <p className="mt-2 font-medium text-ink">{children}</p>
    ),
  };
}

export function DialogueMarkdown({
  content,
  isAnimating = false,
  className,
  variant = "assistant",
}: DialogueMarkdownProps) {
  if (!content.trim()) {
    return null;
  }

  return (
    <Streamdown
      className={cn(
        "dialogue-markdown font-pixel text-[11px] text-text-primary leading-[1.9] tracking-tight",
        className
      )}
      components={createPixelComponents(variant)}
      controls={{
        code: { copy: true, download: false },
        mermaid: false,
        table: false,
      }}
      isAnimating={isAnimating}
      lineNumbers={false}
      mode={isAnimating ? "streaming" : "static"}
    >
      {content}
    </Streamdown>
  );
}
