#!/usr/bin/env bash
# .env を読み込んで wrangler secret put コマンドを出力する
set -euo pipefail

ENV_FILE="${1:-.env}"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: $ENV_FILE not found"
  exit 1
fi

source "$ENV_FILE"

echo "# 以下のコマンドを順に実行してください"
echo ""

# SESSION_SECRET
if [ -z "${SESSION_SECRET:-}" ] || [ "$SESSION_SECRET" = "change-me-to-a-random-string-at-least-32-chars!!" ]; then
  VAL=$(openssl rand -hex 32)
  echo "# SESSION_SECRET（自動生成）"
  echo "echo '$VAL' | npx wrangler secret put SESSION_SECRET"
else
  echo "echo '$SESSION_SECRET' | npx wrangler secret put SESSION_SECRET"
fi

# GOOGLE_CLIENT_ID
if [ -n "${GOOGLE_CLIENT_ID:-}" ]; then
  echo "echo '$GOOGLE_CLIENT_ID' | npx wrangler secret put GOOGLE_CLIENT_ID"
else
  echo "# GOOGLE_CLIENT_ID が .env にありません"
fi

# GOOGLE_CLIENT_SECRET
if [ -n "${GOOGLE_CLIENT_SECRET:-}" ]; then
  echo "echo '$GOOGLE_CLIENT_SECRET' | npx wrangler secret put GOOGLE_CLIENT_SECRET"
else
  echo "# GOOGLE_CLIENT_SECRET が .env にありません"
fi

# GOOGLE_REDIRECT_URI（引数で上書き可能）
WORKER_URL="${2:-}"
if [ -n "$WORKER_URL" ]; then
  URL="${WORKER_URL}/auth/google"
  echo "echo '$URL' | npx wrangler secret put GOOGLE_REDIRECT_URI"
elif [ -n "${GOOGLE_REDIRECT_URI:-}" ]; then
  echo "# 注意: 開発用URL($GOOGLE_REDIRECT_URI)です。本番URLに書き換えてください"
  echo "# echo 'https://prompt-template.あなたのドメイン.workers.dev/auth/google' | npx wrangler secret put GOOGLE_REDIRECT_URI"
else
  echo "# GOOGLE_REDIRECT_URI が .env にありません"
fi

echo ""
echo "# デプロイ"
echo "npx wrangler deploy"