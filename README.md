# prompt_template

Bun + Hono の API テンプレートです。

## Requirements

- Bun 1.x

## Setup

```sh
bun install
bun run dev
```

The local server starts at `http://localhost:3000`.

Copy `.env.example` to `.env` when you want to override local settings.

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
  app.ts          Hono app factory and global middleware
  server.ts       Node server entrypoint
  config/env.ts   environment variable validation
  routes/         route modules
tests/            app-level tests
```

## API

- `GET /` — service status
- `GET /health` — health check
- `POST /messages` — sample JSON endpoint

Example:

```sh
curl -X POST http://localhost:3000/messages \
  -H 'content-type: application/json' \
  -d '{"message":"hello"}'
```
