import { tool } from "ai";
import { z } from "zod";
import { listDocuments } from "@/lib/documents/service";
import { documentToolContextSchema } from "@/lib/tools/documents/context";

export const listDocumentsTool = tool({
  description: "List all documents the user has uploaded to the archive.",
  inputSchema: z.object({
    staffId: z
      .string()
      .uuid()
      .optional()
      .describe("Filter documents linked to a specific staff member"),
  }),
  contextSchema: documentToolContextSchema,
  execute: async ({ staffId }, { context }) => {
    const documents = await listDocuments(context.userId, { staffId });

    return {
      count: documents.length,
      documents: documents.map(
        ({ id, filename, mimeType, uploadedAt, status }) => ({
          id,
          filename,
          mimeType,
          status,
          uploadedAt,
        })
      ),
    };
  },
});
