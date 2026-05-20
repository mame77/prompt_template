import { describe, expect, test } from 'bun:test'
import { createApp } from './app'

describe('app', () => {
  test('createApp returns an object', () => {
    const app = createApp()
    expect(app).toBeTruthy()
    expect(typeof app.fetch).toBe('function')
  })
})