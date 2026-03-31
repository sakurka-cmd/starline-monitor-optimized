# StarLine Monitor v3.0 - Optimized

Оптимизированная система мониторинга StarLine с улучшенной производительностью и меньшим размером образов.

## Ключевые улучшения

### Backend
- ✅ **Async/await** с `aiomysql` для неблокирующих операций
- ✅ **Connection Pool** для переиспользования соединений с БД
- ✅ **Multi-stage Dockerfile** с `uv` для быстрой установки зависимостей
- ✅ **Non-root пользователь** для безопасности
- ✅ **Healthcheck** для мониторинга состояния

### Worker
- ✅ **Async/await** с `aiohttp` и `aiomysql`
- ✅ **Параллельная обработка** устройств с семафором
- ✅ **Connection Pool** для БД
- ✅ **Exponential backoff** при rate limiting

### Frontend
- ✅ **Удалены лишние зависимости** (~60 MB экономии)
- ✅ **Bun** вместо npm (2-5x быстрее)
- ✅ **React Query** для кэширования данных
- ✅ **Zustand** для state management
- ✅ **Компонентная архитектура** вместо монолитного файла
- ✅ **Standalone output** для минимального образа

### Docker Compose
- ✅ **Resource limits** для всех сервисов
- ✅ **Healthchecks** для monitoring
- ✅ **Logging configuration** с rotation
- ✅ **Отдельная сеть** для изоляции

## Сравнение размеров образов

| Компонент | До | После | Экономия |
|-----------|-----|-------|----------|
| Backend | ~400 MB | ~150 MB | 62% |
| Worker | ~400 MB | ~120 MB | 70% |
| Frontend | ~1.2 GB | ~300 MB | 75% |
| **Итого** | ~2 GB | ~570 MB | **72%** |

## Быстрый старт

### 1. Клонирование

```bash
git clone <repository-url>
cd starline-monitor-optimized
```

### 2. Настройка

```bash
cp .env.example .env
nano .env
```

Измените пароли и укажите URL вашего сервера.

### 3. Запуск

```bash
docker-compose up -d
```

### 4. Использование

Откройте в браузере: `http://YOUR_IP:3000`

1. Зарегистрируйтесь
2. Добавьте устройство (потребуются credentials от StarLine API)
3. Данные начнут поступать через ~3 минуты

## Получение StarLine API credentials

1. Зайдите на https://my.starline.ru
2. Раздел "Разработчикам" → "API"
3. Создайте приложение
4. Скопируйте **Application ID** и **Secret**

## Структура проекта

```
starline-monitor-optimized/
├── docker-compose.yml      # Оркестрация контейнеров
├── .env.example            # Пример конфигурации
├── init-db/                # SQL инициализация БД
│   └── 01-init.sql
├── backend/                # FastAPI REST API (async)
│   ├── main.py
│   ├── requirements.txt
│   └── Dockerfile
├── worker/                 # Async worker для StarLine API
│   ├── worker.py
│   ├── requirements.txt
│   └── Dockerfile
└── frontend/               # Next.js 15 интерфейс
    ├── src/
    ├── package.json
    └── Dockerfile
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `GET /api/auth/me` - Профиль

### Devices
- `GET /api/devices` - Список устройств
- `POST /api/devices` - Добавить устройство
- `DELETE /api/devices/{id}` - Удалить
- `GET /api/devices/{id}/latest` - Последнее состояние
- `GET /api/devices/{id}/state` - История (параметр `hours`)
- `GET /api/devices/{id}/stats` - Статистика

### Maintenance
- `GET /api/devices/{id}/maintenance` - Записи ТО
- `POST /api/devices/{id}/maintenance` - Добавить ТО
- `PUT /api/devices/{id}/maintenance/{mid}` - Обновить
- `DELETE /api/devices/{id}/maintenance/{mid}` - Удалить
- `GET /api/devices/{id}/maintenance/upcoming` - Предстоящие ТО
- `GET /api/service-types` - Типы обслуживания

## Разработка

### Backend локально

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend локально

```bash
cd frontend
bun install
bun run dev
```

### Worker локально

```bash
cd worker
pip install -r requirements.txt
python worker.py --daemon
```

## Production рекомендации

1. **Измените JWT_SECRET** на надёжный случайный ключ
2. **Используйте HTTPS** через reverse proxy (nginx/traefik)
3. **Настройте backup** базы данных
4. **Мониторинг** через healthcheck endpoints
5. **Logs** собирайте в централизованную систему

## Лицензия

MIT
