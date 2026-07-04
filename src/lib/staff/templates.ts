import type { StaffConfig, StaffRuntimeProvider } from "@/db/schema";
import type {
  HireStaffInput,
  StaffSkill,
  StaffTemplateId,
  StaffToolDef,
} from "@/lib/staff/types";
import { coderTemplate } from "@/lib/templates/coder";
import { writerTemplate } from "@/lib/templates/writer";

export interface AppliedStaffProfile {
  config?: StaffConfig;
  instructions: string;
  role: string;
  runtimeProvider?: StaffRuntimeProvider;
  skills: StaffSkill[];
  tools: StaffToolDef[];
  useSandbox: boolean;
}

const STAFF_TEMPLATES = {
  writer: writerTemplate,
  coder: coderTemplate,
} as const;

export function applyTemplate(
  templateId: StaffTemplateId,
  overrides: Pick<
    HireStaffInput,
    "githubRepoUrl" | "instructions" | "role" | "useSandbox"
  >
): AppliedStaffProfile {
  const template = STAFF_TEMPLATES[templateId];

  const profile: AppliedStaffProfile = {
    role: overrides.role || template.role,
    useSandbox: overrides.useSandbox ?? template.useSandbox,
    runtimeProvider:
      "runtimeProvider" in template ? template.runtimeProvider : undefined,
    instructions: mergeInstructions(
      template.defaultInstructions,
      overrides.instructions
    ),
    skills: [...template.skills],
    tools: [...template.tools],
  };

  if (templateId === "coder") {
    profile.config = {
      runtimeProvider: "cursor_cloud",
    };
  }

  return profile;
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
    useSandbox: input.useSandbox ?? false,
    instructions: input.instructions,
    skills: [],
    tools: [],
  };
}
