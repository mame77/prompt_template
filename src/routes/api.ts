import { Hono } from 'hono'
import { getSessionUser } from '../lib/auth.js'
import { getDB } from '../lib/db.js'

export const apiRoute = new Hono()

apiRoute.post('/templates', async (c) => {
  const user = await getSessionUser(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const body = await c.req.parseBody()

  const title = body.title as string
  const description = (body.description as string) || ''
  const category = (body.category as string) || ''
  const tags = (body.tags as string) || ''
  const templateBody = (body.body as string) || ''
  const variableConfigRaw = (body.variable_config as string) || '[]'

  if (!title || !templateBody) {
    return c.json({ error: 'Title and body are required' }, 400)
  }

  let variableConfig: unknown[]
  try {
    variableConfig = JSON.parse(variableConfigRaw)
  } catch {
    variableConfig = []
  }

  const db = getDB(c)
  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  try {
    await db
      .prepare(
        `INSERT INTO templates (id, title, description, header, fields, body, variable_config, category, tags, author_id, created_at, updated_at)
         VALUES (?, ?, ?, '', '[]', ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        id,
        title,
        description,
        templateBody,
        JSON.stringify(variableConfig),
        category,
        tags,
        user.id,
        now,
        now,
      )
      .run()
  } catch (e) {
    console.error('Insert error:', e)
    return c.json({ error: 'Failed to create template' }, 500)
  }

  return c.redirect(`/templates/${id}`)
})

apiRoute.post('/templates/:id/delete', async (c) => {
  const user = await getSessionUser(c)
  if (!user) return c.redirect('/login')

  const db = getDB(c)
  const id = c.req.param('id')

  let row: { author_id: string } | undefined
  try {
    row = (await db
      .prepare('SELECT author_id FROM templates WHERE id = ?')
      .bind(id)
      .first()) as { author_id: string } | undefined
  } catch (e) {
    console.error('Query error:', e)
  }

  if (!row) return c.notFound()
  if (row.author_id !== user.id) return c.json({ error: 'Forbidden' }, 403)

  try {
    await db
      .prepare('DELETE FROM templates WHERE id = ?')
      .bind(id)
      .run()
  } catch (e) {
    console.error('Delete error:', e)
  }

  return c.redirect('/')
})
