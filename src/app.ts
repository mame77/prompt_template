import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'

import { authRoute } from './routes/auth.js'
import { pagesRoute } from './routes/pages.js'
import { apiRoute } from './routes/api.js'
import { seedTemplates } from './db/seed.js'

let seeded = false

export const createApp = () => {
  const app = new Hono()

  app.use('*', secureHeaders())
  app.use('*', cors())
  app.use('*', logger())

  app.use('*', async (c, next) => {
    if (!seeded) {
      seeded = true
      try {
        await seedTemplates(c.env as Record<string, unknown>)
      } catch (e) {
        console.error('Seed error:', e)
      }
    }
    return next()
  })

  app.route('/', pagesRoute)
  app.route('/', authRoute)
  app.route('/', apiRoute)

  app.notFound((c) =>
    c.html(
      `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><title>Not Found</title><link rel="stylesheet" href="/style.css"></head><body><div class="container" style="text-align:center;padding:4rem 0"><h1>404</h1><p>Page not found.</p><a href="/">Go Home</a></div></body></html>`,
      404,
    ),
  )

  app.onError((error, c) => {
    console.error(error)
    return c.html(
      `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><title>Error</title><link rel="stylesheet" href="/style.css"></head><body><div class="container" style="text-align:center;padding:4rem 0"><h1>500</h1><p>Internal Server Error</p><a href="/">Go Home</a></div></body></html>`,
      500,
    )
  })

  return app
}
