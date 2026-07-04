export type HireTone = "casual" | "formal" | "technical";

export type HireFlowPhase =
  | "idle"
  | "task_propose"
  | "propose"
  | "explain"
  | "gather_name"
  | "gather_tone"
  | "gather_docs"
  | "confirm"
  | "submitting"
  | "celebrate"
  | "delegate_offer"
  | "error";

export interface HireFlowDraft {
  deskSlotId?: string;
  documentIds: string[];
  name: string;
  pendingTaskBrief?: string;
  role: "Content Writer";
  template: "writer";
  tone: HireTone;
}

export const DEFAULT_HIRE_DRAFT: HireFlowDraft = {
  name: "",
  tone: "casual",
  documentIds: [],
  role: "Content Writer",
  template: "writer",
};
