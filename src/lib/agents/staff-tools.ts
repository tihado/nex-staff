import type { ToolSet } from "ai";
import type { staff } from "@/db/schema";
import {
  createSandboxBashTool,
  createSandboxFileTool,
} from "@/lib/sandbox/build-sandbox-tools";
import type { DocumentManifest } from "@/lib/sandbox/types";
import { WRITER_OUTPUT_PATH } from "@/lib/tasks/constants";

export function buildStaffInstructions(
  staffRow: typeof staff.$inferSelect,
  manifest?: DocumentManifest[]
): string {
  const sections: string[] = [staffRow.instructions];

  for (const skill of staffRow.skills ?? []) {
    if (skill.content) {
      sections.push(`## Skill: ${skill.name}\n\n${skill.content}`);
    }
  }

  if (manifest && manifest.length > 0) {
    const docList = manifest
      .map((entry) => `- ${entry.filename} → ${entry.path}`)
      .join("\n");

    sections.push(
      `## Workspace documents\n\nReference documents are available under /workspace/docs/:\n${docList}\n\nRead relevant documents before drafting.`
    );
  }

  sections.push(
    `## Deliverable\n\nWrite the final output to ${WRITER_OUTPUT_PATH} as Markdown.`
  );

  return sections.join("\n\n");
}

export function buildStaffTools(
  staffRow: typeof staff.$inferSelect,
  sessionId?: string
): ToolSet {
  const tools: ToolSet = {};

  for (const toolDef of staffRow.tools ?? []) {
    if (!sessionId) {
      continue;
    }

    if (toolDef.handler === "sandbox_file") {
      tools[toolDef.name] = createSandboxFileTool(
        sessionId,
        toolDef.description
      );
      continue;
    }

    if (toolDef.handler === "sandbox_bash") {
      tools[toolDef.name] = createSandboxBashTool(
        sessionId,
        toolDef.description
      );
    }
  }

  if (staffRow.useSandbox && sessionId && Object.keys(tools).length === 0) {
    tools.sandbox_file = createSandboxFileTool(sessionId);
    tools.sandbox_bash = createSandboxBashTool(sessionId);
  }

  return tools;
}
