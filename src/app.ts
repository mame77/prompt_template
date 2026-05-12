import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import { logger } from 'hono/logger'
import { requestId } from 'hono/request-id'
import { secureHeaders } from 'hono/secure-headers'

import { healthRoute } from './routes/health.js'
import { messagesRoute } from './routes/messages.js'

export const createApp = () => {
  const app = new Hono()

  app.use('*', requestId())
  app.use('*', secureHeaders())
  app.use('*', cors())
  app.use('*', logger())

  app.get('/', (c) =>
    c.json({
      name: 'prompt_template',
      status: 'ok',
    }),
  )

  app.route('/health', healthRoute)
  app.route('/messages', messagesRoute)

  app.notFound((c) =>
    c.json(
      {
        error: {
          message: 'Not Found',
        },
      },
      404,
    ),
  )

  app.onError((error, c) => {
    if (error instanceof HTTPException) {
      return error.getResponse()
    }

    console.error(error)

    return c.json(
      {
        error: {
          message: 'Internal Server Error',
        },
      },
      500,
    )
  })

  return app
}

export type AppType = ReturnType<typeof createApp>
