import { createVercelSandbox } from "@ai-sdk/sandbox-vercel";
import {
  createDevFilesystem,
  getDevFilesystem,
  isSandboxDisabled,
} from "@/lib/sandbox/dev-filesystem";
import type { SandboxSessionAdapter } from "@/lib/sandbox/types";

type VercelProvider = ReturnType<typeof createVercelSandbox>;
type VercelSession = Awaited<ReturnType<VercelProvider["createSession"]>>;

let vercelProvider: VercelProvider | null = null;

function getVercelProvider(): VercelProvider {
  if (!vercelProvider) {
    vercelProvider = createVercelSandbox({ runtime: "node24" });
  }

  return vercelProvider;
}

function wrapVercelSession(session: VercelSession): SandboxSessionAdapter {
  const restricted = session.restricted();

  return {
    readTextFile(path: string): Promise<string | null> {
      return restricted.readTextFile({ path });
    },

    async writeTextFile(path: string, content: string): Promise<void> {
      await restricted.writeTextFile({ path, content });
    },

    run(command: string, workingDirectory?: string) {
      return restricted.run({ command, workingDirectory });
    },

    async destroy(): Promise<void> {
      if (session.destroy) {
        await session.destroy();
      }
    },
  };
}

export async function createSandboxSession(
  sessionId: string
): Promise<SandboxSessionAdapter> {
  if (isSandboxDisabled()) {
    return createDevFilesystem(sessionId);
  }

  const provider = getVercelProvider();
  const session = await provider.createSession({ sessionId });
  return wrapVercelSession(session);
}

export async function resumeSandboxSession(
  sessionId: string
): Promise<SandboxSessionAdapter> {
  if (isSandboxDisabled()) {
    const devSession = getDevFilesystem(sessionId);

    if (!devSession) {
      return createDevFilesystem(sessionId);
    }

    return devSession;
  }

  const provider = getVercelProvider();

  if (!provider.resumeSession) {
    throw new Error("Vercel sandbox provider does not support resumeSession.");
  }

  const session = await provider.resumeSession({ sessionId });
  return wrapVercelSession(session);
}
