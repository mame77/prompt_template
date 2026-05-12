import { serve } from '@hono/node-server'

import { createApp } from './app.js'
import { env } from './config/env.js'

const app = createApp()

serve(
  {
    fetch: app.fetch,
    hostname: env.HOST,
    port: env.PORT,
  },
  (info) => {
    console.log(
      `Server is running on http://${info.address}:${String(info.port)}`,
    )
  },
)
