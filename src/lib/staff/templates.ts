import type {
  HireStaffInput,
  StaffSkill,
  StaffTemplateId,
  StaffToolDef,
} from "@/lib/staff/types";
import { writerTemplate } from "@/lib/templates/writer";

export interface AppliedStaffProfile {
  avatarSprite: string;
  instructions: string;
  role: string;
  skills: StaffSkill[];
  tools: StaffToolDef[];
  useSandbox: boolean;
}

const STAFF_TEMPLATES = {
  writer: writerTemplate,
} as const;

export function applyTemplate(
  templateId: StaffTemplateId,
  overrides: Pick<HireStaffInput, "instructions" | "role" | "useSandbox">
): AppliedStaffProfile {
  const template = STAFF_TEMPLATES[templateId];

  return {
    role: overrides.role || template.role,
    avatarSprite: template.avatarSprite,
    useSandbox: overrides.useSandbox ?? template.useSandbox,
    instructions: mergeInstructions(
      template.defaultInstructions,
      overrides.instructions
    ),
    skills: [...template.skills],
    tools: [...template.tools],
  };
}

function mergeInstructions(
  defaultInstructions: string,
  userInstructions: string
): string {
  const trimmedUser = userInstructions.trim();
  if (!trimmedUser) {
    return defaultInstructions;
  }

  return `${defaultInstructions}\n\n## User-specific requirements\n\n${trimmedUser}`;
}

export function resolveStaffProfile(
  input: HireStaffInput
): AppliedStaffProfile {
  if (input.template) {
    return applyTemplate(input.template, input);
  }

  return {
    role: input.role,
    avatarSprite: "default",
    useSandbox: input.useSandbox ?? false,
    instructions: input.instructions,
    skills: [],
    tools: [],
  };
}
