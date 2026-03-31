#!/bin/bash
#
# StarLine Monitor Installation Script
# Установка проекта в структуру /srv/docker/
#
# Использование:
#   ./install.sh [OPTIONS]
#
# Options:
#   --data-path PATH    Путь к данным (по умолчанию /srv/docker/data/starline-monitor)
#   --port PORT         Порт для frontend (по умолчанию 3010)
#   --api-url URL       URL для API (по умолчанию http://localhost:8000)

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default values
DOCKER_ROOT="/srv/docker"
PROJECT_NAME="starline-monitor"
DATA_PATH="/srv/docker/data/starline-monitor"
FRONTEND_PORT="3010"
API_URL="http://localhost:8000"
OLD_PROJECT_PATH=""

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

usage() {
    echo "Использование: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --data-path PATH    Путь к данным (по умолчанию: $DATA_PATH)"
    echo "  --port PORT         Порт frontend (по умолчанию: $FRONTEND_PORT)"
    echo "  --api-url URL       URL API (по умолчанию: $API_URL)"
    echo "  --migrate PATH      Путь к старому проекту для миграции данных"
    echo "  --help              Показать эту справку"
    exit 0
}

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --data-path)
                DATA_PATH="$2"
                shift 2
                ;;
            --port)
                FRONTEND_PORT="$2"
                shift 2
                ;;
            --api-url)
                API_URL="$2"
                shift 2
                ;;
            --migrate)
                OLD_PROJECT_PATH="$2"
                shift 2
                ;;
            --help)
                usage
                ;;
            *)
                log_error "Неизвестный параметр: $1"
                usage
                ;;
        esac
    done
}

check_requirements() {
    log_step "Проверка требований..."
    
    # Check if running as root or with sudo
    if [ "$EUID" -ne 0 ] && [ -z "$SUDO_USER" ]; then
        log_warn "Рекомендуется запускать с sudo для создания директорий в /srv"
    fi
    
    # Check docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker не установлен"
        exit 1
    fi
    
    # Check docker-compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose не установлен"
        exit 1
    fi
    
    # Check git
    if ! command -v git &> /dev/null; then
        log_warn "Git не установлен (нужен для клонирования)"
    fi
    
    log_info "Все требования выполнены"
}

create_directories() {
    log_step "Создание структуры директорий..."
    
    # Create compose directory
    COMPOSE_DIR="$DOCKER_ROOT/compose/$PROJECT_NAME"
    mkdir -p "$COMPOSE_DIR"
    log_info "Создана директория: $COMPOSE_DIR"
    
    # Create data directories
    mkdir -p "$DATA_PATH/mysql"
    mkdir -p "$DATA_PATH/logs/backend"
    mkdir -p "$DATA_PATH/logs/worker"
    log_info "Создана директория данных: $DATA_PATH"
}

copy_project() {
    log_step "Копирование файлов проекта..."
    
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    
    # Copy all files except .git
    rsync -av --exclude='.git' "$SCRIPT_DIR/" "$COMPOSE_DIR/"
    
    log_info "Файлы скопированы в $COMPOSE_DIR"
}

create_env_file() {
    log_step "Создание конфигурации..."
    
    cd "$COMPOSE_DIR"
    
    # Generate random secrets
    JWT_SECRET=$(openssl rand -hex 32)
    MYSQL_ROOT_PASSWORD=$(openssl rand -hex 16)
    MYSQL_PASSWORD=$(openssl rand -hex 16)
    
    # Create .env file
    cat > .env << EOF
# StarLine Monitor Configuration
# Generated: $(date)

# MySQL Configuration
MYSQL_ROOT_PASSWORD=$MYSQL_ROOT_PASSWORD
MYSQL_PASSWORD=$MYSQL_PASSWORD

# JWT Secret
JWT_SECRET=$JWT_SECRET

# Connection Pool
DB_POOL_SIZE=10
WORKER_DB_POOL_SIZE=5

# Worker Settings
POLL_INTERVAL=180

# Frontend API URL (change to your server URL)
API_URL=$API_URL

# Data Path
DATA_PATH=$DATA_PATH
EOF
    
    # Update docker-compose.yml with correct frontend port
    sed -i "s/\"3010:3000\"/\"$FRONTEND_PORT:3000\"/g" docker-compose.yml
    
    log_info "Конфигурация создана: $COMPOSE_DIR/.env"
    log_warn "Сохраните пароли из .env файла!"
}

migrate_data() {
    if [ -z "$OLD_PROJECT_PATH" ]; then
        return
    fi
    
    log_step "Миграция данных из старого проекта..."
    
    if [ ! -d "$OLD_PROJECT_PATH" ]; then
        log_error "Старый проект не найден: $OLD_PROJECT_PATH"
        exit 1
    fi
    
    cd "$COMPOSE_DIR"
    
    # Run migration script
    if [ -f "migrate.sh" ]; then
        chmod +x migrate.sh
        ./migrate.sh "$OLD_PROJECT_PATH"
    else
        log_error "Скрипт migrate.sh не найден"
        exit 1
    fi
}

build_and_start() {
    log_step "Сборка и запуск контейнеров..."
    
    cd "$COMPOSE_DIR"
    
    # Build containers
    docker-compose build --no-cache
    
    # Start containers
    docker-compose up -d
    
    log_info "Контейнеры запущены"
    
    # Wait for services
    log_info "Ожидание запуска сервисов..."
    sleep 15
    
    # Check status
    docker-compose ps
}

print_summary() {
    echo ""
    echo "========================================"
    log_info "УСТАНОВКА ЗАВЕРШЕНА!"
    echo "========================================"
    echo ""
    echo "Директория проекта: $COMPOSE_DIR"
    echo "Директория данных: $DATA_PATH"
    echo ""
    echo "Доступные порты:"
    echo "  - Frontend: http://localhost:$FRONTEND_PORT"
    echo "  - Backend API: http://localhost:8000"
    echo "  - MySQL: localhost:3307"
    echo ""
    echo "Конфигурация: $COMPOSE_DIR/.env"
    echo ""
    echo "Полезные команды:"
    echo "  cd $COMPOSE_DIR"
    echo "  docker-compose logs -f        # Логи"
    echo "  docker-compose ps             # Статус"
    echo "  docker-compose restart        # Перезапуск"
    echo "  docker-compose down           # Остановка"
    echo ""
}

main() {
    echo "========================================"
    echo "  StarLine Monitor Installation Script"
    echo "========================================"
    echo ""
    
    parse_args "$@"
    check_requirements
    create_directories
    copy_project
    create_env_file
    
    if [ -n "$OLD_PROJECT_PATH" ]; then
        migrate_data
    else
        build_and_start
    fi
    
    print_summary
}

main "$@"
