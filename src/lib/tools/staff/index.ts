import { tool } from "ai";
import { z } from "zod";
import { pendingToolExecute } from "@/lib/tools/pending";

export const hireStaffTool = tool({
  description: "Hire a new specialist staff member",
  inputSchema: z.object({
    name: z.string(),
    role: z.string(),
    template: z
      .enum(["writer", "researcher", "analyst", "reviewer", "social"])
      .optional(),
    instructions: z.string(),
    documentIds: z.array(z.string().uuid()).optional(),
    useSandbox: z.boolean().optional(),
  }),
  execute: pendingToolExecute,
});

export const listStaffTool = tool({
  description: "List all hired staff members and their status",
  inputSchema: z.object({
    status: z.enum(["idle", "working", "offline"]).optional(),
  }),
  execute: pendingToolExecute,
});

export const staffTools = {
  hire_staff: hireStaffTool,
  list_staff: listStaffTool,
} as const;
