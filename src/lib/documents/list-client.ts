import type { DialogueChoice } from "@/lib/dialogue/types";
import type { DocumentSummary } from "@/lib/documents/types";
import { uiStrings } from "@/lib/i18n/ui";

interface DocumentListResponse {
  documents: DocumentSummary[];
}

export async function fetchDocuments(): Promise<DocumentSummary[]> {
  const response = await fetch("/api/documents", {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error("Failed to load documents.");
  }

  const data = (await response.json()) as DocumentListResponse;
  return data.documents ?? [];
}

export function mapDocumentsToChoices(
  documents: DocumentSummary[]
): DialogueChoice[] {
  const readyDocuments = documents.filter(
    (document) => document.status === "ready"
  );

  const choices: DialogueChoice[] = readyDocuments
    .slice(0, 6)
    .map((document, index) => ({
      id: `doc-${document.id}`,
      label: document.filename,
      shortcut: index < 3 ? (["A", "B", "C"] as const)[index] : undefined,
    }));

  choices.push({
    id: "docs-none",
    label: uiStrings.notNeeded,
    shortcut: choices.length === 0 ? "A" : undefined,
  });

  return choices;
}
