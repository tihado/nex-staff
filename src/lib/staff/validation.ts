import { z } from "zod";

export const staffStatusSchema = z.enum(["idle", "working", "offline"]);

export const staffTemplateIdSchema = z.enum(["writer"]);

export const staffToolHandlerSchema = z.enum([
  "http",
  "rag",
  "sandbox_bash",
  "sandbox_file",
]);

export const staffSkillSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  content: z.string().optional(),
});

export const staffToolDefSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  handler: staffToolHandlerSchema.optional(),
  inputSchema: z.record(z.string(), z.unknown()).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

export const hireStaffBodySchema = z.object({
  documentIds: z.array(z.string().uuid()).optional(),
  instructions: z.string().min(1),
  name: z.string().min(1),
  role: z.string().min(1),
  template: staffTemplateIdSchema.optional(),
  useSandbox: z.boolean().optional(),
});

export const listStaffQuerySchema = z.object({
  status: staffStatusSchema.optional(),
});

export const updateStaffBodySchema = z
  .object({
    documentIds: z.array(z.string().uuid()).optional(),
    instructions: z.string().min(1).optional(),
    model: z.string().min(1).nullable().optional(),
    name: z.string().min(1).optional(),
    role: z.string().min(1).optional(),
    skills: z.array(staffSkillSchema).optional(),
    tools: z.array(staffToolDefSchema).optional(),
    useSandbox: z.boolean().optional(),
  })
  .refine(
    (value) =>
      value.documentIds !== undefined ||
      value.instructions !== undefined ||
      value.model !== undefined ||
      value.name !== undefined ||
      value.role !== undefined ||
      value.skills !== undefined ||
      value.tools !== undefined ||
      value.useSandbox !== undefined,
    { message: "At least one field must be provided to update." }
  );
