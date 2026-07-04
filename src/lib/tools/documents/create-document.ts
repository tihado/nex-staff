import { tool } from "ai";
import { z } from "zod";
import { ALLOWED_MIME_TYPES } from "@/lib/documents/constants";
import { createDocumentFromContent } from "@/lib/documents/service";
import { documentToolContextSchema } from "@/lib/tools/documents/context";

export const createDocumentTool = tool({
  description:
    "Create a new document from text content, such as a project brief or notes.",
  inputSchema: z.object({
    filename: z
      .string()
      .min(1)
      .describe("Filename including extension, e.g. project-brief.md"),
    content: z.string().min(1).describe("Full text content of the document"),
    mimeType: z
      .string()
      .default("text/markdown")
      .describe("MIME type for the saved document"),
  }),
  contextSchema: documentToolContextSchema,
  execute: async ({ filename, content, mimeType }, { context }) => {
    const resolvedMimeType = ALLOWED_MIME_TYPES.has(mimeType)
      ? mimeType
      : "text/markdown";

    const created = await createDocumentFromContent(context.userId, {
      filename,
      content,
      mimeType: resolvedMimeType,
    });

    return {
      id: created.id,
      filename: created.filename,
      mimeType: created.mimeType,
      status: created.status,
      uploadedAt: created.uploadedAt,
    };
  },
});
