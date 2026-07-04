import { guardWorkspacePath } from "@/lib/sandbox/path-guard";
import type {
  SandboxRunResult,
  SandboxSessionAdapter,
} from "@/lib/sandbox/types";

interface DevFilesystemEntry {
  files: Map<string, string>;
}

const filesystems = new Map<string, DevFilesystemEntry>();

function buildDevAdapter(sessionId: string): SandboxSessionAdapter {
  let entry = filesystems.get(sessionId);

  if (!entry) {
    entry = { files: new Map() };
    filesystems.set(sessionId, entry);
  }

  return {
    readTextFile(path: string): Promise<string | null> {
      const safePath = guardWorkspacePath(path);
      const current = filesystems.get(sessionId);

      if (!current) {
        throw new Error(`Dev filesystem session ${sessionId} not found.`);
      }

      return Promise.resolve(current.files.get(safePath) ?? null);
    },

    writeTextFile(path: string, content: string): Promise<void> {
      const safePath = guardWorkspacePath(path);
      const current = filesystems.get(sessionId);

      if (!current) {
        throw new Error(`Dev filesystem session ${sessionId} not found.`);
      }

      current.files.set(safePath, content);
      return Promise.resolve();
    },

    run(
      command: string,
      workingDirectory = "/workspace"
    ): Promise<SandboxRunResult> {
      const current = filesystems.get(sessionId);

      if (!current) {
        throw new Error(`Dev filesystem session ${sessionId} not found.`);
      }

      const trimmed = command.trim();

      if (trimmed === "ls" || trimmed.startsWith("ls ")) {
        const prefix = guardWorkspacePath(workingDirectory);
        const paths = [...current.files.keys()].filter((filePath) =>
          filePath.startsWith(prefix)
        );

        return Promise.resolve({
          exitCode: 0,
          stdout: paths
            .map((filePath) => filePath.slice(prefix.length + 1))
            .join("\n"),
          stderr: "",
        });
      }

      if (trimmed.startsWith("cat ")) {
        const target = trimmed.slice(4).trim();
        const safePath = guardWorkspacePath(target);
        const content = current.files.get(safePath);

        if (content === undefined) {
          return Promise.resolve({
            exitCode: 1,
            stdout: "",
            stderr: `cat: ${target}: No such file`,
          });
        }

        return Promise.resolve({ exitCode: 0, stdout: content, stderr: "" });
      }

      if (trimmed.startsWith("mkdir -p ")) {
        return Promise.resolve({ exitCode: 0, stdout: "", stderr: "" });
      }

      return Promise.resolve({
        exitCode: 0,
        stdout: `[dev sandbox] executed: ${command}`,
        stderr: "",
      });
    },

    destroy(): Promise<void> {
      filesystems.delete(sessionId);
      return Promise.resolve();
    },
  };
}

export function isSandboxDisabled(): boolean {
  return process.env.SANDBOX_DISABLED === "true";
}

export function createDevFilesystem(sessionId: string): SandboxSessionAdapter {
  return buildDevAdapter(sessionId);
}

export function getDevFilesystem(
  sessionId: string
): SandboxSessionAdapter | null {
  if (!filesystems.has(sessionId)) {
    return null;
  }

  return buildDevAdapter(sessionId);
}
