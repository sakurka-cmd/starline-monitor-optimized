"""
StarLine Monitoring Backend v3.0 - Optimized
Features: Async/await, Connection Pooling, Caching, Maintenance tracking
"""
from datetime import datetime, timedelta, date
from functools import lru_cache
from typing import Optional, List
import hashlib
import os
import logging

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
import aiomysql
import jwt

# Configuration
class Config:
    MYSQL_HOST: str = os.getenv("MYSQL_HOST", "localhost")
    MYSQL_PORT: int = int(os.getenv("MYSQL_PORT", "3306"))
    MYSQL_USER: str = os.getenv("MYSQL_USER", "starline")
    MYSQL_PASSWORD: str = os.getenv("MYSQL_PASSWORD", "")
    MYSQL_DATABASE: str = os.getenv("MYSQL_DATABASE", "starline_db")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "change-this-secret-in-production")
    JWT_ALGO: str = "HS256"
    DB_POOL_SIZE: int = int(os.getenv("DB_POOL_SIZE", "10"))
    DB_POOL_RECYCLE: int = int(os.getenv("DB_POOL_RECYCLE", "3600"))

config = Config()

# Logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("starline-api")

# Database Pool
class DatabasePool:
    pool: Optional[aiomysql.Pool] = None

    @classmethod
    async def init_pool(cls):
        if cls.pool is None:
            cls.pool = await aiomysql.create_pool(
                host=config.MYSQL_HOST,
                port=config.MYSQL_PORT,
                user=config.MYSQL_USER,
                password=config.MYSQL_PASSWORD,
                db=config.MYSQL_DATABASE,
                minsize=2,
                maxsize=config.DB_POOL_SIZE,
                pool_recycle=config.DB_POOL_RECYCLE,
                charset='utf8mb4',
                autocommit=True
            )
            logger.info(f"Database pool created (max {config.DB_POOL_SIZE} connections)")

    @classmethod
    async def close_pool(cls):
        if cls.pool:
            cls.pool.close()
            await cls.pool.wait_closed()
            logger.info("Database pool closed")

    @classmethod
    async def get_connection(cls):
        if cls.pool is None:
            await cls.init_pool()
        return cls.pool.acquire()

