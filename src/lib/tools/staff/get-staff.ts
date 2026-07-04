import { tool } from "ai";
import { z } from "zod";
import { getStaffById } from "@/lib/staff/service";
import { staffToolContextSchema } from "@/lib/tools/staff/context";

export const getStaffTool = tool({
  description:
    "Get a staff member's full profile including instructions, skills, tools, and linked documents.",
  inputSchema: z.object({
    staffId: z.string().uuid().describe("Staff member ID from list_staff"),
  }),
  contextSchema: staffToolContextSchema,
  execute: async ({ staffId }, { context }) => {
    const staffMember = await getStaffById(context.userId, staffId);

    if (!staffMember) {
      throw new Error("Staff member not found.");
    }

    return {
      id: staffMember.id,
      name: staffMember.name,
      role: staffMember.role,
      avatarSprite: staffMember.avatarSprite,
      status: staffMember.status,
      useSandbox: staffMember.useSandbox,
      model: staffMember.model,
      instructions: staffMember.instructions,
      skills: staffMember.skills,
      tools: staffMember.tools,
      documentIds: staffMember.documentIds,
      activeTasks: staffMember.activeTasks,
      hiredAt: staffMember.hiredAt,
      recentTasks: staffMember.recentTasks,
    };
  },
});
