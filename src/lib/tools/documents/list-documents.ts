import { tool } from "ai";
import { z } from "zod";
import { runToolSafely } from "@/lib/assistant/errors";
import { listDocuments } from "@/lib/documents/service";
import { documentToolContextSchema } from "@/lib/tools/documents/context";

export const listDocumentsTool = tool({
  description:
    "List all documents the user has uploaded to the archive, including URLs the model can read directly.",
  inputSchema: z.object({
    staffId: z
      .string()
      .uuid()
      .optional()
      .describe("Filter documents linked to a specific staff member"),
  }),
  contextSchema: documentToolContextSchema,
  execute: async ({ staffId }, { context }) =>
    runToolSafely("list_documents", async () => {
      const documents = await listDocuments(context.userId, { staffId });

      return {
        count: documents.length,
        documents: documents.map(
          ({ id, filename, mimeType, uploadedAt, status, blobUrl }) => ({
            id,
            filename,
            mimeType,
            status,
            uploadedAt,
            blobUrl,
          })
        ),
      };
    }),
});
