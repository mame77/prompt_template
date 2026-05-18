import { Hono } from 'hono'
import { getSessionUser } from '../lib/auth.js'
import { getDB } from '../lib/db.js'
import { extractVariables, renderPrompt, autoLabel } from '../lib/render.js'
import type { VariableConfig } from '../lib/render.js'
import {
  layout,
  escapeHtml,
  templateCard,
  fieldRow,
  splitLayout,
  previewPanel,
  tabNav,
  categoryPills,
  searchBar,
  CATEGORIES,
} from '../views/layout.js'

interface TemplateRow {
  id: string
  title: string
  description: string
  header: string
  fields: string
  body: string
  variable_config: string
  category: string
  tags: string
  author_id: string
  username: string
}

export const pagesRoute = new Hono()

pagesRoute.get('/', async (c) => {
  const user = await getSessionUser(c)
  const db = getDB(c)

  const q = c.req.query('q') || ''
  const category = c.req.query('category') || ''
  const tab = c.req.query('tab') || 'all'

  let sql = `SELECT t.id, t.title, t.description, t.category, u.username
             FROM templates t
             JOIN users u ON t.author_id = u.id`
  const params: string[] = []
  const conditions: string[] = []

  if (tab === 'mine' && user) {
    conditions.push('t.author_id = ?')
    params.push(user.id)
  }

  if (category && category !== 'すべて') {
    conditions.push('t.category = ?')
    params.push(category)
  }

  if (q) {
    conditions.push('(t.title LIKE ? OR t.description LIKE ?)')
    params.push(`%${q}%`, `%${q}%`)
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ')
  }

  sql += ' ORDER BY t.created_at DESC'

  let rows: Array<{
    id: string
    title: string
    description: string
    category: string
    username: string
  }> = []
  try {
    const result = await db.prepare(sql).bind(...params).all()
    rows = result.results || []
  } catch (e) {
    console.error('Query error:', e)
  }

  const list = rows.map(templateCard).join('\n')

  const activeCategory = category || 'すべて'
  const query = q || ''

  return c.html(
    layout(
      { title: 'Home', user },
      `
      <div class="page-header">
        <h1>Prompt Templates</h1>
        ${user ? '<a href="/templates/new" class="btn btn-primary">New Template</a>' : ''}
      </div>
      ${searchBar(query)}
      ${categoryPills(activeCategory)}
      ${tabNav(tab, !!user, activeCategory, query)}
      <div class="template-grid" id="template-grid">
        ${list || '<p class="empty-state">No templates found.</p>'}
      </div>`,
    ),
  )
})

