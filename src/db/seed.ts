import { uuidv7 } from '../lib/id.js'

const sampleTemplates = [
  {
    title: 'UI Component Spec',
    description: 'Figmaデザイン用のUIコンポーネント仕様を生成します。',
    category: 'デザイン',
    tags: 'Figma, UI, design',
    body: `You are a UI/UX designer. Generate a detailed Figma design spec for the following component:

Component: {{component}}
Purpose: {{purpose}}
Style: {{style}}
States: {{states}}
Colors: {{colors}}`,
    variable_config: [
      { key: 'component', label: 'Component', type: 'text' },
      { key: 'purpose', label: 'Purpose', type: 'text' },
      { key: 'style', label: 'Style', type: 'select', options: ['Minimal', 'Modern', 'Classic', 'Bold'] },
      { key: 'states', label: 'States', type: 'text' },
      { key: 'colors', label: 'Colors', type: 'text' },
    ],
  },
  {
    title: 'Landing Page Layout',
    description: 'Figmaワイヤーフレーミング用のランディングページ構成を生成します。',
    category: 'デザイン',
    tags: 'Figma, landing, wireframe',
    body: `Design a landing page layout in Figma with the following specifications:

Purpose: {{purpose}}
Sections: {{sections}}
Target Audience: {{audience}}
Tone: {{tone}}
Breakpoints: {{breakpoints}}`,
    variable_config: [
      { key: 'purpose', label: 'Purpose', type: 'text' },
      { key: 'sections', label: 'Sections', type: 'text' },
      { key: 'audience', label: 'Target Audience', type: 'text' },
      { key: 'tone', label: 'Tone', type: 'select', options: ['Professional', 'Modern', 'Friendly', 'Luxury'] },
      { key: 'breakpoints', label: 'Breakpoints', type: 'text' },
    ],
  },
  {
    title: 'ブログ記事構成案',
    description: 'テーマに沿ったブログ記事の構成を提案します。',
    category: '執筆',
    tags: 'blog, writing, content',
    body: `以下の条件でブログ記事の構成案を作成してください。

テーマ: {{theme}}
ターゲット読者: {{audience}}
記事の目的: {{goal}}
トーン: {{tone}}
想定文字数: {{wordCount}}`,
    variable_config: [
      { key: 'theme', label: 'テーマ', type: 'text' },
      { key: 'audience', label: 'ターゲット読者', type: 'text' },
      { key: 'goal', label: '記事の目的', type: 'select', options: ['情報提供', '説得', 'エンタメ', '教育'] },
      { key: 'tone', label: 'トーン', type: 'select', options: ['カジュアル', 'プロフェッショナル', 'フレンドリー', 'ユーモア'] },
      { key: 'wordCount', label: '想定文字数', type: 'text' },
    ],
  },
  {
    title: 'コードレビュー依頼',
    description: 'プルリクエストのコードレビュー依頼文を生成します。',
    category: 'コード',
    tags: 'code, review, PR',
    body: `Code review request for {{language}} project.

PR Title: {{prTitle}}
Description: {{description}}
Focus Areas: {{focusAreas}}
Priority: {{priority}}
Related Issue: {{issue}}`,
    variable_config: [
      { key: 'language', label: 'Language', type: 'select', options: ['TypeScript', 'Python', 'Go', 'Rust', 'Java'] },
      { key: 'prTitle', label: 'PR Title', type: 'text' },
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'focusAreas', label: 'Focus Areas', type: 'text' },
      { key: 'priority', label: 'Priority', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'] },
      { key: 'issue', label: 'Related Issue', type: 'text' },
    ],
  },
  {
    title: '学習計画立案',
    description: '目標に合わせた学習計画を生成します。',
    category: '学習',
    tags: 'learning, study, plan',
    body: `Create a study plan for the following:

学習目標: {{goal}}
現在のレベル: {{level}}
学習可能時間（週）: {{hours}}
期間: {{duration}}
優先分野: {{focus}}`,
    variable_config: [
      { key: 'goal', label: '学習目標', type: 'text' },
      { key: 'level', label: '現在のレベル', type: 'select', options: ['Beginner', 'Intermediate', 'Advanced'] },
      { key: 'hours', label: '学習可能時間（週）', type: 'text' },
      { key: 'duration', label: '期間', type: 'select', options: ['1ヶ月', '3ヶ月', '6ヶ月', '1年'] },
      { key: 'focus', label: '優先分野', type: 'text' },
    ],
  },
  {
    title: 'ビジネスメール作成',
    description: '状況に応じたビジネスメールの文面を生成します。',
    category: 'ビジネス',
    tags: 'email, business, communication',
    body: `以下の条件でビジネスメールを作成してください。

宛先: {{recipient}}
用件: {{subject}}
詳細: {{details}}
トーン: {{tone}}
添付ファイル: {{attachment}}`,
    variable_config: [
      { key: 'recipient', label: '宛先（役職/名前）', type: 'text' },
      { key: 'subject', label: '用件', type: 'text' },
      { key: 'details', label: '詳細', type: 'text' },
      { key: 'tone', label: 'トーン', type: 'select', options: ['丁寧', 'カジュアル', '緊急', 'フォーマル'] },
      { key: 'attachment', label: '添付ファイル', type: 'text' },
    ],
  },
]

export const seedTemplates = async (env: Record<string, unknown>) => {
  const db = (env as any).DB

  try {
    const existing = await db
      .prepare('SELECT COUNT(*) as count FROM users')
      .first()
    if (existing && (existing as any).count > 0) return
  } catch {
    return
  }

  const authorId = uuidv7()
  const now = new Date().toISOString()

  try {
    await db
      .prepare('INSERT INTO users (id, google_id, username) VALUES (?, NULL, ?)')
      .bind(authorId, 'sample-author')
      .run()
  } catch (e) {
    console.error('Seed user insert error:', e)
    return
  }

  const insert = db.prepare(
    `INSERT INTO templates (id, title, description, header, fields, body, variable_config, category, tags, author_id, created_at, updated_at)
     VALUES (?, ?, ?, '', '[]', ?, ?, ?, ?, ?, ?, ?)`,
  )

  for (const t of sampleTemplates) {
    const tid = uuidv7()
    try {
      await insert
        .bind(
          tid,
          t.title,
          t.description,
          t.body,
          JSON.stringify(t.variable_config),
          t.category,
          t.tags,
          authorId,
          now,
          now,
        )
        .run()
    } catch (e) {
      console.error(`Seed template insert error (${tid}):`, e)
    }
  }

  console.log(`Seeded ${sampleTemplates.length} sample templates.`)
}
