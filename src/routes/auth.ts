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
      { title: 'ログイン', user: null },
      `
      <div class="max-w-[420px] mx-auto my-24 mb-16 text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-10 px-8">
        <h1 class="text-2xl font-bold mb-2 tracking-tight">ログイン</h1>
        <p class="text-gray-500 dark:text-gray-400 mb-8 text-sm leading-relaxed">Google アカウントでログインして、プロンプトテンプレートを作成しましょう。</p>
        <a href="${url}" class="btn btn-google">
          Google でログイン
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
