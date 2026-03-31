#!/bin/bash
#
# StarLine Monitor Migration Script
# Миграция данных из старого проекта в новый оптимизированный
#
# Использование:
#   ./migrate.sh <old_project_path>
#
# Пример:
#   ./migrate.sh /path/to/old/starline-monitor

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Config
OLD_PROJECT_PATH="${1:-}"
BACKUP_DIR="$(pwd)/backup_$(date +%Y%m%d_%H%M%S)"

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    log_info "Проверка требований..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker не установлен"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose не установлен"
        exit 1
    fi
    
    log_info "Все требования выполнены"
}

check_old_project() {
    if [ -z "$OLD_PROJECT_PATH" ]; then
        log_error "Укажите путь к старому проекту"
        echo "Использование: $0 <old_project_path>"
        exit 1
    fi
    
    if [ ! -d "$OLD_PROJECT_PATH" ]; then
        log_error "Директория $OLD_PROJECT_PATH не существует"
        exit 1
    fi
    
    if [ ! -f "$OLD_PROJECT_PATH/docker-compose.yml" ]; then
        log_error "docker-compose.yml не найден в $OLD_PROJECT_PATH"
        exit 1
    fi
    
    log_info "Старый проект найден: $OLD_PROJECT_PATH"
}

check_old_containers() {
    log_info "Проверка контейнеров старого проекта..."
    
    if docker ps --format '{{.Names}}' | grep -q "starline-mysql"; then
        log_info "Контейнер starline-mysql запущен"
        return 0
    else
        log_warn "Контейнер starline-mysql не запущен"
        log_info "Попытка запуска старого проекта..."
        cd "$OLD_PROJECT_PATH"
        docker-compose up -d mysql
        sleep 10
        
        # Wait for MySQL to be ready
        for i in {1..30}; do
            if docker exec starline-mysql mysqladmin ping -h localhost -u root -prootpass123 --silent 2>/dev/null; then
                log_info "MySQL готов"
                break
            fi
            log_info "Ожидание MySQL... ($i/30)"
            sleep 2
        done
    fi
}

create_backup() {
    log_info "Создание бэкапа базы данных..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Get MySQL password from old project
    OLD_MYSQL_PASSWORD=$(grep -E "MYSQL_PASSWORD" "$OLD_PROJECT_PATH/docker-compose.yml" | head -1 | sed 's/.*:\s*//' | tr -d '"' | tr -d "'" || echo "starline123")
    OLD_MYSQL_ROOT_PASSWORD=$(grep -E "MYSQL_ROOT_PASSWORD" "$OLD_PROJECT_PATH/docker-compose.yml" | head -1 | sed 's/.*:\s*//' | tr -d '"' | tr -d "'" || echo "rootpass123")
    
    # Try default passwords if extraction failed
    if [ -z "$OLD_MYSQL_PASSWORD" ] || [ "$OLD_MYSQL_PASSWORD" = "" ]; then
        OLD_MYSQL_PASSWORD="starline123"
    fi
    if [ -z "$OLD_MYSQL_ROOT_PASSWORD" ] || [ "$OLD_MYSQL_ROOT_PASSWORD" = "" ]; then
        OLD_MYSQL_ROOT_PASSWORD="rootpass123"
    fi
    
    log_info "Пароль MySQL: $OLD_MYSQL_PASSWORD"
    
    # Backup database
    docker exec starline-mysql mysqldump \
        -u root \
        -p"$OLD_MYSQL_ROOT_PASSWORD" \
        --single-transaction \
        --routines \
        --triggers \
        starline_db > "$BACKUP_DIR/starline_db_backup.sql" 2>/dev/null || {
        log_error "Не удалось создать бэкап базы данных"
        log_info "Пробую с паролем из переменной окружения..."
        
        # Try from .env file
        if [ -f "$OLD_PROJECT_PATH/.env" ]; then
            source "$OLD_PROJECT_PATH/.env"
            docker exec starline-mysql mysqldump \
                -u root \
                -p"${MYSQL_ROOT_PASSWORD:-rootpass123}" \
                --single-transaction \
                --routines \
                --triggers \
                starline_db > "$BACKUP_DIR/starline_db_backup.sql" 2>/dev/null
        fi
    }
    
    if [ -f "$BACKUP_DIR/starline_db_backup.sql" ] && [ -s "$BACKUP_DIR/starline_db_backup.sql" ]; then
        log_info "Бэкап создан: $BACKUP_DIR/starline_db_backup.sql"
        log_info "Размер бэкапа: $(du -h "$BACKUP_DIR/starline_db_backup.sql" | cut -f1)"
    else
        log_error "Бэкап не создан или пустой"
        exit 1
    fi
}

