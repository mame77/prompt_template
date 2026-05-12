import { describe, expect, it } from 'bun:test'

import { createApp } from '../src/app.js'

describe('app', () => {
  const app = createApp()

  it('returns service status', async () => {
    const res = await app.request('/')

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toEqual({
      name: 'prompt_template',
      status: 'ok',
    })
  })

  it('returns health status', async () => {
    const res = await app.request('/health')

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toEqual({
      ok: true,
      service: 'prompt_template',
    })
  })

  it('validates message payloads', async () => {
    const res = await app.request('/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        message: 'hello',
      }),
    })

    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data).toMatchObject({
      message: 'hello',
    })
  })
})