# FastAPI App
app = FastAPI(
    title="StarLine API v3",
    description="Optimized async API for StarLine monitoring",
    version="3.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

security = HTTPBearer()

# Models
class UserReg(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class DeviceAdd(BaseModel):
    name: str
    app_id: str
    app_secret: str
    starline_login: str
    starline_password: str

class MaintenanceAdd(BaseModel):
    device_id: int
    service_type: str
    description: Optional[str] = None
    mileage_at_service: Optional[int] = None
    motohrs_at_service: Optional[int] = None
    service_date: date
    next_service_mileage: Optional[int] = None
    next_service_motohrs: Optional[int] = None
    cost: Optional[float] = None
    notes: Optional[str] = None

class MaintenanceUpdate(BaseModel):
    service_type: Optional[str] = None
    description: Optional[str] = None
    mileage_at_service: Optional[int] = None
    motohrs_at_service: Optional[int] = None
    service_date: Optional[date] = None
    next_service_mileage: Optional[int] = None
    next_service_motohrs: Optional[int] = None
    cost: Optional[float] = None
    notes: Optional[str] = None

# Utility Functions
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def create_token(user_id: int, email: str) -> str:
    return jwt.encode(
        {"user_id": user_id, "email": email, "exp": datetime.utcnow() + timedelta(hours=24)},
        config.JWT_SECRET,
        algorithm=config.JWT_ALGO
    )

def verify_token(token: str) -> dict:
    try:
        return jwt.decode(token, config.JWT_SECRET, algorithms=[config.JWT_ALGO])
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    return verify_token(credentials.credentials)

# Startup/Shutdown Events
@app.on_event("startup")
async def startup():
    await DatabasePool.init_pool()
    logger.info("Application started")

@app.on_event("shutdown")
async def shutdown():
    await DatabasePool.close_pool()
    logger.info("Application shutdown")

# ==================== AUTH ====================

@app.post("/api/auth/register")
async def register(user: UserReg):
    async with await DatabasePool.get_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT id FROM users WHERE email = %s", (user.email,))
            if await cur.fetchone():
                raise HTTPException(400, "Email already exists")
            
            await cur.execute(
                "INSERT INTO users (email, password_hash, name) VALUES (%s, %s, %s)",
                (user.email, hash_password(user.password), user.name)
            )
            user_id = cur.lastrowid
    
    return {
        "token": create_token(user_id, user.email),
        "user": {"id": user_id, "email": user.email, "name": user.name}
    }

@app.post("/api/auth/login")
async def login(user: UserLogin):
    async with await DatabasePool.get_connection() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute(
                "SELECT id, email, name FROM users WHERE email = %s AND password_hash = %s",
                (user.email, hash_password(user.password))
            )
            result = await cur.fetchone()
    
    if not result:
        raise HTTPException(401, "Invalid credentials")
    
    return {"token": create_token(result['id'], result['email']), "user": result}

@app.get("/api/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    async with await DatabasePool.get_connection() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute(
                "SELECT id, email, name, created_at FROM users WHERE id = %s",
                (current_user['user_id'],)
            )
            return await cur.fetchone()

# ==================== DEVICES ====================

@app.get("/api/devices")
async def list_devices(current_user: dict = Depends(get_current_user)):
    async with await DatabasePool.get_connection() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute("""
                SELECT 
                    ud.id, ud.name, ud.starline_device_id, ud.device_name, ud.is_active, 
                    ud.last_update, ud.created_at,
                    ds.arm_state, ds.ign_state, ds.temp_inner, ds.temp_engine, 
                    ds.balance, ds.latitude, ds.longitude, ds.timestamp as state_timestamp,
                    ds.mileage, ds.fuel_litres, ds.motohrs, ds.speed, ds.battery_voltage
                FROM user_devices ud
                LEFT JOIN (
                    SELECT device_id, arm_state, ign_state, temp_inner, temp_engine, 
                           balance, latitude, longitude, timestamp, mileage, fuel_litres, 
                           motohrs, speed, battery_voltage,
                           ROW_NUMBER() OVER (PARTITION BY device_id ORDER BY timestamp DESC) as rn
                    FROM device_states
                ) ds ON ud.starline_device_id = ds.device_id AND ds.rn = 1
                WHERE ud.user_id = %s AND ud.is_active = 1
                ORDER BY ud.created_at DESC
            """, (current_user['user_id'],))
            return await cur.fetchall()

@app.post("/api/devices")
async def add_device(device: DeviceAdd, current_user: dict = Depends(get_current_user)):
    async with await DatabasePool.get_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                """INSERT INTO user_devices 
                   (user_id, name, app_id, app_secret, starline_login, starline_password) 
                   VALUES (%s, %s, %s, %s, %s, %s)""",
                (current_user['user_id'], device.name, device.app_id, device.app_secret,
                 device.starline_login, device.starline_password)
            )
            return {"message": "OK", "device_id": cur.lastrowid}

@app.delete("/api/devices/{device_id}")
async def delete_device(device_id: int, current_user: dict = Depends(get_current_user)):
    async with await DatabasePool.get_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "SELECT id FROM user_devices WHERE id = %s AND user_id = %s",
                (device_id, current_user['user_id'])
            )
            if not await cur.fetchone():
                raise HTTPException(404, "Device not found")
            
            await cur.execute("DELETE FROM user_devices WHERE id = %s", (device_id,))
            return {"message": "Deleted"}

