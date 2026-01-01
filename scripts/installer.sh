#!/usr/bin/env bash
set -e

echo "[installer] todo-app installer starting"

APP_DIR="/opt/todo"
DATA_DIR="$APP_DIR/data"

# --- Basics ---
echo "[installer] installing system dependencies"
apt update
apt install -y git curl ca-certificates

# --- Node.js (LTS 20, kompatibel mit Prisma 6) ---
if ! command -v node >/dev/null 2>&1; then
  echo "[installer] installing nodejs"
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt install -y nodejs
fi

node -v
npm -v

# --- App directory ---
echo "[installer] preparing directories"
mkdir -p "$APP_DIR"
mkdir -p "$DATA_DIR"

cd "$APP_DIR"

# --- Environment ---
if [ ! -f ".env" ]; then
  echo "[installer] .env not found, creating from .env.example"
  cp .env.example .env
else
  echo "[installer] .env already exists"
fi

# --- Install dependencies ---
echo "[installer] installing npm dependencies"
npm ci

# --- Prisma ---
echo "[installer] prisma generate"
npx prisma generate

echo "[installer] prisma migrate (deploy)"
npx prisma migrate deploy || true

# --- Push notification check (optional) ---
if grep -q 'VAPID_PUBLIC_KEY=""' .env || grep -q 'VAPID_PRIVATE_KEY=""' .env; then
  echo "[installer] Push notifications DISABLED (VAPID keys missing)"
  echo "[installer] To enable push notifications:"
  echo "  npx web-push generate-vapid-keys"
  echo "  then add keys to .env and redeploy"
else
  echo "[installer] Push notifications enabled"
fi

# --- Build ---
echo "[installer] building app"
npm run build

# --- systemd ---
SERVICE_FILE="/etc/systemd/system/todo-app.service"

if [ ! -f "$SERVICE_FILE" ]; then
  echo "[installer] installing systemd service"
  cat > "$SERVICE_FILE" <<'EOF'
[Unit]
Description=Todo App (Next.js)
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/todo
ExecStart=/usr/bin/npm start
Restart=always
Environment=NODE_ENV=production
User=root

[Install]
WantedBy=multi-user.target
EOF

  systemctl daemon-reload
  systemctl enable todo-app.service
fi

echo "[installer] starting service"
systemctl restart todo-app.service

echo "[installer] done"
