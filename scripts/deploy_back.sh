#!/usr/bin/env bash
set -euo pipefail

BACK_DIR="/opt/regif/backend"
PM2_APP="regif-api"

log() { echo -e "\n[BACK] $*\n"; }

log "Iniciando deploy do BACK..."
cd "$BACK_DIR"

# (Opcional) Atualiza código via git, se você usa git no servidor
if [ "${1:-}" = "--pull" ] || [ "${2:-}" = "--pull" ]; then
  log "Atualizando código (git pull)..."
  git pull --rebase
fi

log "Instalando dependências (npm ci)..."
npm ci

# (Opcional) Prisma migrations em produção
# Use --migrate para aplicar migrations pendentes.
if [ "${1:-}" = "--migrate" ] || [ "${2:-}" = "--migrate" ]; then
  log "Aplicando migrations (prisma migrate deploy)..."
  npx prisma migrate deploy
fi

log "Buildando (npm run build)..."
npm run build

log "Checando se dist/server.js existe..."
test -f "$BACK_DIR/dist/server.js"

# Se o app já existir, faz reload (zero/baixo downtime). Se não existir, cria.
if pm2 describe "$PM2_APP" >/dev/null 2>&1; then
  log "Recarregando PM2 app: $PM2_APP ..."
  pm2 reload "$PM2_APP" --update-env
else
  log "App PM2 '$PM2_APP' não encontrado. Criando..."
  pm2 start "$BACK_DIR/dist/server.js" --name "$PM2_APP"
fi

log "Salvando lista do PM2 (persistir após reboot)..."
pm2 save

log "OK ✅ Back publicado. (PM2 atualizado)"
