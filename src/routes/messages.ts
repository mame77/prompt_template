import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'

const createMessageSchema = z.object({
  message: z.string().trim().min(1).max(1000),
})

export const messagesRoute = new Hono().post(
  '/',
  zValidator('json', createMessageSchema),
  (c) => {
    const body = c.req.valid('json')

    return c.json(
      {
        id: crypto.randomUUID(),
        message: body.message,
      },
      201,
    )
  },
)
