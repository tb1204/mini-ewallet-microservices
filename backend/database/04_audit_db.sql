-- ====================================================================
-- MICROSERVICE 4: AUDIT SERVICE DATABASE
-- Target DB Name: audit_db
-- ====================================================================

-- 1. Create Extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create System Configs Table
CREATE TABLE IF NOT EXISTS system_configs (
    key VARCHAR(50) PRIMARY KEY,
    value VARCHAR(255) NOT NULL,
    description TEXT,
    updated_by UUID,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Seed Initial Data
INSERT INTO system_configs
(key, value, description)
VALUES
('DAILY_TRANSFER_LIMIT', '100000000', 'Hạn mức chuyển tiền tối đa trong ngày (100 triệu VNĐ)'),
('MIN_TRANSFER_AMOUNT', '10000', 'Số tiền chuyển tối thiểu (10.000 VNĐ)'),
('MAINTENANCE_MODE', 'false', 'Bật/Tắt chế độ bảo trì hệ thống'),
('ALLOW_REGISTRATION', 'true', 'Cho phép người dùng mới đăng ký')
ON CONFLICT (key) DO NOTHING;
