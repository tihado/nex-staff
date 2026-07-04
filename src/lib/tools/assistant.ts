import { documentTools } from "@/lib/tools/documents";
import { staffTools } from "@/lib/tools/staff";
import { taskTools } from "@/lib/tools/tasks";

export const assistantTools = {
  ...documentTools,
  ...staffTools,
  ...taskTools,
} as const;

export type AssistantTools = typeof assistantTools;
