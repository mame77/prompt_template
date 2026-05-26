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
  <title>${opts.title} — プロンプトテンプレート</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <script>
    (function(){var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.setAttribute('data-theme','dark')})();
    function toggleTheme(){var d=document.documentElement;var n=d.getAttribute('data-theme')==='dark'?'light':'dark';d.setAttribute('data-theme',n);localStorage.setItem('theme',n)}
  </script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <script src="https://unpkg.com/htmx.org@2.0.4"></script>
  <link rel="stylesheet" href="/style.css">
  ${opts.extraHead ?? ''}
</head>
<body class="bg-gray-50 dark:bg-[#09090b] text-gray-900 dark:text-gray-50 min-h-screen font-sans antialiased">
  <header class="sticky top-0 z-50 bg-white/78 dark:bg-[#09090b]/78 backdrop-blur-2xl saturate-150 border-b border-gray-200 dark:border-gray-800">
    <div class="max-w-[1200px] mx-auto px-6 flex items-center justify-between h-14 gap-6">
      <a href="/" class="font-bold text-[1.05rem] tracking-tight whitespace-nowrap bg-gradient-to-r from-violet-400 via-violet-600 to-violet-700 bg-clip-text text-transparent">プロンプトテンプレート</a>
      <nav class="flex items-center gap-3.5">
        <button class="bg-transparent border border-gray-200 dark:border-gray-700 rounded-full w-9 h-9 flex items-center justify-center cursor-pointer text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-800 transition-all shrink-0 p-0" onclick="toggleTheme()" title="テーマ切替" aria-label="テーマ切替">
          <svg class="hidden dark:block w-4 h-4 stroke-current" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
          <svg class="block dark:hidden w-4 h-4 stroke-current" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
        </button>
        ${opts.user
          ? `<a href="/?tab=mine" class="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">マイテンプレート</a>
             <form action="/auth/logout" method="POST" class="inline">
               <button type="submit" class="btn-text">ログアウト</button>
             </form>
             <span class="text-xs text-gray-400 dark:text-gray-500 px-2.5 py-1 bg-white dark:bg-gray-900 rounded-full border border-gray-200 dark:border-gray-700">${escapeHtml(opts.user.username)}</span>`
          : `<a href="/login" class="btn btn-primary">Google でログイン</a>`}
      </nav>
    </div>
  </header>
  <main class="max-w-[1200px] mx-auto px-6 py-8 pb-16">
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
  <a href="/templates/${t.id}" class="template-card flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 relative gap-1 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-500/10">
    ${t.category ? `<span class="inline-flex text-[0.7rem] font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider bg-violet-50 dark:bg-violet-900/20 px-2 py-0.5 rounded-sm w-fit">${escapeHtml(t.category)}</span>` : ''}
    <h3 class="text-[1.05rem] font-semibold text-gray-900 dark:text-gray-100 tracking-tight">${escapeHtml(t.title)}</h3>
    <p class="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">${escapeHtml(t.description)}</p>
    <span class="text-xs text-gray-400 dark:text-gray-500 mt-auto pt-2">作成者: ${escapeHtml(t.username)}</span>
  </a>`

export const tabNav = (
  activeTab: string,
  showMine: boolean,
  category: string,
  query: string,
) => {
  const tabAll = activeTab !== 'mine' ? 'text-violet-600 dark:text-violet-400 border-violet-600 dark:border-violet-400' : ''
  const tabMine = activeTab === 'mine' ? 'text-violet-600 dark:text-violet-400 border-violet-600 dark:border-violet-400' : ''
  const qs = (tab: string) => {
    const params = new URLSearchParams()
    if (tab !== 'all') params.set('tab', tab)
    if (category && category !== 'すべて') params.set('category', category)
    if (query) params.set('q', query)
    const q = params.toString()
    return q ? `?${q}` : '/'
  }
  return `
    <div class="flex border-b border-gray-200 dark:border-gray-800 mb-6">
      <a href="/" class="px-5 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 border-b-2 border-transparent -mb-px cursor-pointer transition-all hover:text-gray-900 dark:hover:text-white ${tabAll}" hx-get="/" hx-target=".template-grid" hx-swap="outerHTML" hx-push-url="true">すべて</a>
      ${showMine ? `<a href="/?tab=mine" class="px-5 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 border-b-2 border-transparent -mb-px cursor-pointer transition-all hover:text-gray-900 dark:hover:text-white ${tabMine}" hx-get="/?tab=mine" hx-target=".template-grid" hx-swap="outerHTML" hx-push-url="true">自分のテンプレート</a>` : ''}
    </div>`
}

export const categoryPills = (active: string) => {
  const url = (cat: string) => {
    const params = new URLSearchParams()
    if (cat !== 'すべて') params.set('category', cat)
    return params.toString() ? `?${params.toString()}` : '/'
  }
  const activeClass = 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border-violet-600 dark:border-violet-400'
  return `
    <div class="flex flex-wrap gap-1.5 mb-5">
      ${CATEGORIES.map(
        (c) =>
          `<a href="${url(c)}" class="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 cursor-pointer transition-all hover:border-violet-300 dark:hover:border-violet-700 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/10 ${c === active ? activeClass : ''}" hx-get="${url(c)}" hx-target=".template-grid" hx-swap="outerHTML" hx-push-url="true">${escapeHtml(c)}</a>`,
      ).join('')}
    </div>`
}

export const searchBar = (query: string) => `
  <div class="mb-3">
    <input
      type="text"
      name="q"
      class="w-full max-w-lg px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all focus:outline-none focus:border-violet-600 focus:ring-[3px] focus:ring-violet-500/15 focus:bg-gray-50 dark:focus:bg-gray-800"
      placeholder="テンプレートを検索..."
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
      <div class="border border-gray-200 dark:border-gray-800 rounded-md mt-2 overflow-hidden">
        <div class="flex items-center gap-3 px-3 py-2 cursor-pointer bg-gray-100 dark:bg-gray-800 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50" onclick="this.parentElement.classList.toggle('var-expanded')">
          <span class="font-mono text-xs font-semibold text-violet-600 dark:text-violet-400 min-w-[120px]">{{${key}}}</span>
          <span class="text-sm text-gray-500 dark:text-gray-400 flex-1">${escapeHtml(label)}</span>
          <span class="text-[0.7rem] px-2 py-0.5 rounded-sm bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 font-semibold uppercase tracking-wide">${type}</span>
        </div>
        <div class="var-config-body p-3 border-t border-gray-200 dark:border-gray-800 flex-col gap-2 bg-white dark:bg-gray-900">
          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-gray-900 dark:text-gray-100">ラベル</label>
            <input type="text" name="var_label_${key}" class="px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-md text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-all focus:outline-none focus:border-violet-600 focus:ring-[3px] focus:ring-violet-500/15" value="${escapeHtml(label)}" placeholder="${escapeHtml(key)}">
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-gray-900 dark:text-gray-100">種類</label>
            <select name="var_type_${key}" class="px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-md text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 cursor-pointer transition-all focus:outline-none focus:border-violet-600 focus:ring-[3px] focus:ring-violet-500/15">
              <option value="text"${type === 'text' ? ' selected' : ''}>テキスト</option>
              <option value="select"${type === 'select' ? ' selected' : ''}>選択式</option>
            </select>
          </div>
          <div class="flex flex-col gap-1"${type !== 'select' ? ' style="display:none"' : ''}>
            <label class="text-xs font-semibold text-gray-900 dark:text-gray-100">選択肢（カンマ区切り）</label>
            <input type="text" name="var_options_${key}" class="px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-md text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-all focus:outline-none focus:border-violet-600 focus:ring-[3px] focus:ring-violet-500/15" value="${escapeHtml(opts)}" placeholder="選択肢1, 選択肢2, 選択肢3">
          </div>
        </div>
      </div>`
    })
    .join('')
}
