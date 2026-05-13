import { Hono } from 'hono'
import { layout } from '../views/layout.js'
import {
  getGoogleOauthUrl,
  exchangeGoogleCode,
  createOrGetUser,
  createSession,
  deleteSession,
  getSessionUser,
} from '../lib/auth.js'

export const authRoute = new Hono()

authRoute.get('/login', async (c) => {
  const user = await getSessionUser(c)
  if (user) return c.redirect('/')

  const url = getGoogleOauthUrl(c)

  return c.html(
    layout(
      { title: 'Login', user: null },
      `
      <div class="login-page">
        <h1>Login</h1>
        <p>Sign in with Google to create your own prompt templates.</p>
        <a href="${url}" class="btn btn-primary btn-google">
          Sign in with Google
        </a>
      </div>`,
    ),
  )
})

authRoute.get('/auth/google', async (c) => {
  const code = c.req.query('code')
  if (!code) return c.redirect('/')

  const googleUser = await exchangeGoogleCode(c, code)
  if (!googleUser) return c.redirect('/')

  const user = await createOrGetUser(c, googleUser)
  await createSession(c, user.id)

  return c.redirect('/')
})

authRoute.post('/auth/logout', async (c) => {
  await deleteSession(c)
  return c.redirect('/')
})
