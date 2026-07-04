import { z } from "zod";

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
