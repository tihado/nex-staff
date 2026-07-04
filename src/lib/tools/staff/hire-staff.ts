import { tool } from "ai";
import { z } from "zod";
import { StaffLimitError, StaffValidationError } from "@/lib/staff/errors";
import { hireStaff } from "@/lib/staff/service";
import { staffToolContextSchema } from "@/lib/tools/staff/context";

export const hireStaffTool = tool({
  description:
    "Hire a new specialist staff member. Use after gathering role, tone, and requirements from the user.",
  inputSchema: z.object({
    name: z
      .string()
      .min(1)
      .describe("Display name for the staff member, e.g. Alex"),
    role: z.string().min(1).describe("Job role, e.g. Content Writer"),
    template: z
      .enum(["writer"])
      .optional()
      .describe("Preset template. Use writer for blog and content work."),
    instructions: z
      .string()
      .min(1)
      .describe("System prompt with tone, audience, and job requirements"),
    documentIds: z
      .array(z.string().uuid())
      .optional()
      .describe(
        "Document IDs from list_documents to link as reference material"
      ),
    useSandbox: z
      .boolean()
      .optional()
      .describe(
        "Whether staff runs tasks in a sandbox. Defaults true for writer."
      ),
  }),
  contextSchema: staffToolContextSchema,
  execute: async (input, { context }) => {
    try {
      const created = await hireStaff(context.userId, input);

      return {
        staffId: created.id,
        name: created.name,
        role: created.role,
        avatarSprite: created.avatarSprite,
        status: created.status,
        useSandbox: created.useSandbox,
        warning: created.duplicateNameWarning,
      };
    } catch (error) {
      if (error instanceof StaffLimitError) {
        throw new Error(error.message);
      }

      if (error instanceof StaffValidationError) {
        throw new Error(error.message);
      }

      throw error;
    }
  },
});
