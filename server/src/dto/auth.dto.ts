import { z } from "zod";

export const googleAuthSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

export type GoogleAuthDto = z.infer<typeof googleAuthSchema>;