pagesRoute.get('/templates/new', async (c) => {
  const user = await getSessionUser(c)
  if (!user) return c.redirect('/login')

  return c.html(
    layout(
      { title: 'New Template', user },
      `
      <div class="form-page">
        <h1>New Template</h1>
        <form action="/templates" method="POST" class="template-form">
          <div class="field-row">
            <label class="field-label" for="title">Title *</label>
            <input type="text" id="title" name="title" class="field-input" required autocomplete="off">
          </div>
          <div class="field-row">
            <label class="field-label" for="category">Category</label>
            <select id="category" name="category" class="field-input field-select">
              <option value="">-- select --</option>
              ${CATEGORIES.filter((c) => c !== 'すべて').map((c) => `<option value="${c}">${c}</option>`).join('')}
            </select>
          </div>
          <div class="field-row">
            <label class="field-label" for="tags">Tags</label>
            <input type="text" id="tags" name="tags" class="field-input" placeholder="comma, separated, tags" autocomplete="off">
          </div>
          <div class="field-row">
            <label class="field-label" for="description">Description</label>
            <textarea id="description" name="description" class="field-input field-textarea"></textarea>
          </div>
          <div class="field-row">
            <label class="field-label" for="body">Body *</label>
            <p class="field-hint">Use <code>{{variable_name}}</code> to define variables. Each variable will become an input field.</p>
            <textarea id="body" name="body" class="field-input field-textarea field-body" required placeholder="Write your prompt template here. Use {{variable_name}} for dynamic parts." oninput="updateVarPreview()"></textarea>
          </div>

          <div id="var-config-panel" class="var-config-panel">
            <div class="fields-section-label">Variable Settings</div>
            <p class="field-hint">Click each variable to configure its label, type, and options.</p>
            <div id="var-config-rows"></div>
          </div>

          <input type="hidden" name="variable_config" id="variable_config_input" value="[]">

          <button type="submit" class="btn btn-primary btn-generate">Create Template</button>
        </form>
      </div>

      <script>
        var varConfig = {};

        function updateVarPreview() {
          var body = document.getElementById('body').value;
          var matches = body.match(/\\{\\{(\\w+)\\}\\}/g) || [];
          var keys = [...new Set(matches.map(function(m) { return m.slice(2, -2); }))];

          var container = document.getElementById('var-config-rows');
          var panel = document.getElementById('var-config-panel');

          if (keys.length === 0) {
            panel.style.display = 'none';
            return;
          }
          panel.style.display = 'block';

          var html = '';
          for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            if (!varConfig[key]) {
              varConfig[key] = { label: autoLabel(key), type: 'text', options: '' };
            }
            var cfg = varConfig[key];
            html += '<div class="var-config-row">' +
              '<div class="var-config-header" onclick="this.parentElement.classList.toggle(\\'var-expanded\\')">' +
                '<span class="var-name">{{' + key + '}}</span>' +
                '<span class="var-label-preview">' + escapeHtml2(cfg.label) + '</span>' +
                '<span class="var-type-badge">' + cfg.type + '</span>' +
              '</div>' +
              '<div class="var-config-body">' +
                '<div class="var-config-field">' +
                  '<label class="field-label">Label</label>' +
                  '<input type="text" class="field-input" value="' + escapeHtml2(cfg.label) + '" onchange="updateVarKey(\\'' + key + '\\', \\'label\\', this.value)">' +
                '</div>' +
                '<div class="var-config-field">' +
                  '<label class="field-label">Type</label>' +
                  '<select class="field-input field-select" onchange="updateVarKey(\\'' + key + '\\', \\'type\\', this.value); toggleOptions(this, \\'' + key + '\\')">' +
                    '<option value="text"' + (cfg.type === 'text' ? ' selected' : '') + '>Text</option>' +
                    '<option value="select"' + (cfg.type === 'select' ? ' selected' : '') + '>Select</option>' +
                  '</select>' +
                '</div>' +
                '<div class="var-config-field var-options-field"' + (cfg.type !== 'select' ? ' style="display:none"' : '') + '>' +
                  '<label class="field-label">Options (comma separated)</label>' +
                  '<input type="text" class="field-input" value="' + escapeHtml2(cfg.options) + '" onchange="updateVarKey(\\'' + key + '\\', \\'options\\', this.value)" placeholder="option1, option2, option3">' +
                '</div>' +
              '</div>' +
            '</div>';
          }
          container.innerHTML = html;
          updateHiddenConfig();
        }

        function updateVarKey(key, field, value) {
          if (!varConfig[key]) varConfig[key] = { label: key, type: 'text', options: '' };
          varConfig[key][field] = value;
          updateHiddenConfig();
        }

        function toggleOptions(select, key) {
          var row = select.closest('.var-config-row');
          var optsField = row.querySelector('.var-options-field');
          optsField.style.display = select.value === 'select' ? 'block' : 'none';
        }

        function updateHiddenConfig() {
          var config = [];
          for (var key in varConfig) {
            var c = varConfig[key];
            var entry = { key: key, label: c.label, type: c.type };
            if (c.type === 'select' && c.options) {
              entry.options = c.options.split(',').map(function(s) { return s.trim(); }).filter(function(s) { return s; });
            }
            config.push(entry);
          }
          document.getElementById('variable_config_input').value = JSON.stringify(config);
        }

        function autoLabel(key) {
          return key.replace(/_/g, ' ').replace(/\\b\\w/g, function(c) { return c.toUpperCase(); });
        }

        function escapeHtml2(s) {
          return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        }
      </script>`,
    ),
  )
})

