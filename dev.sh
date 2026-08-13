#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# dev.sh — Script de lanzamiento local para Pathetic Hero
#
# Uso:
#   chmod +x dev.sh   (solo la primera vez)
#   ./dev.sh
#
# Opciones:
#   ./dev.sh          → Servidor de desarrollo (localhost:3000)
#   ./dev.sh build    → Build de producción en /dist
#   ./dev.sh preview  → Previsualizar el build de producción
# ─────────────────────────────────────────────────────────────────────────────

# ── Cargar nvm si está disponible (para que npm esté en el PATH) ─────────────
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  source "$NVM_DIR/nvm.sh"
elif [ -s "/opt/homebrew/opt/nvm/nvm.sh" ]; then
  source "/opt/homebrew/opt/nvm/nvm.sh"
fi

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

print_banner() {
  echo ""
  echo -e "${CYAN}${BOLD}"
  echo "  ██████╗  █████╗ ████████╗██╗  ██╗███████╗████████╗██╗ ██████╗"
  echo "  ██╔══██╗██╔══██╗╚══██╔══╝██║  ██║██╔════╝╚══██╔══╝██║██╔════╝"
  echo "  ██████╔╝███████║   ██║   ███████║█████╗     ██║   ██║██║     "
  echo "  ██╔═══╝ ██╔══██║   ██║   ██╔══██║██╔══╝     ██║   ██║██║     "
  echo "  ██║     ██║  ██║   ██║   ██║  ██║███████╗   ██║   ██║╚██████╗"
  echo "  ╚═╝     ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚══════╝   ╚═╝   ╚═╝ ╚═════╝"
  echo ""
  echo "  ██╗  ██╗███████╗██████╗  ██████╗"
  echo "  ██║  ██║██╔════╝██╔══██╗██╔═══██╗"
  echo "  ███████║█████╗  ██████╔╝██║   ██║"
  echo "  ██╔══██║██╔══╝  ██╔══██╗██║   ██║"
  echo "  ██║  ██║███████╗██║  ██║╚██████╔╝"
  echo "  ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝ ╚═════╝"
  echo -e "${RESET}"
  echo -e "${YELLOW}  ~ Un RPG para valientes mediocres ~${RESET}"
  echo ""
}

check_node() {
  if ! command -v npm &>/dev/null; then
    echo -e "${RED}✗ npm no encontrado. Instala Node.js 18+ desde https://nodejs.org${RESET}"
    echo -e "${YELLOW}  Si usas nvm: nvm install 20 && nvm use 20${RESET}"
    exit 1
  fi

  NODE_VERSION=$(node --version | sed 's/v//' | cut -d. -f1)
  if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}✗ Node.js 18+ requerido. Versión actual: $(node --version)${RESET}"
    exit 1
  fi
  echo -e "${GREEN}✓ Node.js $(node --version) / npm $(npm --version)${RESET}"
}

check_deps() {
  if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚙ node_modules no encontrado. Instalando dependencias...${RESET}"
    npm install
    npm approve-scripts esbuild 2>/dev/null || true
    echo -e "${GREEN}✓ Dependencias instaladas${RESET}"
  else
    echo -e "${GREEN}✓ Dependencias OK${RESET}"
  fi
}

MODE="${1:-dev}"

print_banner
echo -e "${BOLD}Comprobando entorno...${RESET}"
check_node
check_deps
echo ""

case "$MODE" in
  dev)
    echo -e "${CYAN}${BOLD}▶ Iniciando servidor de desarrollo...${RESET}"
    echo -e "${YELLOW}  URL: http://localhost:3000${RESET}"
    echo -e "${YELLOW}  Pulsa Ctrl+C para detener${RESET}"
    echo ""
    npm run dev
    ;;
  build)
    echo -e "${CYAN}${BOLD}▶ Generando build de producción...${RESET}"
    npm run build
    echo -e "${GREEN}✓ Build completado en /dist${RESET}"
    ;;
  preview)
    echo -e "${CYAN}${BOLD}▶ Previsualizando build de producción...${RESET}"
    npm run preview
    ;;
  *)
    echo -e "${RED}Uso: ./dev.sh [dev|build|preview]${RESET}"
    exit 1
    ;;
esac
