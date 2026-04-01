#!/usr/bin/env python3
"""
StarLine Worker v5.0 - Optimized Async Version
Features: async/await, connection pooling, parallel device processing
"""

import asyncio
import hashlib
import json
import logging
import os
import re
import signal
import sys
from dataclasses import dataclass
from datetime import datetime
from typing import Optional, List, Dict

import aiohttp
import aiomysql


@dataclass
class Config:
    mysql_host: str = "localhost"
    mysql_port: int = 3306
    mysql_user: str = "starline"
    mysql_password: str = "starline123"
    mysql_database: str = "starline_db"
    poll_interval_seconds: int = 180
    db_pool_size: int = 5

    @classmethod
    def from_env(cls) -> 'Config':
        return cls(
            mysql_host=os.getenv("MYSQL_HOST", "localhost"),
            mysql_port=int(os.getenv("MYSQL_PORT", "3306")),
            mysql_user=os.getenv("MYSQL_USER", "starline"),
            mysql_password=os.getenv("MYSQL_PASSWORD", "starline123"),
            mysql_database=os.getenv("MYSQL_DATABASE", "starline_db"),
            poll_interval_seconds=int(os.getenv("POLL_INTERVAL", "180")),
            db_pool_size=int(os.getenv("DB_POOL_SIZE", "5")),
        )


class StarLineAPI:
    SLID_URL = "https://id.starline.ru"
    WEBAPI_URL = "https://developer.starline.ru"

    def __init__(self, app_id: str, app_secret: str, login: str, password: str,
                 slnet_token: str = None, user_id: str = None):
        self.app_id = app_id
        self.app_secret = app_secret
        self.login = login
        self.password = password
        self.slnet_token = slnet_token
        self.user_id = user_id
        self.logger = logging.getLogger('StarLineAPI')
        self._session: Optional[aiohttp.ClientSession] = None

    async def _get_session(self) -> aiohttp.ClientSession:
        if self._session is None or self._session.closed:
            cookies = {}
            if self.slnet_token:
                cookies["slnet"] = self.slnet_token
            
            self._session = aiohttp.ClientSession(
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    "Accept": "application/json, text/json, */*",
                },
                cookies=cookies
            )
        return self._session

    async def _parse_json(self, resp: aiohttp.ClientResponse) -> dict:
        """Parse JSON response, handling text/json content-type"""
        text = await resp.text()
        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            self.logger.error(f"JSON decode error: {e}, response: {text[:200]}")
            return {}

    async def close(self):
        if self._session and not self._session.closed:
            await self._session.close()

    async def check_session(self) -> bool:
        if not self.slnet_token or not self.user_id:
            return False

        try:
            session = await self._get_session()
            url = f"{self.WEBAPI_URL}/json/v1/user/{self.user_id}/devices"
            async with session.get(url) as resp:
                result = await self._parse_json(resp)
                if result.get("code") in [200, "200"]:
                    self.logger.info("Session is valid")
                    return True
        except Exception as e:
            self.logger.warning(f"Session check failed: {e}")
        return False

    async def authenticate(self) -> bool:
        try:
            session = await self._get_session()
            
            # Step 1: Get code
            secret_md5 = hashlib.md5(self.app_secret.encode()).hexdigest()
            async with session.get(
                f"{self.SLID_URL}/apiV3/application/getCode",
                params={"appId": self.app_id, "secret": secret_md5}
            ) as resp:
                data = await self._parse_json(resp)
                if data.get("state") != 1:
                    self.logger.error(f"getCode failed: {data}")
                    return False
                code = data["desc"]["code"]

            # Step 2: Get app token
            secret_md5 = hashlib.md5((self.app_secret + code).encode()).hexdigest()
            async with session.get(
                f"{self.SLID_URL}/apiV3/application/getToken",
                params={"appId": self.app_id, "secret": secret_md5}
            ) as resp:
                data = await self._parse_json(resp)
                if data.get("state") != 1:
                    self.logger.error(f"getToken failed: {data}")
                    return False
                app_token = data["desc"]["token"]

            # Step 3: User login
            password_sha1 = hashlib.sha1(self.password.encode()).hexdigest()
            async with session.post(
                f"{self.SLID_URL}/apiV3/user/login",
                headers={"token": app_token},
                data={"login": self.login, "pass": password_sha1}
            ) as resp:
                data = await self._parse_json(resp)
                if data.get("state") == 2:
                    self.logger.error(f"2FA required: {data['desc'].get('phone')}")
                    return False
                if data.get("state") != 1:
                    self.logger.error(f"Login failed: {data}")
                    return False
                user_token = data["desc"]["user_token"]

            # Step 4: WebAPI auth
            async with session.post(
                f"{self.WEBAPI_URL}/json/v2/auth.slid",
                json={"slid_token": user_token}
            ) as resp:
                result = await self._parse_json(resp)
                if result.get("code") in ["200", 200]:
                    self.user_id = result.get("user_id")
                if not self.user_id:
                    self.user_id = data["desc"]["id"]

                # Extract slnet token from cookies
                for cookie in session.cookie_jar:
                    if cookie.key == "slnet":
                        self.slnet_token = cookie.value
                        break

                if not self.slnet_token:
                    self.logger.error("slnet token not found!")
                    return False

                self.logger.info(f"Auth successful, user_id: {self.user_id}")
                return True

        except Exception as e:
            self.logger.error(f"Auth error: {e}")
            return False

    async def get_devices(self) -> Optional[List[Dict]]:
        if not self.user_id:
            return None

        session = await self._get_session()
        url = f"{self.WEBAPI_URL}/json/v1/user/{self.user_id}/devices"
        
        async with session.get(url) as resp:
            if resp.status == 429:
                self.logger.error("Rate limited (429)")
                return None
            
            result = await self._parse_json(resp)
            devices = []
            
            if "devices" in result and isinstance(result["devices"], list):
                devices = result["devices"]
            elif "desc" in result:
                if isinstance(result["desc"], list):
                    devices = result["desc"]
                elif isinstance(result["desc"], dict) and "devices" in result["desc"]:
                    devices = result["desc"]["devices"]
            
            return devices

    async def get_device_data(self, device_id: str) -> Optional[Dict]:
        session = await self._get_session()
        data = {}

        # Endpoint 1: /json/v3/device/{id}/data
        async with session.get(f"{self.WEBAPI_URL}/json/v3/device/{device_id}/data") as resp:
            if resp.status == 429:
                return None
            result = await self._parse_json(resp)
            if result.get("code") in [200, "200"]:
                data.update(result.get("data", {}))

        # Endpoint 2: /json/device/{id}/state
        async with session.get(f"{self.WEBAPI_URL}/json/device/{device_id}/state") as resp:
            if resp.status == 429:
                return None
            result = await self._parse_json(resp)
            if result.get("code") in [200, "200"]:
                state_data = result.get("state", {})
                if isinstance(state_data, dict):
                    data.update(state_data)

        return data


