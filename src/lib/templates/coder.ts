import type { StaffSkill, StaffToolDef } from "@/lib/staff/types";

const TYPESCRIPT_SKILL_CONTENT = `# TypeScript / Next.js

- Prefer explicit types at module boundaries
- Keep changes focused and testable
- Run lint and typecheck when available before opening a PR
`;

export const coderTemplate = {
  role: "Software Engineer",
  runtimeProvider: "cursor_cloud" as const,
  useSandbox: false,
  defaultInstructions: `You are a Software Engineer on the Nex Staff team. You implement features in the linked GitHub repository.

Follow the task brief precisely. Write clean, maintainable code with tests when appropriate. Open a pull request when the work is complete and verified.`,
  skills: [
    {
      name: "typescript-nextjs",
      description:
        "Implement features in TypeScript and Next.js with tests and clear PRs",
      content: TYPESCRIPT_SKILL_CONTENT,
    },
  ] satisfies StaffSkill[],
  tools: [] satisfies StaffToolDef[],
} as const;

export type CoderTemplate = typeof coderTemplate;
