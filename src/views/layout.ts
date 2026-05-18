import type { SessionUser } from '../lib/auth.js'

interface LayoutOptions {
  title: string
  user: SessionUser | null
  extraHead?: string
}

export const CATEGORIES = [
  'すべて',
  '執筆',
  'ビジネス',
  'コード',
  '学習',
  'デザイン',
  'マーケティング',
  'その他',
]

export const layout = (
  opts: LayoutOptions,
  content: string,
) => `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${opts.title} — Prompt Template</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <script>
    (function(){var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.setAttribute('data-theme','dark')})();
    function toggleTheme(){var d=document.documentElement;var n=d.getAttribute('data-theme')==='dark'?'light':'dark';d.setAttribute('data-theme',n);localStorage.setItem('theme',n)}
  </script>
  <script src="https://unpkg.com/htmx.org@2.0.4"></script>
  <link rel="stylesheet" href="/style.css">
  ${opts.extraHead ?? ''}
</head>
<body>
  <header class="site-header">
    <div class="container header-inner">
      <a href="/" class="logo">Prompt Template</a>
      <nav class="header-nav">
        <button class="theme-toggle" onclick="toggleTheme()" title="Toggle theme" aria-label="Toggle theme">
          <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
          <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
        </button>
        ${opts.user
          ? `<a href="/?tab=mine" class="nav-link">My Templates</a>
             <form action="/auth/logout" method="POST" class="inline-form">
               <button type="submit" class="btn-text">Logout</button>
             </form>
             <span class="user-name">${escapeHtml(opts.user.username)}</span>`
          : `<a href="/login" class="btn btn-primary">Sign in with Google</a>`}
      </nav>
    </div>
  </header>
  <main class="container main-content">
    ${content}
  </main>
</body>
</html>`

export const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

export const templateCard = (t: {
  id: string
  title: string
  description: string
  username: string
  category: string
}) => `
  <a href="/templates/${t.id}" class="template-card">
    ${t.category ? `<span class="card-category">${escapeHtml(t.category)}</span>` : ''}
    <h3 class="card-title">${escapeHtml(t.title)}</h3>
    <p class="card-desc">${escapeHtml(t.description)}</p>
    <span class="card-author">by ${escapeHtml(t.username)}</span>
  </a>`

export const fieldRow = (
  key: string,
  label: string,
  type: 'text' | 'select' = 'text',
  options?: string[],
  placeholder?: string,
  value = '',
) => {
  const labelHtml = `<label class="field-label" for="field-${key}">${escapeHtml(label)}</label>`

  if (type === 'select' && options && options.length > 0) {
    const opts = options
      .map(
        (o) =>
          `<option value="${escapeHtml(o)}"${o === value ? ' selected' : ''}>${escapeHtml(o)}</option>`,
      )
      .join('')
    return `
      <div class="field-row">
        ${labelHtml}
        <select id="field-${key}" name="${key}" class="field-input field-select">
          <option value="">-- select --</option>
          ${opts}
        </select>
      </div>`
  }

  return `
    <div class="field-row">
      ${labelHtml}
      <input
        type="text"
        id="field-${key}"
        name="${key}"
        class="field-input"
        placeholder="${escapeHtml(placeholder ?? '')}"
        value="${escapeHtml(value)}"
        autocomplete="off"
      >
    </div>`
}

export const splitLayout = (left: string, right: string) => `
  <div class="split-layout">
    <div class="split-left">${left}</div>
    <div class="split-right">${right}</div>
  </div>`

export const previewPanel = (promptText: string) => `
  <div class="preview-panel">
    <div class="preview-header">
      <h2 class="preview-title">Generated Prompt</h2>
      <button class="btn btn-primary btn-copy" id="copy-btn-main" onclick="copyPrompt(this)">
        Copy Prompt
      </button>
    </div>
    <pre id="prompt-display" class="prompt-output">${escapeHtml(promptText)}</pre>
  </div>`