class Database:
    def __init__(self, config: Config):
        self.config = config
        self.pool: Optional[aiomysql.Pool] = None
        self.logger = logging.getLogger('Database')

    async def connect(self) -> bool:
        try:
            self.pool = await aiomysql.create_pool(
                host=self.config.mysql_host,
                port=self.config.mysql_port,
                user=self.config.mysql_user,
                password=self.config.mysql_password,
                db=self.config.mysql_database,
                minsize=2,
                maxsize=self.config.db_pool_size,
                charset='utf8mb4',
                autocommit=True
            )
            self.logger.info("Connected to MySQL")
            return True
        except Exception as e:
            self.logger.error(f"MySQL error: {e}")
            return False

    async def close(self):
        if self.pool:
            self.pool.close()
            await self.pool.wait_closed()

    async def get_user_devices(self) -> List[Dict]:
        async with self.pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:
                await cur.execute("""
                    SELECT ud.*, u.email as user_email
                    FROM user_devices ud
                    JOIN users u ON ud.user_id = u.id
                    WHERE ud.is_active = 1
                """)
                return await cur.fetchall()

    async def get_session(self, device_id: int) -> Dict:
        async with self.pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:
                await cur.execute(
                    "SELECT slnet_token, starline_user_id FROM user_devices WHERE id = %s",
                    (device_id,)
                )
                row = await cur.fetchone()
                return row or {}

    async def save_session(self, device_id: int, slnet_token: str, user_id: str):
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute("""
                    UPDATE user_devices 
                    SET slnet_token = %s, starline_user_id = %s
                    WHERE id = %s
                """, (slnet_token, user_id, device_id))
        self.logger.info(f"Session saved for device {device_id}")

    async def update_device_status(self, device_id: int, starline_device_id: str = None,
                                   device_name: str = None, error: str = None):
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute("""
                    UPDATE user_devices SET
                        starline_device_id = %s,
                        device_name = %s,
                        last_update = NOW(),
                        last_error = %s
                    WHERE id = %s
                """, (starline_device_id, device_name, error, device_id))

    async def save_state(self, device_id: str, state_data: Dict):
        if not state_data:
            return

        car_state = state_data.get("car_state", {})
        arm_state = 1 if car_state.get("arm") else 0
        ign_state = 1 if car_state.get("ign") else 0
        
        position = state_data.get("position", {})
        obd = state_data.get("obd", {})
        obd_params = state_data.get("obd_params", {})
        fuel_data = obd_params.get("fuel", {})
        common = state_data.get("common", {})
        
        balance_info = state_data.get("balance", {})
        balance = balance_info.get("active", {}).get("value") if isinstance(balance_info, dict) else None

        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute("""
                    INSERT INTO device_states
                    (device_id, timestamp, arm_state, ign_state, 
                     temp_inner, temp_engine, balance,
                     latitude, longitude, speed, 
                     mileage, fuel_litres, motohrs,
                     gsm_level, battery_voltage, raw_data)
                    VALUES (%s, NOW(), %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    int(device_id),
                    arm_state,
                    ign_state,
                    state_data.get("ctemp"),
                    state_data.get("etemp"),
                    balance,
                    position.get("x"),
                    position.get("y"),
                    position.get("s"),
                    obd.get("mileage") if obd else None,
                    fuel_data.get("val") if fuel_data else obd.get("fuel_litres") if obd else None,
                    common.get("motohrs") if common else state_data.get("state", {}).get("motohrs"),
                    state_data.get("gsm_lvl") or (common.get("gsm_lvl") if common else None),
                    state_data.get("battery") or (common.get("battery") if common else None),
                    json.dumps(state_data, ensure_ascii=False, default=str)
                ))
        
        self.logger.info(f"✓ State saved: {device_id}")


class Worker:
    def __init__(self, config: Config):
        self.config = config
        self.db: Optional[Database] = None
        self.logger = logging.getLogger('Worker')
        self.running = False
        self._rate_limited = False

    async def initialize(self) -> bool:
        logging.basicConfig(
            level=logging.INFO,
            format="%(asctime)s [%(levelname)s] %(message)s"
        )
        self.db = Database(self.config)
        return await self.db.connect()

    async def process_device(self, user_device: Dict) -> bool:
        self.logger.info(f"Processing device: {user_device['name']}")

        session = await self.db.get_session(user_device['id'])
        
        api = StarLineAPI(
            app_id=user_device['app_id'],
            app_secret=user_device['app_secret'],
            login=user_device['starline_login'],
            password=user_device['starline_password'],
            slnet_token=session.get('slnet_token'),
            user_id=str(session.get('starline_user_id', ''))
        )

        try:
            if not await api.check_session():
                self.logger.info("Session invalid, re-authenticating...")
                if not await api.authenticate():
                    await self.db.update_device_status(user_device['id'], error="Auth failed")
                    return True
                await self.db.save_session(user_device['id'], api.slnet_token, str(api.user_id))

            devices = await api.get_devices()
            if devices is None:
                self._rate_limited = True
                return False

            if not devices:
                await self.db.update_device_status(user_device['id'], error="No devices")
                return True

            for device in devices:
                device_id = device.get("device_id") or device.get("id")
                if not device_id:
                    continue

                device_name = device.get("name") or device.get("alias") or str(device_id)
                self.logger.info(f"  Device: {device_name} (ID: {device_id})")

                state = await api.get_device_data(str(device_id))
                if state is None:
                    self._rate_limited = True
                    return False
                
                if state:
                    await self.db.save_state(str(device_id), state)

                await self.db.update_device_status(
                    user_device['id'],
                    starline_device_id=str(device_id),
                    device_name=device_name,
                    error=None
                )

            return True

        finally:
            await api.close()

    async def run_once(self):
        self.logger.info("=" * 50)
        self.logger.info(f"Worker cycle started (interval: {self.config.poll_interval_seconds}s)")

        user_devices = await self.db.get_user_devices()
        self.logger.info(f"Found {len(user_devices)} user devices")
        self._rate_limited = False

        # Process devices with concurrency limit
        semaphore = asyncio.Semaphore(3)  # Max 3 concurrent sessions
        
        async def process_with_semaphore(device):
            async with semaphore:
                try:
                    return await self.process_device(device)
                except Exception as e:
                    self.logger.error(f"Error processing device: {e}")
                    await self.db.update_device_status(device['id'], error=str(e))
                    return True

        results = await asyncio.gather(
            *[process_with_semaphore(d) for d in user_devices],
            return_exceptions=True
        )

        return self._rate_limited

    async def run_daemon(self):
        def handler(sig, frame):
            self.logger.info("Stopping...")
            self.running = False

        signal.signal(signal.SIGINT, handler)
        signal.signal(signal.SIGTERM, handler)

        if not await self.initialize():
            sys.exit(1)

        self.running = True
        self.logger.info("Worker daemon started")

        consecutive_rate_limits = 0

        while self.running:
            try:
                rate_limited = await self.run_once()

                if rate_limited:
                    consecutive_rate_limits += 1
                    backoff = min(300 * (2 ** consecutive_rate_limits), 1800)
                    self.logger.warning(f"Rate limited! Waiting {backoff}s...")
                    await asyncio.sleep(backoff)
                else:
                    consecutive_rate_limits = 0
                    self.logger.info(f"Sleeping {self.config.poll_interval_seconds}s...")
                    await asyncio.sleep(self.config.poll_interval_seconds)

            except Exception as e:
                self.logger.error(f"Error: {e}")
                await asyncio.sleep(60)

        await self.db.close()
        self.logger.info("Worker stopped")


async def main():
    import argparse
    parser = argparse.ArgumentParser(description="StarLine Worker v5.0")
    parser.add_argument("-d", "--daemon", action="store_true", help="Run as daemon")
    args = parser.parse_args()

    config = Config.from_env()
    worker = Worker(config)

    if not await worker.initialize():
        sys.exit(1)

    if args.daemon:
        await worker.run_daemon()
    else:
        await worker.run_once()
        await worker.db.close()


if __name__ == "__main__":
    asyncio.run(main())
