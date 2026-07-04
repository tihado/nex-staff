import { createDocumentTool } from "@/lib/tools/documents/create-document";
import { listDocumentsTool } from "@/lib/tools/documents/list-documents";

export const documentTools = {
  list_documents: listDocumentsTool,
  create_document: createDocumentTool,
} as const;
