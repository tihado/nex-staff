import { Agent, type SDKAgent } from "@cursor/sdk";
import type { StaffGithubConfig, staff, task } from "@/db/schema";
import { saveCursorAgentId } from "@/lib/staff/service";

function getCursorApiKey(): string {
  const apiKey = process.env.CURSOR_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("CURSOR_API_KEY is not configured.");
  }

  return apiKey;
}

export async function resolveCursorAgent(input: {
  github: StaffGithubConfig;
  staff: typeof staff.$inferSelect;
}): Promise<SDKAgent> {
  const apiKey = getCursorApiKey();
  const existingAgentId = input.github.cursorAgentId;

  const agent = existingAgentId
    ? await Agent.resume(existingAgentId, { apiKey })
    : await Agent.create({
        apiKey,
        model: { id: "composer-2.5" },
        name: `${input.staff.name} (${input.staff.role})`,
        cloud: {
          repos: [
            {
              url: input.github.repoUrl,
              startingRef: input.github.defaultBranch,
            },
          ],
          autoCreatePR: true,
        },
      });

  if (!existingAgentId && agent.agentId) {
    await saveCursorAgentId(input.staff.id, agent.agentId);
  }

  return agent;
}

export function buildCoderPrompt(
  taskRow: typeof task.$inferSelect,
  staffRow: typeof staff.$inferSelect
): string {
  return [
    "# Task brief",
    taskRow.brief.trim(),
    "",
    "# Staff instructions",
    staffRow.instructions.trim(),
  ].join("\n");
}

export function buildCoderTaskTitle(brief: string): string {
  return brief.trim().split("\n")[0]?.slice(0, 120) || "Coder task";
}
