import type { Context } from 'hono'

export const getDB = (c: Context | any): any => {
  const env = c.env as Record<string, unknown>
  return env.DB
}
