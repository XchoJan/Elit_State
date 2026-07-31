#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=config.sh
source "${SCRIPT_DIR}/config.sh"

SSH_OPTS=(-o StrictHostKeyChecking=no -o ConnectTimeout=15)

echo "==> Подключение к серверу ${SERVER_USER}@${SERVER_IP}..."
echo "==> Установка системных пакетов, nvm, node, yarn, pm2, nginx, certbot..."

sshpass -p "${SERVER_PASSWORD}" ssh "${SSH_OPTS[@]}" "${SERVER_USER}@${SERVER_IP}" bash -s <<REMOTE
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

echo "--- Обновление системы ---"
apt-get update -qq
apt-get upgrade -y -qq

echo "--- Swap (1 GB, для сборки Next.js) ---"
if [ ! -f /swapfile ]; then
  fallocate -l 1G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "--- Базовые пакеты ---"
apt-get install -y -qq curl git nginx certbot python3-certbot-nginx ufw sshpass

echo "--- UFW ---"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo "--- NVM + Node ${NODE_VERSION} ---"
export NVM_DIR="/root/.nvm"
if [ ! -d "\$NVM_DIR" ]; then
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
fi
# shellcheck disable=SC1091
. "\$NVM_DIR/nvm.sh"
nvm install ${NODE_VERSION}
nvm alias default ${NODE_VERSION}
nvm use default

echo "--- Yarn + PM2 ---"
corepack enable
corepack prepare yarn@stable --activate
npm install -g pm2

echo "--- Nginx ---"
systemctl enable nginx
systemctl start nginx

echo "--- Версии ---"
node -v
npm -v
yarn -v
pm2 -v
nginx -v
certbot --version

echo "==> Сервер готов."
REMOTE

echo "==> 01-server-setup.sh завершён."
