import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface MessageMarkdownProps {
  content: string;
  variant?: "assistant" | "user";
}

function createMarkdownComponents(variant: "assistant" | "user"): Components {
  const isUser = variant === "user";

  return {
    p: ({ children }) => (
      <p className="not-first:mt-3 whitespace-pre-wrap">{children}</p>
    ),
    strong: ({ children }) => (
      <strong className="font-semibold">{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
    ul: ({ children }) => (
      <ul className="mt-3 list-disc space-y-1 pl-5">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="mt-3 list-decimal space-y-1 pl-5">{children}</ol>
    ),
    li: ({ children }) => <li className="leading-7">{children}</li>,
    a: ({ href, children }) => (
      <a
        className={cn(
          "underline underline-offset-2",
          isUser ? "text-primary-foreground" : "text-primary"
        )}
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
            "rounded px-1 py-0.5 font-mono text-[0.85em]",
            isUser ? "bg-primary-foreground/15" : "bg-muted"
          )}
        >
          {children}
        </code>
      );
    },
    pre: ({ children }) => (
      <pre
        className={cn(
          "mt-3 overflow-x-auto rounded-lg border px-3 py-2 font-mono text-xs leading-6",
          isUser
            ? "border-primary-foreground/20 bg-primary-foreground/10"
            : "border-border bg-muted/60"
        )}
      >
        {children}
      </pre>
    ),
    blockquote: ({ children }) => (
      <blockquote
        className={cn(
          "mt-3 border-l-2 pl-3 italic",
          isUser ? "border-primary-foreground/40" : "border-border"
        )}
      >
        {children}
      </blockquote>
    ),
    h1: ({ children }) => (
      <p className="mt-3 font-semibold text-base">{children}</p>
    ),
    h2: ({ children }) => (
      <p className="mt-3 font-semibold text-sm">{children}</p>
    ),
    h3: ({ children }) => (
      <p className="mt-3 font-medium text-sm">{children}</p>
    ),
  };
}

export function MessageMarkdown({
  content,
  variant = "assistant",
}: MessageMarkdownProps) {
  if (!content.trim()) {
    return null;
  }

  return (
    <ReactMarkdown
      components={createMarkdownComponents(variant)}
      remarkPlugins={[remarkGfm]}
    >
      {content}
    </ReactMarkdown>
  );
}
