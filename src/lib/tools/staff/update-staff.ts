import { tool } from "ai";
import { z } from "zod";
import { StaffValidationError } from "@/lib/staff/errors";
import { updateStaff } from "@/lib/staff/service";
import { staffSkillSchema, staffToolDefSchema } from "@/lib/staff/validation";
import { staffToolContextSchema } from "@/lib/tools/staff/context";

export const updateStaffTool = tool({
  description:
    "Update an existing staff member's profile. Only pass fields that should change. Arrays (skills, tools, documentIds) replace the full list when provided.",
  inputSchema: z
    .object({
      staffId: z.string().uuid().describe("Staff member ID from list_staff"),
      name: z.string().min(1).optional().describe("Display name"),
      role: z.string().min(1).optional().describe("Job role"),
      instructions: z
        .string()
        .min(1)
        .optional()
        .describe("System prompt / job description"),
      skills: z
        .array(staffSkillSchema)
        .optional()
        .describe("Full skills list (replaces existing skills)"),
      tools: z
        .array(staffToolDefSchema)
        .optional()
        .describe("Full tools list (replaces existing tools)"),
      documentIds: z
        .array(z.string().uuid())
        .optional()
        .describe("Full linked document IDs (replaces existing links)"),
      useSandbox: z
        .boolean()
        .optional()
        .describe("Whether staff runs tasks in a sandbox"),
      model: z
        .string()
        .min(1)
        .nullable()
        .optional()
        .describe("Model override, or null to clear"),
    })
    .refine(
      (value) =>
        value.name !== undefined ||
        value.role !== undefined ||
        value.instructions !== undefined ||
        value.skills !== undefined ||
        value.tools !== undefined ||
        value.documentIds !== undefined ||
        value.useSandbox !== undefined ||
        value.model !== undefined,
      { message: "At least one field to update must be provided." }
    ),
  contextSchema: staffToolContextSchema,
  execute: async ({ staffId, ...updates }, { context }) => {
    try {
      const updated = await updateStaff(context.userId, staffId, updates);

      if (!updated) {
        throw new Error("Staff member not found.");
      }

      return {
        staffId: updated.id,
        name: updated.name,
        role: updated.role,
        avatarSprite: updated.avatarSprite,
        status: updated.status,
        useSandbox: updated.useSandbox,
        model: updated.model,
        instructions: updated.instructions,
        skills: updated.skills,
        tools: updated.tools,
        documentIds: updated.documentIds,
        warning: updated.duplicateNameWarning,
      };
    } catch (error) {
      if (error instanceof StaffValidationError) {
        throw new Error(error.message);
      }

      throw error;
    }
  },
});