export const tabNav = (
  activeTab: string,
  showMine: boolean,
  category: string,
  query: string,
) => {
  const tabAll = activeTab !== 'mine' ? 'tab-active' : ''
  const tabMine = activeTab === 'mine' ? 'tab-active' : ''
  const qs = (tab: string) => {
    const params = new URLSearchParams()
    if (tab !== 'all') params.set('tab', tab)
    if (category && category !== 'すべて') params.set('category', category)
    if (query) params.set('q', query)
    const q = params.toString()
    return q ? `?${q}` : '/'
  }
  return `
    <div class="tab-bar">
      <a href="/" class="tab ${tabAll}" hx-get="/" hx-target=".template-grid" hx-swap="outerHTML" hx-push-url="true">All</a>
      ${showMine ? `<a href="/?tab=mine" class="tab ${tabMine}" hx-get="/?tab=mine" hx-target=".template-grid" hx-swap="outerHTML" hx-push-url="true">My Templates</a>` : ''}
    </div>`
}

export const categoryPills = (active: string) => {
  const url = (cat: string) => {
    const params = new URLSearchParams()
    if (cat !== 'すべて') params.set('category', cat)
    return params.toString() ? `?${params.toString()}` : '/'
  }
  return `
    <div class="category-pills">
      ${CATEGORIES.map(
        (c) =>
          `<a href="${url(c)}" class="pill ${c === active ? 'pill-active' : ''}" hx-get="${url(c)}" hx-target=".template-grid" hx-swap="outerHTML" hx-push-url="true">${escapeHtml(c)}</a>`,
      ).join('')}
    </div>`
}

export const searchBar = (query: string) => `
  <div class="search-bar">
    <input
      type="text"
      name="q"
      class="field-input search-input"
      placeholder="Search templates..."
      value="${escapeHtml(query)}"
      hx-get="/"
      hx-trigger="keyup changed delay:300ms"
      hx-target=".template-grid"
      hx-swap="outerHTML"
      hx-push-url="true"
      hx-include="[name='q']"
    >
  </div>`

export const variableConfigPanel = (body: string, configJson: string) => {
  const vars = body.match(/\{\{(\w+)\}\}/g)
  if (!vars) return ''

  const keys = [...new Set(vars.map((m) => m.slice(2, -2)))]
  let config: Array<{ key: string; label: string; type: string; options?: string[] }>
  try {
    config = JSON.parse(configJson)
  } catch {
    config = []
  }

  return keys
    .map((key, i) => {
      const existing = config.find((c) => c.key === key)
      const label = existing?.label ?? key
      const type = existing?.type ?? 'text'
      const opts = existing?.options?.join(', ') ?? ''
      return `
      <div class="var-config-row">
        <div class="var-config-header" onclick="this.parentElement.classList.toggle('var-expanded')">
          <span class="var-name">{{${key}}}</span>
          <span class="var-label-preview">${escapeHtml(label)}</span>
          <span class="var-type-badge">${type}</span>
        </div>
        <div class="var-config-body">
          <div class="var-config-field">
            <label class="field-label">Label</label>
            <input type="text" name="var_label_${key}" class="field-input" value="${escapeHtml(label)}" placeholder="${escapeHtml(key)}">
          </div>
          <div class="var-config-field">
            <label class="field-label">Type</label>
            <select name="var_type_${key}" class="field-input field-select">
              <option value="text"${type === 'text' ? ' selected' : ''}>Text</option>
              <option value="select"${type === 'select' ? ' selected' : ''}>Select</option>
            </select>
          </div>
          <div class="var-config-field var-options-field"${type !== 'select' ? ' style="display:none"' : ''}>
            <label class="field-label">Options (comma separated)</label>
            <input type="text" name="var_options_${key}" class="field-input" value="${escapeHtml(opts)}" placeholder="option1, option2, option3">
          </div>
        </div>
      </div>`
    })
    .join('')
}
