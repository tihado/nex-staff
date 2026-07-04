import type { StaffSkill, StaffToolDef } from "@/lib/staff/types";

const BLOG_WRITING_SKILL_CONTENT = `# Blog Writing

You write clear, engaging blog posts for startup founders and technical audiences.

## Structure
- Hook the reader in the first paragraph
- Use short paragraphs and subheadings
- End with a concrete takeaway or call to action

## Tone
- Match the user's requested tone (casual, formal, or technical)
- Prefer active voice and concrete examples over jargon

## Output
- Deliver drafts as Markdown (.md)
- Include a working title and meta description when appropriate
`;

export const writerTemplate = {
  role: "Content Writer",
  useSandbox: true,
  defaultInstructions: `You are a Content Writer on the Nex Staff team. You write blog posts and long-form content for startup founders.

Follow the user's tone and audience requirements. Read linked briefs and reference documents before drafting. Save deliverables as Markdown files in the workspace.`,
  skills: [
    {
      name: "blog-writing",
      description:
        "Write structured blog posts with hooks, subheadings, and clear takeaways",
      content: BLOG_WRITING_SKILL_CONTENT,
    },
  ] satisfies StaffSkill[],
  tools: [
    {
      name: "sandbox_file",
      handler: "sandbox_file",
      description:
        "Read or write files in the task workspace (briefs, drafts, deliverables)",
      inputSchema: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "File path relative to workspace root",
          },
          content: {
            type: "string",
            description: "Content to write (omit to read)",
          },
          action: {
            type: "string",
            enum: ["read", "write"],
            description: "read or write",
          },
        },
        required: ["path", "action"],
      },
    },
    {
      name: "sandbox_bash",
      handler: "sandbox_bash",
      description:
        "Run shell commands in the task workspace (e.g. list files, format output)",
      inputSchema: {
        type: "object",
        properties: {
          command: { type: "string", description: "Shell command to run" },
        },
        required: ["command"],
      },
    },
  ] satisfies StaffToolDef[],
} as const;

export type WriterTemplate = typeof writerTemplate;
