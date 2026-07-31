#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=config.sh
source "${SCRIPT_DIR}/config.sh"

SSH_OPTS=(-o StrictHostKeyChecking=no -o ConnectTimeout=15)

echo "==> Настройка nginx для ${DOMAIN}..."

NGINX_CONF=$(cat <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} ${WWW_DOMAIN};

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
)

sshpass -p "${SERVER_PASSWORD}" ssh "${SSH_OPTS[@]}" "${SERVER_USER}@${SERVER_IP}" \
  "cat > /etc/nginx/sites-available/${APP_NAME}" <<< "${NGINX_CONF}"

sshpass -p "${SERVER_PASSWORD}" ssh "${SSH_OPTS[@]}" "${SERVER_USER}@${SERVER_IP}" bash -s <<REMOTE
set -euo pipefail
ln -sf /etc/nginx/sites-available/${APP_NAME} /etc/nginx/sites-enabled/${APP_NAME}
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
echo "==> nginx настроен."
REMOTE

echo "==> 03-nginx-setup.sh завершён."
