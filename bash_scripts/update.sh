#!/usr/bin/env bash
# Быстрое обновление: git pull + build + pm2 restart (без переустановки сервера)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bash "${SCRIPT_DIR}/02-deploy-app.sh"
