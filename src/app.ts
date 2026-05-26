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
      try {
        await seedTemplates(c.env as Record<string, unknown>)
        seeded = true
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
      `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>ページが見つかりません</title><link rel="stylesheet" href="/style.css"></head><body class="bg-gray-50 dark:bg-[#09090b] text-gray-900 dark:text-gray-50 min-h-screen font-sans antialiased"><div class="max-w-[1200px] mx-auto px-6" style="text-align:center;padding:5rem 0"><h1 class="text-5xl font-extrabold bg-gradient-to-r from-violet-500 via-violet-600 to-violet-700 bg-clip-text text-transparent">404</h1><p class="text-gray-500 dark:text-gray-400 my-2 mb-6">ページが見つかりません</p><a href="/" class="btn btn-secondary">ホームに戻る</a></div></body></html>`,
      404,
    ),
  )

  app.onError((error, c) => {
    console.error(error)
    return c.html(
      `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>サーバーエラー</title><link rel="stylesheet" href="/style.css"></head><body class="bg-gray-50 dark:bg-[#09090b] text-gray-900 dark:text-gray-50 min-h-screen font-sans antialiased"><div class="max-w-[1200px] mx-auto px-6" style="text-align:center;padding:5rem 0"><h1 class="text-5xl font-extrabold bg-gradient-to-r from-violet-500 via-violet-600 to-violet-700 bg-clip-text text-transparent">500</h1><p class="text-gray-500 dark:text-gray-400 my-2 mb-6">サーバーエラーが発生しました</p><a href="/" class="btn btn-secondary">ホームに戻る</a></div></body></html>`,
      500,
    )
  })

  return app
}