@app.get("/api/devices/{device_id}/latest")
async def get_latest(device_id: int, current_user: dict = Depends(get_current_user)):
    async with await DatabasePool.get_connection() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute(
                "SELECT id, name, starline_device_id, device_name, last_update FROM user_devices WHERE id = %s AND user_id = %s",
                (device_id, current_user['user_id'])
            )
            device = await cur.fetchone()
            if not device:
                raise HTTPException(404, "Device not found")
            
            state = None
            if device['starline_device_id']:
                await cur.execute("""
                    SELECT * FROM device_states 
                    WHERE device_id = %s ORDER BY timestamp DESC LIMIT 1
                """, (device['starline_device_id'],))
                state = await cur.fetchone()
            
            return {"device": device, "state": state}

@app.get("/api/devices/{device_id}/state")
async def get_history(device_id: int, hours: int = 24, current_user: dict = Depends(get_current_user)):
    async with await DatabasePool.get_connection() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute(
                "SELECT starline_device_id FROM user_devices WHERE id = %s AND user_id = %s",
                (device_id, current_user['user_id'])
            )
            device = await cur.fetchone()
            if not device:
                raise HTTPException(404, "Device not found")
            
            if not device['starline_device_id']:
                return []
            
            await cur.execute("""
                SELECT timestamp, arm_state, ign_state, temp_inner, temp_engine, 
                       balance, latitude, longitude, speed, mileage, fuel_litres, motohrs, battery_voltage
                FROM device_states 
                WHERE device_id = %s AND timestamp >= DATE_SUB(NOW(), INTERVAL %s HOUR)
                ORDER BY timestamp DESC
            """, (device['starline_device_id'], hours))
            return await cur.fetchall()

# ==================== STATISTICS ====================

@app.get("/api/devices/{device_id}/stats")
async def get_stats(device_id: int, days: int = 7, current_user: dict = Depends(get_current_user)):
    async with await DatabasePool.get_connection() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute(
                "SELECT starline_device_id FROM user_devices WHERE id = %s AND user_id = %s",
                (device_id, current_user['user_id'])
            )
            device = await cur.fetchone()
            if not device:
                raise HTTPException(404, "Device not found")
            
            if not device['starline_device_id']:
                return {}
            
            sl_id = device['starline_device_id']
            result = {}
            
            # Current stats
            await cur.execute("""
                SELECT mileage, fuel_litres, motohrs, timestamp
                FROM device_states WHERE device_id = %s AND mileage IS NOT NULL
                ORDER BY timestamp DESC LIMIT 1
            """, (sl_id,))
            result['current'] = await cur.fetchone()
            
            # Previous stats
            await cur.execute("""
                SELECT mileage, motohrs, timestamp FROM device_states 
                WHERE device_id = %s AND mileage IS NOT NULL
                AND timestamp <= DATE_SUB(NOW(), INTERVAL %s DAY)
                ORDER BY timestamp DESC LIMIT 1
            """, (sl_id, days))
            result['previous'] = await cur.fetchone()
            
            # Calculate differences
            if result['current'] and result['previous']:
                if result['current'].get('mileage') and result['previous'].get('mileage'):
                    result['mileage_diff'] = result['current']['mileage'] - result['previous']['mileage']
                if result['current'].get('motohrs') and result['previous'].get('motohrs'):
                    result['motohrs_diff'] = result['current']['motohrs'] - result['previous']['motohrs']
            
            # Fuel stats
            await cur.execute("""
                SELECT AVG(fuel_litres) as avg_fuel, MIN(fuel_litres) as min_fuel, MAX(fuel_litres) as max_fuel
                FROM device_states WHERE device_id = %s AND fuel_litres IS NOT NULL
                AND timestamp >= DATE_SUB(NOW(), INTERVAL %s DAY)
            """, (sl_id, days))
            result['fuel_stats'] = await cur.fetchone()
            
            return result

# ==================== MAINTENANCE ====================

@lru_cache(maxsize=1)
def _get_service_types_cache_key():
    return "service_types"

@app.get("/api/service-types")
async def get_service_types():
    async with await DatabasePool.get_connection() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute("SELECT * FROM service_types ORDER BY name")
            return await cur.fetchall()

