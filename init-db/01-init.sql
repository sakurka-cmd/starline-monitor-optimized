-- StarLine Monitor Database Schema v3.0
-- Optimized with indexes and proper types

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(64) NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User devices table
CREATE TABLE IF NOT EXISTS user_devices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    app_id VARCHAR(255) NOT NULL,
    app_secret VARCHAR(255) NOT NULL,
    starline_login VARCHAR(255) NOT NULL,
    starline_password VARCHAR(255) NOT NULL,
    starline_device_id BIGINT DEFAULT NULL,
    device_name VARCHAR(100) DEFAULT NULL,
    slnet_token VARCHAR(512) DEFAULT NULL,
    starline_user_id VARCHAR(64) DEFAULT NULL,
    is_active TINYINT DEFAULT 1,
    last_update TIMESTAMP NULL DEFAULT NULL,
    last_error TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_starline_device_id (starline_device_id),
    INDEX idx_is_active (is_active),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Devices info table
CREATE TABLE IF NOT EXISTS devices (
    device_id BIGINT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    alias VARCHAR(100) DEFAULT NULL,
    device_type VARCHAR(50) DEFAULT NULL,
    firmware_version VARCHAR(50) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Device states table (optimized for time-series data)
CREATE TABLE IF NOT EXISTS device_states (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    device_id BIGINT NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    arm_state TINYINT DEFAULT 0,
    ign_state TINYINT DEFAULT 0,
    temp_inner DECIMAL(5,2) DEFAULT NULL,
    temp_engine DECIMAL(5,2) DEFAULT NULL,
    balance DECIMAL(10,2) DEFAULT NULL,
    latitude DECIMAL(10,8) DEFAULT NULL,
    longitude DECIMAL(11,8) DEFAULT NULL,
    speed INT DEFAULT NULL,
    mileage INT DEFAULT NULL,
    fuel_litres DECIMAL(6,2) DEFAULT NULL,
    motohrs INT DEFAULT NULL,
    gsm_level INT DEFAULT NULL,
    battery_voltage DECIMAL(5,2) DEFAULT NULL,
    raw_data JSON DEFAULT NULL,
    INDEX idx_device_timestamp (device_id, timestamp DESC),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Service types table
CREATE TABLE IF NOT EXISTS service_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    default_interval_km INT DEFAULT NULL,
    default_interval_hours INT DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Maintenance records table
CREATE TABLE IF NOT EXISTS maintenance_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id BIGINT NOT NULL,
    service_type VARCHAR(100) NOT NULL,
    description TEXT DEFAULT NULL,
    mileage_at_service INT DEFAULT NULL,
    motohrs_at_service INT DEFAULT NULL,
    service_date DATE NOT NULL,
    next_service_mileage INT DEFAULT NULL,
    next_service_motohrs INT DEFAULT NULL,
    cost DECIMAL(10,2) DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_device_date (device_id, service_date DESC),
    INDEX idx_service_type (service_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default service types
INSERT IGNORE INTO service_types (name, default_interval_km, default_interval_hours) VALUES
('Замена масла двигателя', 10000, 250),
('Замена масла АКПП', 60000, NULL),
('Замена воздушного фильтра', 15000, NULL),
('Замена салонного фильтра', 15000, NULL),
('Замена топливного фильтра', 30000, NULL),
('Замена свечей зажигания', 30000, NULL),
('Замена ремня ГРМ', 60000, NULL),
('Замена тормозных колодок передних', 40000, NULL),
('Замена тормозных колодок задних', 60000, NULL),
('Замена тормозной жидкости', 40000, NULL),
('Замена антифриза', 60000, NULL),
('Другое', NULL, NULL);

SET FOREIGN_KEY_CHECKS = 1;
