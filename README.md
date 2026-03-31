# StarLine Monitor v3.0 - Optimized

Оптимизированная система мониторинга StarLine с улучшенной производительностью и меньшим размером образов.

## Ключевые улучшения

| Компонент | До | После | Экономия |
|-----------|-----|-------|----------|
| Backend | ~400 MB | ~150 MB | **62%** |
| Worker | ~400 MB | ~120 MB | **70%** |
| Frontend | ~1.2 GB | ~300 MB | **75%** |
| **Итого** | ~2 GB | ~570 MB | **72%** |

### Backend
- ✅ **Async/await** с `aiomysql` для неблокирующих операций
- ✅ **Connection Pool** для переиспользования соединений с БД
- ✅ **Multi-stage Dockerfile** с `uv` для быстрой установки

### Worker
- ✅ **Async/await** с `aiohttp` и `aiomysql`
- ✅ **Параллельная обработка** устройств с семафором
- ✅ **Connection Pool** для БД

### Frontend
- ✅ **Удалены лишние зависимости** (~60 MB экономии)
- ✅ **Bun** вместо npm (2-5x быстрее)
- ✅ **React Query** для кэширования данных

---

## Установка на сервер

### Требования к структуре

```
/srv/docker/
├── compose/                    # docker-compose.yml проекты
│   └── starline-monitor/       # ← проект будет здесь
└── data/                       # данные (volumes)
    └── starline-monitor/       # ← данные будут здесь
```

### Быстрая установка (новый проект)

```bash
# 1. Клонирование
cd /srv/docker/compose
git clone https://github.com/sakurka-cmd/starline-monitor-optimized.git starline-monitor
cd starline-monitor

# 2. Запуск установки
chmod +x install.sh
./install.sh --port 3010

# 3. Готово!
# Frontend: http://your-server:3010
# Backend: http://your-server:8000
```

### Установка с миграцией данных

Если у вас уже запущен старый проект и нужно сохранить данные:

```bash
# 1. Клонирование
cd /srv/docker/compose
git clone https://github.com/sakurka-cmd/starline-monitor-optimized.git starline-monitor
cd starline-monitor

# 2. Запуск установки с миграцией
chmod +x install.sh migrate.sh
./install.sh --migrate /path/to/old/starline-monitor

# Скрипт автоматически:
# - Остановит старый проект
# - Создаст бэкап БД
# - Запустит новый проект
# - Восстановит данные
```

---

## Ручная установка

### 1. Создание структуры

```bash
sudo mkdir -p /srv/docker/compose/starline-monitor
sudo mkdir -p /srv/docker/data/starline-monitor/{mysql,logs/backend,logs/worker}
```

### 2. Клонирование

```bash
cd /srv/docker/compose
git clone https://github.com/sakurka-cmd/starline-monitor-optimized.git starline-monitor
cd starline-monitor
```

### 3. Конфигурация

```bash
cp .env.example .env
nano .env
```

**Обязательно измените:**
- `JWT_SECRET` — случайный ключ (32+ символов)
- `MYSQL_ROOT_PASSWORD` — пароль root MySQL
- `MYSQL_PASSWORD` — пароль пользователя MySQL
- `API_URL` — URL вашего сервера (например, `http://192.168.1.100:8000`)

### 4. Запуск

```bash
docker-compose up -d
```

### 5. Проверка

```bash
docker-compose ps
docker-compose logs -f
```

---

## Ручная миграция данных

Если автоматическая миграция не сработала:

### 1. Бэкап старой БД

```bash
# На старом проекте
cd /path/to/old/starline-monitor

# Создать бэкап
docker exec starline-mysql mysqldump -u root -pYOUR_ROOT_PASSWORD starline_db > backup.sql

# Или экспорт в файл
docker exec starline-mysql mysqldump -u root -pYOUR_ROOT_PASSWORD \
    --single-transaction --routines --triggers \
    starline_db > starline_backup_$(date +%Y%m%d).sql
```

### 2. Копирование бэкапа

```bash
# Скопировать на новый сервер или в новый проект
cp backup.sql /srv/docker/compose/starline-monitor/
```

### 3. Восстановление

```bash
# На новом проекте
cd /srv/docker/compose/starline-monitor

# Убедиться что MySQL запущен
docker-compose up -d mysql
sleep 10

# Восстановить данные
docker exec -i starline-mysql mysql -u root -pYOUR_NEW_ROOT_PASSWORD starline_db < backup.sql

# Перезапустить сервисы
docker-compose restart backend worker
```

---

## Настройка reverse proxy (Caddy)

Если вы используете Caddy:

```caddyfile
# /srv/docker/caddy/Caddyfile

starline.yourdomain.com {
    reverse_proxy localhost:3010
}

api.starline.yourdomain.com {
    reverse_proxy localhost:8000
}
```

---

## Управление

```bash
cd /srv/docker/compose/starline-monitor

# Статус
docker-compose ps

# Логи
docker-compose logs -f
docker-compose logs -f backend
docker-compose logs -f worker

# Перезапуск
docker-compose restart

# Остановка
docker-compose down

# Обновление
git pull
docker-compose build --no-cache
docker-compose up -d
```

---

## API Endpoints

| Method | Endpoint | Описание |
|--------|----------|----------|
| **Auth** | | |
| POST | `/api/auth/register` | Регистрация |
| POST | `/api/auth/login` | Вход |
| GET | `/api/auth/me` | Профиль |
| **Devices** | | |
| GET | `/api/devices` | Список устройств |
| POST | `/api/devices` | Добавить устройство |
| DELETE | `/api/devices/{id}` | Удалить |
| GET | `/api/devices/{id}/latest` | Последнее состояние |
| GET | `/api/devices/{id}/state?hours=24` | История |
| GET | `/api/devices/{id}/stats?days=7` | Статистика |
| **Maintenance** | | |
| GET | `/api/devices/{id}/maintenance` | Записи ТО |
| POST | `/api/devices/{id}/maintenance` | Добавить ТО |
| GET | `/api/devices/{id}/maintenance/upcoming` | Предстоящие ТО |
| GET | `/api/service-types` | Типы обслуживания |

---

## Получение StarLine API credentials

1. Зайдите на https://my.starline.ru
2. Раздел "Разработчикам" → "API"
3. Создайте приложение
4. Скопируйте **Application ID** и **Secret**

---

## Устранение неполадок

### MySQL не запускается

```bash
# Проверить логи
docker-compose logs mysql

# Проверить права
sudo chown -R 999:999 /srv/docker/data/starline-monitor/mysql
```

### Backend не подключается к MySQL

```bash
# Проверить healthcheck
docker inspect starline-mysql | grep -A 10 Health

# Проверить сеть
docker network ls
docker network inspect starline-monitor_starline-net
```

### Frontend не видит API

Проверьте `API_URL` в `.env` — должен быть доступен из браузера клиента.

---

## Лицензия

MIT
