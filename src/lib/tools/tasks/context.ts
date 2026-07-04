import { z } from "zod";

export const taskToolContextSchema = z.object({
  userId: z.string().uuid(),
});
