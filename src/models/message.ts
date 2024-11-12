import z from "zod";

export const messageSchema = z.object({
  method: z.string(),
  params: z.any(),
});

export type Message = z.infer<typeof messageSchema>;
