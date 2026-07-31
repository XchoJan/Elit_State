#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "========================================="
echo "  Деплой Elite Estate"
echo "========================================="

bash "${SCRIPT_DIR}/01-server-setup.sh"
bash "${SCRIPT_DIR}/02-deploy-app.sh"
bash "${SCRIPT_DIR}/03-nginx-setup.sh"
bash "${SCRIPT_DIR}/04-ssl-setup.sh"

echo ""
echo "========================================="
echo "  Готово: https://${DOMAIN:-eliteestate.online}"
echo "========================================="