stop_old_project() {
    log_warn "Остановка старого проекта..."
    cd "$OLD_PROJECT_PATH"
    docker-compose down
    log_info "Старый проект остановлен"
}

start_new_project() {
    log_info "Запуск нового проекта..."
    
    # Create data directories
    mkdir -p /srv/docker/data/starline-monitor/{mysql,logs/backend,logs/worker}
    
    cd "$(dirname "$0")"
    
    # Copy .env if exists in old project
    if [ -f "$OLD_PROJECT_PATH/.env" ]; then
        cp "$OLD_PROJECT_PATH/.env" .env
        log_info ".env скопирован из старого проекта"
    else
        cp .env.example .env
        log_warn ".env создан из примера. Проверьте настройки!"
    fi
    
    # Start MySQL first
    docker-compose up -d mysql
    
    log_info "Ожидание запуска MySQL..."
    for i in {1..60}; do
        if docker exec starline-mysql mysqladmin ping -h localhost -u root -p"${MYSQL_ROOT_PASSWORD:-rootpass123}" --silent 2>/dev/null; then
            log_info "MySQL готов"
            break
        fi
        sleep 2
    done
    
    # Restore backup (skip init-db if we have backup)
    log_info "Восстановление данных из бэкапа..."
    
    # Drop the database that was created by init script and restore from backup
    docker exec -i starline-mysql mysql -u root -p"${MYSQL_ROOT_PASSWORD:-rootpass123}" -e "DROP DATABASE IF EXISTS starline_db;"
    docker exec -i starline-mysql mysql -u root -p"${MYSQL_ROOT_PASSWORD:-rootpass123}" -e "CREATE DATABASE starline_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    docker exec -i starline-mysql mysql -u root -p"${MYSQL_ROOT_PASSWORD:-rootpass123}" starline_db < "$BACKUP_DIR/starline_db_backup.sql"
    
    log_info "Данные восстановлены"
    
    # Start other services
    docker-compose up -d backend worker frontend
    
    log_info "Ожидание запуска сервисов..."
    sleep 10
    
    # Check status
    docker-compose ps
}

print_summary() {
    echo ""
    echo "========================================"
    log_info "МИГРАЦИЯ ЗАВЕРШЕНА УСПЕШНО!"
    echo "========================================"
    echo ""
    echo "Бэкап сохранён: $BACKUP_DIR"
    echo ""
    echo "Доступные порты:"
    echo "  - Frontend: http://localhost:3010"
    echo "  - Backend API: http://localhost:8000"
    echo "  - MySQL: localhost:3307"
    echo ""
    echo "Полезные команды:"
    echo "  docker-compose logs -f          # Просмотр логов"
    echo "  docker-compose ps               # Статус контейнеров"
    echo "  docker-compose restart          # Перезапуск"
    echo ""
}

main() {
    echo "========================================"
    echo "  StarLine Monitor Migration Script"
    echo "========================================"
    echo ""
    
    check_requirements
    check_old_project
    check_old_containers
    create_backup
    stop_old_project
    start_new_project
    print_summary
}

main "$@"
