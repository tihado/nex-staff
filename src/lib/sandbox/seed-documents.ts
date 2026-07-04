import type { TaskDocumentRow } from "@/lib/sandbox/get-documents-for-task";
import { workspaceDocPath } from "@/lib/sandbox/path-guard";
import type {
  DocumentManifest,
  SandboxSessionAdapter,
} from "@/lib/sandbox/types";
import { WORKSPACE_ROOT } from "@/lib/tasks/constants";

async function fetchDocumentContent(blobUrl: string): Promise<string> {
  const response = await fetch(blobUrl);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch document from blob storage (${response.status}).`
    );
  }

  return response.text();
}

export async function seedDocuments(
  session: SandboxSessionAdapter,
  docs: TaskDocumentRow[]
): Promise<DocumentManifest[]> {
  await session.run(
    `mkdir -p ${WORKSPACE_ROOT}/docs ${WORKSPACE_ROOT}/output`,
    WORKSPACE_ROOT
  );

  const manifest: DocumentManifest[] = [];

  for (const doc of docs) {
    const path = workspaceDocPath(doc.filename);
    const content = await fetchDocumentContent(doc.blobUrl);
    await session.writeTextFile(path, content);

    manifest.push({
      filename: doc.filename,
      path,
    });
  }

  return manifest;
}
