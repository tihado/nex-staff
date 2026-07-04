import { z } from "zod";

export const documentToolContextSchema = z.object({
  userId: z.string().uuid(),
});

export type DocumentToolContext = z.infer<typeof documentToolContextSchema>;
