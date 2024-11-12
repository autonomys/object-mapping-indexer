import z from 'zod'

export const messageSchema = z.object({
  method: z.string(),
  params: z.any(),
  id: z.number(),
})

export type Message = z.infer<typeof messageSchema>