@app.get("/api/devices/{device_id}/maintenance")
async def get_maintenance(device_id: int, current_user: dict = Depends(get_current_user)):
    async with await DatabasePool.get_connection() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute(
                "SELECT starline_device_id FROM user_devices WHERE id = %s AND user_id = %s",
                (device_id, current_user['user_id'])
            )
            device = await cur.fetchone()
            if not device:
                raise HTTPException(404, "Device not found")
            
            if not device['starline_device_id']:
                return []
            
            await cur.execute("""
                SELECT m.*, ds_current.mileage as current_mileage, ds_current.motohrs as current_motohrs
                FROM maintenance_records m
                LEFT JOIN (
                    SELECT device_id, mileage, motohrs FROM device_states 
                    WHERE device_id = %s ORDER BY timestamp DESC LIMIT 1
                ) ds_current ON 1=1
                WHERE m.device_id = %s
                ORDER BY m.service_date DESC
            """, (device['starline_device_id'], device['starline_device_id']))
            records = await cur.fetchall()
            
            for record in records:
                if record.get('current_mileage') and record.get('mileage_at_service'):
                    record['km_since_service'] = record['current_mileage'] - record['mileage_at_service']
                if record.get('current_motohrs') and record.get('motohrs_at_service'):
                    record['hours_since_service'] = record['current_motohrs'] - record['motohrs_at_service']
            
            return records

