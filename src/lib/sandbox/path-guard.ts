import { WORKSPACE_ROOT } from "@/lib/tasks/constants";

export class SandboxPathError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SandboxPathError";
  }
}

function normalizeSegments(path: string): string[] {
  const trimmed = path.trim();

  if (!trimmed) {
    throw new SandboxPathError("Path is required.");
  }

  const absolute = trimmed.startsWith("/")
    ? trimmed
    : `${WORKSPACE_ROOT}/${trimmed}`;
  const segments = absolute.split("/").filter((segment) => segment.length > 0);

  for (const segment of segments) {
    if (segment === "..") {
      throw new SandboxPathError("Path traversal is not allowed.");
    }
  }

  return segments;
}

export function guardWorkspacePath(path: string): string {
  const segments = normalizeSegments(path);
  const normalized = `/${segments.join("/")}`;

  if (
    !normalized.startsWith(`${WORKSPACE_ROOT}/`) &&
    normalized !== WORKSPACE_ROOT
  ) {
    throw new SandboxPathError(`Path must stay under ${WORKSPACE_ROOT}.`);
  }

  return normalized;
}

export function workspaceDocPath(filename: string): string {
  return guardWorkspacePath(`/workspace/docs/${filename}`);
}
