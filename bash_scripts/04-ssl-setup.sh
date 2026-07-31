#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=config.sh
source "${SCRIPT_DIR}/config.sh"

SSH_OPTS=(-o StrictHostKeyChecking=no -o ConnectTimeout=15)

echo "==> Получение SSL-сертификата для ${DOMAIN}..."

sshpass -p "${SERVER_PASSWORD}" ssh "${SSH_OPTS[@]}" "${SERVER_USER}@${SERVER_IP}" bash -s <<REMOTE
set -euo pipefail

certbot --nginx \
  -d ${DOMAIN} \
  -d ${WWW_DOMAIN} \
  --non-interactive \
  --agree-tos \
  --email ${CERTBOT_EMAIL} \
  --redirect

systemctl reload nginx
certbot certificates

echo "==> SSL настроен."
REMOTE

echo "==> 04-ssl-setup.sh завершён."
