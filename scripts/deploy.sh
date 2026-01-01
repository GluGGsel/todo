#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

echo "[deploy] pull origin/main (fast-forward only)"
git pull --ff-only origin main

echo "[deploy] npm ci"
npm ci

echo "[deploy] prisma generate + migrate"
npx prisma generate
npx prisma migrate deploy

echo "[deploy] build"
npm run build

echo "[deploy] restart service"
systemctl restart todo-app

echo "[deploy] done"
