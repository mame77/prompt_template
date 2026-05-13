# Prompt Template

Figma × Webアプリ開発のためのプロンプトテンプレート共有サービス。

GitHub でログインしてテンプレートを作成・公開できます。
公開されたテンプレートは誰でも閲覧・利用できます。

## Requirements

- Bun 1.x

## Setup

```sh
bun install
```

Copy `.env.example` to `.env` and configure your settings.
You need to set up a GitHub OAuth App at https://github.com/settings/developers.

```sh
cp .env.example .env
bun run dev
```

The local server starts at `http://localhost:3000`.

## Scripts

- `bun run dev` — start the development server with watch mode
- `bun run build` — bundle to `dist/server.js`
- `bun run start` — run the compiled server
- `bun test` — run tests

## Docker

```sh
docker compose up --build
```

## Structure

```txt
src/
  app.ts            Hono app setup
  server.ts         Entry point
  config/env.ts     Environment variable validation
  db/
    index.ts        SQLite database initialization
    seed.ts         Sample template seed data
  lib/auth.ts       GitHub OAuth and session management
  routes/
    pages.ts        Page routes (HTML + HTMX)
    auth.ts         Authentication routes
    api.ts          Template CRUD API
  views/layout.ts   HTML layout and UI components
public/
  style.css         Application styles
```

## API

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | No | Template list |
| GET | `/templates/:id` | No | Template form |
| POST | `/templates/:id/render` | No | Generate prompt |
| GET | `/mypage` | Yes | My templates |
| GET | `/templates/new` | Yes | New template form |
| POST | `/templates` | Yes | Create template |
| POST | `/templates/:id/delete` | Owner | Delete template |
| GET | `/login` | No | GitHub login |
| GET | `/auth/github` | No | OAuth callback |
| POST | `/auth/logout` | Yes | Logout |