@app.post("/api/devices/{device_id}/maintenance")
async def add_maintenance(device_id: int, m: MaintenanceAdd, current_user: dict = Depends(get_current_user)):
    async with await DatabasePool.get_connection() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute(
                "SELECT starline_device_id FROM user_devices WHERE id = %s AND user_id = %s",
                (device_id, current_user['user_id'])
            )
            device = await cur.fetchone()
            if not device:
                raise HTTPException(404, "Device not found")
            
            if not device['starline_device_id']:
                raise HTTPException(400, "Device not synced with StarLine yet")
            
            sl_id = device['starline_device_id']
            mileage, motohrs = m.mileage_at_service, m.motohrs_at_service
            next_km, next_hours = m.next_service_mileage, m.next_service_motohrs
            
            # Get current values if not provided
            if mileage is None or motohrs is None:
                await cur.execute(
                    "SELECT mileage, motohrs FROM device_states WHERE device_id = %s ORDER BY timestamp DESC LIMIT 1",
                    (sl_id,)
                )
                current = await cur.fetchone()
                if current:
                    mileage = mileage or current['mileage']
                    motohrs = motohrs or current['motohrs']
            
            # Get default intervals
            if next_km is None or next_hours is None:
                await cur.execute(
                    "SELECT default_interval_km, default_interval_hours FROM service_types WHERE name = %s",
                    (m.service_type,)
                )
                st = await cur.fetchone()
                if st:
                    next_km = next_km or st['default_interval_km']
                    next_hours = next_hours or st['default_interval_hours']
            
            await cur.execute("""
                INSERT INTO maintenance_records 
                (device_id, service_type, description, mileage_at_service, motohrs_at_service,
                 service_date, next_service_mileage, next_service_motohrs, cost, notes)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (sl_id, m.service_type, m.description, mileage, motohrs,
                  m.service_date, next_km, next_hours, m.cost, m.notes))
            
            return {"id": cur.lastrowid, "message": "OK"}

@app.put("/api/devices/{device_id}/maintenance/{mid}")
async def update_maintenance(device_id: int, mid: int, m: MaintenanceUpdate, current_user: dict = Depends(get_current_user)):
    async with await DatabasePool.get_connection() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute(
                "SELECT starline_device_id FROM user_devices WHERE id = %s AND user_id = %s",
                (device_id, current_user['user_id'])
            )
            device = await cur.fetchone()
            if not device:
                raise HTTPException(404, "Device not found")
            
            await cur.execute(
                "SELECT id FROM maintenance_records WHERE id = %s AND device_id = %s",
                (mid, device['starline_device_id'])
            )
            if not await cur.fetchone():
                raise HTTPException(404, "Record not found")
            
            updates, values = [], []
            for field in ['service_type', 'description', 'mileage_at_service', 'motohrs_at_service',
                          'service_date', 'next_service_mileage', 'next_service_motohrs', 'cost', 'notes']:
                val = getattr(m, field, None)
                if val is not None or field in ['description', 'notes', 'cost']:
                    updates.append(f"{field} = %s")
                    values.append(val)
            
            if updates:
                values.extend([mid, device['starline_device_id']])
                await cur.execute(
                    f"UPDATE maintenance_records SET {', '.join(updates)} WHERE id = %s AND device_id = %s",
                    values
                )
            
            return {"message": "OK"}

@app.delete("/api/devices/{device_id}/maintenance/{mid}")
async def delete_maintenance(device_id: int, mid: int, current_user: dict = Depends(get_current_user)):
    async with await DatabasePool.get_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "SELECT starline_device_id FROM user_devices WHERE id = %s AND user_id = %s",
                (device_id, current_user['user_id'])
            )
            device = await cur.fetchone()
            if not device:
                raise HTTPException(404, "Device not found")
            
            await cur.execute(
                "DELETE FROM maintenance_records WHERE id = %s AND device_id = %s",
                (mid, device['starline_device_id'])
            )
            return {"message": "Deleted"}

@app.get("/api/devices/{device_id}/maintenance/upcoming")
async def get_upcoming(device_id: int, current_user: dict = Depends(get_current_user)):
    async with await DatabasePool.get_connection() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute(
                "SELECT starline_device_id FROM user_devices WHERE id = %s AND user_id = %s",
                (device_id, current_user['user_id'])
            )
            device = await cur.fetchone()
            if not device:
                raise HTTPException(404, "Device not found")
            
            if not device['starline_device_id']:
                return []
            
            sl_id = device['starline_device_id']
            
            await cur.execute(
                "SELECT mileage, motohrs FROM device_states WHERE device_id = %s ORDER BY timestamp DESC LIMIT 1",
                (sl_id,)
            )
            current = await cur.fetchone()
            if not current:
                return []
            
            await cur.execute("""
                SELECT m.*, 
                       m.mileage_at_service + m.next_service_mileage as next_mileage_due,
                       m.motohrs_at_service + m.next_service_motohrs as next_motohrs_due
                FROM maintenance_records m
                WHERE m.device_id = %s
                AND m.id IN (
                    SELECT MAX(id) FROM maintenance_records 
                    WHERE device_id = %s AND service_type = m.service_type
                )
            """, (sl_id, sl_id))
            records = await cur.fetchall()
            
            upcoming = []
            for r in records:
                km_left = (r['next_mileage_due'] - current['mileage']) if r.get('next_mileage_due') and current.get('mileage') else None
                hours_left = (r['next_motohrs_due'] - current['motohrs']) if r.get('next_motohrs_due') and current.get('motohrs') else None
                
                is_due = (
                    (km_left is not None and km_left <= (r.get('next_service_mileage') or 0) * 0.1) or
                    (hours_left is not None and hours_left <= (r.get('next_service_motohrs') or 0) * 0.1) or
                    (km_left is not None and km_left < 0) or
                    (hours_left is not None and hours_left < 0) or
                    (km_left is not None and km_left < 2000) or
                    (hours_left is not None and hours_left < 50)
                )
                
                if is_due:
                    upcoming.append({
                        **r,
                        'km_left': km_left,
                        'hours_left': hours_left,
                        'is_overdue': (km_left is not None and km_left < 0) or (hours_left is not None and hours_left < 0)
                    })
            
            upcoming.sort(key=lambda x: (x.get('km_left') or 999999, x.get('hours_left') or 999999))
            return upcoming

# ==================== HEALTH ====================

@app.get("/api/health")
async def health():
    return {"status": "ok", "time": datetime.utcnow().isoformat()}
