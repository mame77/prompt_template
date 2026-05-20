import { Hono } from 'hono'
import { getSessionUser } from '../lib/auth.js'
import { getDB } from '../lib/db.js'
import type { VariableConfig } from '../lib/render.js'
import {
  layout,
  escapeHtml,
  templateCard,
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
      { title: 'ホーム', user },
      `
      <div class="page-header">
        <h1>プロンプトテンプレート一覧</h1>
        ${user ? '<a href="/templates/new" class="btn btn-primary">新規作成</a>' : ''}
      </div>
      ${searchBar(query)}
      ${categoryPills(activeCategory)}
      ${tabNav(tab, !!user, activeCategory, query)}
      <div class="template-grid" id="template-grid">
        ${list || '<p class="empty-state">テンプレートが見つかりません</p>'}
      </div>`,
    ),
  )
})

pagesRoute.get('/templates/new', async (c) => {
  const user = await getSessionUser(c)
  if (!user) return c.redirect('/login')

  return c.html(
    layout(
      { title: '新規テンプレート作成', user },
      `
      <div class="form-page">
        <h1>新規テンプレート作成</h1>
        <form action="/templates" method="POST" class="template-form">
          <div class="field-row">
            <label class="field-label" for="title">タイトル *</label>
            <input type="text" id="title" name="title" class="field-input" required autocomplete="off">
          </div>
          <div class="field-row">
            <label class="field-label" for="category">カテゴリ</label>
            <select id="category" name="category" class="field-input field-select">
              <option value="">-- 選択 --</option>
              ${CATEGORIES.filter((c) => c !== 'すべて').map((c) => `<option value="${c}">${c}</option>`).join('')}
            </select>
          </div>
          <div class="field-row">
            <label class="field-label" for="tags">タグ</label>
            <input type="text" id="tags" name="tags" class="field-input" placeholder="カンマ区切りで入力" autocomplete="off">
          </div>
          <div class="field-row">
            <label class="field-label" for="description">説明</label>
            <textarea id="description" name="description" class="field-input field-textarea"></textarea>
          </div>
          <div class="field-row">
            <label class="field-label" for="body">本文 *</label>
            <p class="field-hint"><code>{{変数名}}</code> で変数を定義します。各変数が入力欄になります。</p>
            <textarea id="body" name="body" class="field-input field-textarea field-body" required placeholder="プロンプトテンプレートを入力してください。{{変数名}} で動的部分を指定します。" oninput="updateVarPreview()"></textarea>
          </div>

          <div id="var-config-panel" class="var-config-panel">
            <div class="fields-section-label">変数の設定</div>
            <p class="field-hint">各変数をクリックしてラベル・種類・選択肢を設定します。</p>
            <div id="var-config-rows"></div>
          </div>

          <input type="hidden" name="variable_config" id="variable_config_input" value="[]">

          <button type="submit" class="btn btn-primary btn-generate">テンプレートを作成</button>
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
                  '<label class="field-label">ラベル</label>' +
                  '<input type="text" class="field-input" value="' + escapeHtml2(cfg.label) + '" onchange="updateVarKey(\\'' + key + '\\', \\'label\\', this.value)">' +
                '</div>' +
                '<div class="var-config-field">' +
                  '<label class="field-label">種類</label>' +
                  '<select class="field-input field-select" onchange="updateVarKey(\\'' + key + '\\', \\'type\\', this.value); toggleOptions(this, \\'' + key + '\\')">' +
                    '<option value="text"' + (cfg.type === 'text' ? ' selected' : '') + '>テキスト</option>' +
                    '<option value="select"' + (cfg.type === 'select' ? ' selected' : '') + '>選択式</option>' +
                  '</select>' +
                '</div>' +
                '<div class="var-config-field var-options-field"' + (cfg.type !== 'select' ? ' style="display:none"' : '') + '>' +
                  '<label class="field-label">選択肢（カンマ区切り）</label>' +
                  '<input type="text" class="field-input" value="' + escapeHtml2(cfg.options) + '" onchange="updateVarKey(\\'' + key + '\\', \\'options\\', this.value)" placeholder="選択肢1, 選択肢2, 選択肢3">' +
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

  const metaHtml = `
    <div class="template-meta">
      <div class="template-meta-top">
        <h1>${escapeHtml(row.title)}</h1>
        ${row.category ? `<span class="card-category">${escapeHtml(row.category)}</span>` : ''}
      </div>
      ${row.description ? `<p class="template-desc">${escapeHtml(row.description)}</p>` : ''}
      <span class="card-author">作成者: ${escapeHtml(row.username)}</span>
      ${isOwner ? `<form action="/templates/${id}/delete" method="POST" class="inline-form delete-form" onsubmit="return confirm('このテンプレートを削除しますか？')"><button class="btn-text btn-danger">削除</button></form>` : ''}
    </div>`

  if (!body) {
    return c.html(
      layout(
        { title: row.title, user },
        `
        <div class="template-page">
          ${metaHtml}
          <div class="template-fallback">
            <p>このテンプレートは旧形式のため編集できません。</p>
          </div>
        </div>`,
      ),
    )
  }

  const fieldsHtml = variables
    .filter((v) => body.includes(`{{${v.key}}}`))
    .map((v) => {
      const label = escapeHtml(v.label || v.key)
      if (v.type === 'select' && v.options && v.options.length > 0) {
        const opts = v.options
          .map(
            (o) =>
              `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`,
          )
          .join('')
        return `
        <div class="field-card">
          <label class="field-card-label">${label}</label>
          <select class="field-card-input" data-var="${v.key}" onchange="selectNext(this)">
            <option value="">選択してください</option>
            ${opts}
          </select>
        </div>`
      }
      return `
        <div class="field-card">
          <label class="field-card-label">${label}</label>
          <input type="text" class="field-card-input" data-var="${v.key}" placeholder="${label}" autocomplete="off">
        </div>`
    })
    .join('\n')

  const pageContent = `
    <div class="template-page template-use-page">
      ${metaHtml}

      <div class="fields-section">
        ${fieldsHtml || '<p class="empty-state">このテンプレートには入力項目がありません</p>'}
      </div>

      <div class="complete-section">
        <button class="btn btn-primary btn-complete" id="generate-btn" onclick="generatePrompt()">
          完了
        </button>
      </div>

      <div class="result-panel" id="result-area" style="display:none;">
        <div class="result-header">
          <h2 class="result-title">生成されたプロンプト</h2>
          <button class="btn btn-primary btn-copy" onclick="copyPrompt(this)">コピー</button>
        </div>
        <pre class="prompt-output" id="prompt-display"></pre>
      </div>
    </div>

    <div id="toast" class="toast">コピーしました</div>

    <script id="template-raw-data" type="application/json">${JSON.stringify(body)}</script>
    <script>
    var TEMPLATE_BODY = JSON.parse(document.getElementById('template-raw-data').textContent);
    var BR = String.fromCharCode(10);

    document.addEventListener('DOMContentLoaded', function() {
      var first = document.querySelector('[data-var]');
      if (first) first.focus();
      document.querySelector('.fields-section').addEventListener('keydown', function(e) {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        selectNext(e.target);
      });
    });

    function selectNext(el) {
      var all = document.querySelectorAll('[data-var]');
      var idx = Array.prototype.indexOf.call(all, el);
      if (idx >= 0 && idx < all.length - 1) {
        all[idx + 1].focus();
      } else if (idx === all.length - 1) {
        document.getElementById('result-area').style.display = 'none';
        generatePrompt();
      }
    }

    function generatePrompt() {
      var btn = document.getElementById('generate-btn');
      if (btn.disabled) return;
      btn.disabled = true;
      btn.textContent = 'コピー済み';
      setTimeout(function() {
        btn.disabled = false;
        btn.textContent = '完了';
      }, 2500);

      var inputs = document.querySelectorAll('[data-var]');
      var result = TEMPLATE_BODY;
      inputs.forEach(function(el) {
        var key = el.getAttribute('data-var');
        var value = el.value || el.getAttribute('placeholder') || ('{{' + key + '}}');
        result = result.replace('{{' + key + '}}', value);
      });
      var area = document.getElementById('result-area');
      area.style.display = 'block';
      area.scrollIntoView({ behavior: 'smooth', block: 'start' });
      var wrapped = "\`\`\`" + BR + result + BR + "\`\`\`";
      document.getElementById('prompt-display').textContent = wrapped;
      navigator.clipboard.writeText(wrapped).then(showToast);
    }

    function copyPrompt(btn) {
      var text = document.getElementById('prompt-display').textContent;
      if (!text) return;
      navigator.clipboard.writeText(text).then(showToast);
    }

    function showToast() {
      var t = document.getElementById('toast');
      t.classList.add('show');
      clearTimeout(t._timer);
      t._timer = setTimeout(function() { t.classList.remove('show'); }, 2000);
    }
    </script>`

  return c.html(
    layout({ title: row.title, user }, pageContent),
  )
})
