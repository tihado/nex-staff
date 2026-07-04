import { tool } from "ai";
import { z } from "zod";
import { guardWorkspacePath } from "@/lib/sandbox/path-guard";
import { resumeSandboxSession } from "@/lib/sandbox/session";
import { SANDBOX_COMMAND_TIMEOUT_MS } from "@/lib/tasks/constants";

const sandboxFileInputSchema = z.object({
  path: z.string().describe("File path relative to workspace root"),
  action: z.enum(["read", "write"]).describe("read or write"),
  content: z
    .string()
    .optional()
    .describe("Content to write (required for write)"),
});

const sandboxBashInputSchema = z.object({
  command: z.string().describe("Shell command to run"),
});

function createSandboxFileExecute(sessionId: string) {
  return async function sandboxFileExecute(
    input: z.infer<typeof sandboxFileInputSchema>
  ) {
    "use step";

    const session = await resumeSandboxSession(sessionId);
    const safePath = guardWorkspacePath(input.path);

    if (input.action === "read") {
      const content = await session.readTextFile(safePath);
      return {
        path: safePath,
        content: content ?? "",
        found: content !== null,
      };
    }

    if (!input.content) {
      throw new Error("content is required when action is write.");
    }

    await session.writeTextFile(safePath, input.content);

    return {
      path: safePath,
      written: true,
      bytes: input.content.length,
    };
  };
}

function createSandboxBashExecute(sessionId: string) {
  return async function sandboxBashExecute(
    input: z.infer<typeof sandboxBashInputSchema>
  ) {
    "use step";

    const session = await resumeSandboxSession(sessionId);
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      SANDBOX_COMMAND_TIMEOUT_MS
    );

    try {
      const result = await session.run(input.command, "/workspace");

      return {
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
      };
    } finally {
      clearTimeout(timeout);
    }
  };
}

export function createSandboxFileTool(sessionId: string, description?: string) {
  return tool({
    description:
      description ??
      "Read or write files in the task workspace (briefs, drafts, deliverables)",
    inputSchema: sandboxFileInputSchema,
    execute: createSandboxFileExecute(sessionId),
  });
}

export function createSandboxBashTool(sessionId: string, description?: string) {
  return tool({
    description:
      description ??
      "Run shell commands in the task workspace (e.g. list files, format output)",
    inputSchema: sandboxBashInputSchema,
    execute: createSandboxBashExecute(sessionId),
  });
}
