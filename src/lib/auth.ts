import { type Context } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { getDB } from './db.js'
import { uuidv7 } from './id.js'

interface GoogleUser {
  sub: string
  email: string
  name: string
  picture: string
}

export interface SessionUser {
  id: string
  google_id: string
  email: string | null
  username: string
  avatar_url: string | null
}

export const getSessionUser = async (c: Context): Promise<SessionUser | null> => {
  const sessionId = getCookie(c, 'session')
  if (!sessionId) return null

  const db = getDB(c)
  try {
    const row = await db
      .prepare(
        `SELECT u.id, u.google_id, u.email, u.username, u.avatar_url
         FROM sessions s JOIN users u ON s.user_id = u.id
         WHERE s.id = ?`,
      )
      .bind(sessionId)
      .first() as SessionUser | null

    if (!row) {
      deleteCookie(c, 'session')
      return null
    }
    return row
  } catch {
    return null
  }
}

export const getGoogleOauthUrl = (c: Context): string => {
  const env = c.env as Env
  const clientId = (env.GOOGLE_CLIENT_ID as string) || ''
  const redirectUri = (env.GOOGLE_REDIRECT_URI as string) || ''
  const state = crypto.randomUUID()
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'openid email profile')
  url.searchParams.set('state', state)
  return url.toString()
}

interface GoogleTokenResponse {
  access_token: string
  id_token: string
}

export const exchangeGoogleCode = async (
  c: Context,
  code: string,
): Promise<GoogleUser | null> => {
  const env = c.env as Env
  const clientId = (env.GOOGLE_CLIENT_ID as string) || ''
  const clientSecret = (env.GOOGLE_CLIENT_SECRET as string) || ''
  const redirectUri = (env.GOOGLE_REDIRECT_URI as string) || ''

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) return null

  const tokenData = (await tokenRes.json()) as GoogleTokenResponse
  if (!tokenData.access_token) return null

  const userRes = await fetch(
    'https://www.googleapis.com/oauth2/v3/userinfo',
    {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: 'application/json',
      },
    },
  )

  if (!userRes.ok) return null

  return (await userRes.json()) as GoogleUser
}

export const createOrGetUser = async (
  c: Context,
  googleUser: GoogleUser,
): Promise<SessionUser> => {
  const db = getDB(c)

  const existing = (await db
    .prepare('SELECT * FROM users WHERE google_id = ?')
    .bind(googleUser.sub)
    .first()) as SessionUser | undefined

  if (existing) {
    await db
      .prepare(
        'UPDATE users SET username = ?, email = ?, avatar_url = ? WHERE google_id = ?',
      )
      .bind(googleUser.name, googleUser.email, googleUser.picture, googleUser.sub)
      .run()
    return existing
  }

  const newUser: SessionUser = {
    id: uuidv7(),
    google_id: googleUser.sub,
    email: googleUser.email,
    username: googleUser.name,
    avatar_url: googleUser.picture,
  }

  await db
    .prepare(
      'INSERT INTO users (id, google_id, email, username, avatar_url) VALUES (?, ?, ?, ?, ?)',
    )
    .bind(newUser.id, newUser.google_id, newUser.email, newUser.username, newUser.avatar_url)
    .run()

  return newUser
}

export const createSession = async (c: Context, userId: string) => {
  const sessionId = uuidv7()
  const db = getDB(c)
  await db
    .prepare('INSERT INTO sessions (id, user_id) VALUES (?, ?)')
    .bind(sessionId, userId)
    .run()

  const isSecure = c.req.url.startsWith('https://')
  setCookie(c, 'session', sessionId, {
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
    secure: isSecure,
    maxAge: 60 * 60 * 24 * 30,
  })
}

export const deleteSession = async (c: Context) => {
  const sessionId = getCookie(c, 'session')
  if (sessionId) {
    const db = getDB(c)
    await db
      .prepare('DELETE FROM sessions WHERE id = ?')
      .bind(sessionId)
      .run()
  }
  deleteCookie(c, 'session')
}
