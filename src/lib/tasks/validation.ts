import { z } from "zod";
import { MAX_BRIEF_LENGTH } from "@/lib/tasks/constants";

export const taskStatusSchema = z.enum([
  "pending",
  "running",
  "completed",
  "failed",
  "cancelled",
]);

export const listTasksQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
  staffId: z.string().uuid().optional(),
  status: z
    .string()
    .optional()
    .transform((value) => {
      if (!value) {
        return;
      }

      const statuses = value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      if (statuses.length === 0) {
        return;
      }

      return statuses;
    })
    .pipe(z.array(taskStatusSchema).optional()),
});

export const listTaskEventsQuerySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const taskCheckpointSchema = z.object({
  criteria: z.string().min(1),
  label: z.string().min(1),
  order: z.number().int().nonnegative(),
});

export const delegateTaskBodySchema = z.object({
  acceptanceCriteria: z.string().min(1).optional(),
  brief: z.string().trim().min(1).max(MAX_BRIEF_LENGTH),
  chatId: z.string().uuid().optional(),
  checkpoints: z.array(taskCheckpointSchema).optional(),
  staffId: z.string().uuid(),
});
