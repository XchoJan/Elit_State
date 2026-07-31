#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=config.sh
source "${SCRIPT_DIR}/config.sh"

SSH_OPTS=(-o StrictHostKeyChecking=no -o ConnectTimeout=15)

echo "==> Деплой приложения на ${SERVER_IP}..."

sshpass -p "${SERVER_PASSWORD}" ssh "${SSH_OPTS[@]}" "${SERVER_USER}@${SERVER_IP}" bash -s <<REMOTE
set -euo pipefail

export NVM_DIR="/root/.nvm"
# shellcheck disable=SC1091
. "\$NVM_DIR/nvm.sh"

APP_DIR="${APP_DIR}"
APP_NAME="${APP_NAME}"
GIT_REPO="${GIT_REPO}"

mkdir -p "\$(dirname "\$APP_DIR")"

if [ -d "\$APP_DIR/.git" ]; then
  echo "--- git pull ---"
  cd "\$APP_DIR"
  git pull origin main
else
  echo "--- git clone ---"
  git clone "\$GIT_REPO" "\$APP_DIR"
  cd "\$APP_DIR"
fi

echo "--- npm install ---"
npm ci 2>/dev/null || npm install

echo "--- npm run build ---"
export NODE_OPTIONS="--max-old-space-size=768"
npm run build

echo "--- PM2 ---"
if pm2 describe "\$APP_NAME" >/dev/null 2>&1; then
  pm2 restart "\$APP_NAME"
else
  pm2 start npm --name "\$APP_NAME" -- start
fi

pm2 save
STARTUP_CMD=$(pm2 startup systemd -u root --hp /root 2>&1 | grep -F "sudo env" || true)
if [ -n "\$STARTUP_CMD" ]; then
  eval "\$STARTUP_CMD"
fi

mkdir -p "\$APP_DIR/data"
chmod 755 "\$APP_DIR/data"

echo "==> Приложение запущено на порту ${APP_PORT}"
pm2 status
REMOTE

echo "==> 02-deploy-app.sh завершён."
