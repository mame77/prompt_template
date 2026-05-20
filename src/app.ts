import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'
import { logger } from 'hono/logger'

import { authRoute } from './routes/auth.js'
import { pagesRoute } from './routes/pages.js'
import { apiRoute } from './routes/api.js'
import { seedTemplates } from './db/seed.js'

let seeded = false

export const createApp = () => {
  const app = new Hono()

  app.use('*', secureHeaders())
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
      `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>ページが見つかりません</title><link rel="stylesheet" href="/style.css"></head><body><div class="container" style="text-align:center;padding:5rem 0"><h1 style="font-size:3rem;font-weight:800;background:var(--gradient);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">404</h1><p style="color:var(--text-secondary);margin:0.5rem 0 1.5rem">ページが見つかりません</p><a href="/" class="btn btn-secondary">ホームに戻る</a></div></body></html>`,
      404,
    ),
  )

  app.onError((error, c) => {
    console.error(error)
    return c.html(
      `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>サーバーエラー</title><link rel="stylesheet" href="/style.css"></head><body><div class="container" style="text-align:center;padding:5rem 0"><h1 style="font-size:3rem;font-weight:800;background:var(--gradient);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">500</h1><p style="color:var(--text-secondary);margin:0.5rem 0 1.5rem">サーバーエラーが発生しました</p><a href="/" class="btn btn-secondary">ホームに戻る</a></div></body></html>`,
      500,
    )
  })

  return app
}
