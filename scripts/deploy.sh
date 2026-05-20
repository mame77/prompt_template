#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-.env}"
WORKER_URL="${2:-}"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: $ENV_FILE not found"
  exit 1
fi

source "$ENV_FILE"

echo "=== Step 1: wrangler login ==="
npx wrangler login

echo ""
echo "=== Step 2: D1 database ==="
npx wrangler d1 create prompt-template-db 2>&1 | tee /tmp/d1_output.txt
DB_ID=$(grep -oP 'database_id = "\K[^"]+' /tmp/d1_output.txt || true)
if [ -n "$DB_ID" ]; then
  sed -i "s/database_id = \".*\"/database_id = \"$DB_ID\"/" wrangler.toml
  echo "wrangler.toml に database_id を書き込みました"
fi

echo ""
echo "=== Step 3: Migration ==="
npx wrangler d1 migrations apply prompt-template-db --remote

echo ""
echo "=== Step 4: Secrets ==="
# SESSION_SECRET（なければ自動生成）
if [ -z "${SESSION_SECRET:-}" ] || [ "$SESSION_SECRET" = "change-me-to-a-random-string-at-least-32-chars!!" ]; then
  SESSION_SECRET=$(openssl rand -hex 32)
  echo "SESSION_SECRET を自動生成しました"
fi
echo "$SESSION_SECRET" | npx wrangler secret put SESSION_SECRET

if [ -n "${GOOGLE_CLIENT_ID:-}" ]; then
  echo "$GOOGLE_CLIENT_ID" | npx wrangler secret put GOOGLE_CLIENT_ID
fi
if [ -n "${GOOGLE_CLIENT_SECRET:-}" ]; then
  echo "$GOOGLE_CLIENT_SECRET" | npx wrangler secret put GOOGLE_CLIENT_SECRET
fi

# GOOGLE_REDIRECT_URI（引数か.envの値を使用）
REDIRECT="${WORKER_URL:-${GOOGLE_REDIRECT_URI:-}}"
if [ -n "$REDIRECT" ]; then
  echo "$REDIRECT" | npx wrangler secret put GOOGLE_REDIRECT_URI
else
  echo "Warning: GOOGLE_REDIRECT_URI が未設定です。デプロイ後に手動で設定してください。"
fi

echo ""
echo "=== Step 5: Deploy ==="
npx wrangler deploy

echo ""
echo "=== 完了 ==="
echo "デプロイ先: https://prompt-template.<your-subdomain>.workers.dev"