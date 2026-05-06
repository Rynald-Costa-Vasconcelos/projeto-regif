#!/usr/bin/env bash
set -euo pipefail

FRONT_DIR="/opt/regif/frontend"
NGINX_SERVICE="nginx"

log() { echo -e "\n[FRONT] $*\n"; }

log "Iniciando deploy do FRONT..."
cd "$FRONT_DIR"

# (Opcional) Atualiza código via git, se você usa git no servidor
if [ "${1:-}" = "--pull" ]; then
  log "Atualizando código (git pull)..."
  git pull --rebase
fi

log "Instalando dependências (npm ci)..."
npm ci

log "Buildando (npm run build)..."
npm run build

log "Checando se dist existe..."
test -f "$FRONT_DIR/dist/index.html"

log "Testando configuração do Nginx..."
nginx -t

# Nginx serve arquivos estáticos, reload geralmente NÃO é obrigatório,
# mas é seguro recarregar caso você altere config/cache etc.
log "Recarregando Nginx..."
systemctl reload "$NGINX_SERVICE"

log "OK ✅ Front publicado. (dist atualizado e Nginx recarregado)"