pagesRoute.get('/templates/:id', async (c) => {
  const user = await getSessionUser(c)
  const db = getDB(c)
  const id = c.req.param('id')

  let row: TemplateRow | undefined
  try {
    row = (await db
      .prepare(
        `SELECT t.*, u.username
         FROM templates t
         JOIN users u ON t.author_id = u.id
         WHERE t.id = ?`,
      )
      .bind(id)
      .first()) as TemplateRow | undefined
  } catch (e) {
    console.error('Query error:', e)
  }

  if (!row) return c.notFound()

  const isOwner = user?.id === row.author_id
  const body = row.body || ''

  let variables: VariableConfig[] = []
  try {
    variables = JSON.parse(row.variable_config || '[]')
  } catch {}

  const detectedVars = extractVariables(body)
  const fieldHtml = detectedVars
    .map((key) => {
      const config = variables.find((v) => v.key === key)
      const label = config?.label ?? autoLabel(key)
      const type = config?.type ?? 'text'
      return fieldRow(key, label, type, config?.options, config?.placeholder)
    })
    .join('\n')

  const bodyPreview = body
    ? `<div class="body-preview"><pre class="body-text">${escapeHtml(body)}</pre></div>`
    : ''

  const hasBody = !!body

  const metaHtml = `
    <div class="template-meta">
      <div class="template-meta-top">
        <h1>${escapeHtml(row.title)}</h1>
        ${row.category ? `<span class="card-category">${escapeHtml(row.category)}</span>` : ''}
      </div>
      ${row.description ? `<p class="template-desc">${escapeHtml(row.description)}</p>` : ''}
      <span class="card-author">by ${escapeHtml(row.username)}</span>
      ${isOwner ? `<form action="/templates/${id}/delete" method="POST" class="inline-form delete-form" onsubmit="return confirm('Delete this template?')"><button class="btn-text btn-danger">Delete</button></form>` : ''}
    </div>`

  if (!hasBody) {
    return c.html(
      layout(
        { title: row.title, user },
        `
        <div class="template-page">
          ${metaHtml}
          <div class="template-fallback">
            <p>This template uses the legacy format and cannot be edited here.</p>
          </div>
        </div>`,
      ),
    )
  }

  const formHtml = `
    <form
      hx-post="/templates/${id}/render"
      hx-target="#result-area"
      hx-swap="innerHTML"
      class="template-form"
    >
      ${bodyPreview}
      ${fieldHtml}
      <button type="submit" class="btn btn-primary btn-generate">
        Generate Prompt
      </button>
    </form>`

  const previewHtml = `
    <div id="result-area">
      ${previewPanel(`Fill in the fields${detectedVars.length > 0 ? ' on the left' : ''} and click "Generate Prompt" to see the result.`)}
    </div>`

  return c.html(
    layout(
      { title: row.title, user },
      `
      <div class="template-page">
        ${metaHtml}
        ${splitLayout(formHtml, previewHtml)}
      </div>
      <script>
        function copyPrompt(btn) {
          var text = document.getElementById('prompt-display');
          if (!text) return;
          navigator.clipboard.writeText(text.textContent).then(function() {
            var orig = btn.textContent;
            btn.textContent = 'Copied!';
            setTimeout(function() { btn.textContent = orig; }, 2000);
          });
        }
      </script>`,
    ),
  )
})

pagesRoute.post('/templates/:id/render', async (c) => {
  const db = getDB(c)
  const id = c.req.param('id')

  let row: { body: string; variable_config: string } | undefined
  try {
    row = (await db
      .prepare('SELECT body, variable_config FROM templates WHERE id = ?')
      .bind(id)
      .first()) as { body: string; variable_config: string } | undefined
  } catch (e) {
    console.error('Query error:', e)
  }

  if (!row) return c.notFound()

  const parsedBody = await c.req.parseBody()

  const detectedVars = extractVariables(row.body)
  const values: Record<string, string> = {}
  for (const v of detectedVars) {
    values[v] = (parsedBody[v] as string) || ''
  }

  const rendered = renderPrompt(row.body, values)

  return c.html(previewPanel(rendered))
})
