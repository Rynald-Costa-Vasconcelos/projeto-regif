#!/usr/bin/env bash
set -euo pipefail

SCRIPTS_DIR="/opt/regif/scripts"

log() { echo -e "\n[ALL] $*\n"; }

PULL=""
MIGRATE=""

for arg in "$@"; do
  case "$arg" in
    --pull) PULL="--pull" ;;
    --migrate) MIGRATE="--migrate" ;;
  esac
done

log "Iniciando deploy COMPLETO (front + back)..."

log "1/2 Deploy BACK..."
"$SCRIPTS_DIR/deploy_back.sh" $PULL $MIGRATE

log "2/2 Deploy FRONT..."
"$SCRIPTS_DIR/deploy_front.sh" $PULL

log "OK ✅ Deploy completo finalizado."
