import { z } from "zod";

export const staffToolContextSchema = z.object({
  userId: z.string().uuid(),
});
