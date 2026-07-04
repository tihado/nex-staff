import { tool } from "ai";
import { z } from "zod";
import { listStaff } from "@/lib/staff/service";
import { staffToolContextSchema } from "@/lib/tools/staff/context";

export const listStaffTool = tool({
  description: "List all hired staff members and their current status.",
  inputSchema: z.object({
    status: z
      .enum(["idle", "working", "offline"])
      .optional()
      .describe("Optional filter by computed status"),
  }),
  contextSchema: staffToolContextSchema,
  execute: async ({ status }, { context }) => {
    const staffMembers = await listStaff(context.userId, { status });

    return {
      count: staffMembers.length,
      staff: staffMembers.map((member) => ({
        id: member.id,
        name: member.name,
        role: member.role,
        avatarSprite: member.avatarSprite,
        status: member.status,
        activeTasks: member.activeTasks,
        useSandbox: member.useSandbox,
        hiredAt: member.hiredAt,
      })),
    };
  },
});
