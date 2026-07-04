import type { Skill, staffStatusEnum, ToolDef } from "@/db/schema";

export type StaffStatus = (typeof staffStatusEnum.enumValues)[number];

export type StaffTemplateId = "writer";

export type StaffSkill = Skill;

export type StaffToolDef = ToolDef;

export interface StaffSummary {
  activeTasks: number;
  avatarSprite: string;
  hiredAt: string;
  id: string;
  name: string;
  role: string;
  status: StaffStatus;
  useSandbox: boolean;
}

export interface StaffTaskSummary {
  brief: string;
  createdAt: string;
  id: string;
  status: string;
}

export interface StaffDetail extends StaffSummary {
  documentIds: string[];
  instructions: string;
  model: string | null;
  recentTasks: StaffTaskSummary[];
  skills: StaffSkill[];
  tools: StaffToolDef[];
}

export interface HireStaffInput {
  documentIds?: string[];
  instructions: string;
  name: string;
  role: string;
  template?: StaffTemplateId;
  useSandbox?: boolean;
}

export interface HireStaffResult extends StaffSummary {
  assignedDeskSlotId?: string;
  duplicateNameWarning?: string;
}

export interface UpdateStaffInput {
  documentIds?: string[];
  instructions?: string;
  model?: string | null;
  name?: string;
  role?: string;
  skills?: StaffSkill[];
  tools?: StaffToolDef[];
  useSandbox?: boolean;
}

export interface UpdateStaffResult extends StaffDetail {
  duplicateNameWarning?: string;
}
