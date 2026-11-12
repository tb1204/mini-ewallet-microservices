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
    performer VARCHAR(100),
    performer_role VARCHAR(50),
    target_user VARCHAR(100),
    service_name VARCHAR(50),
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
('SINGLE_TRANSFER_LIMIT', '20000000', 'Hạn mức tối đa cho 1 giao dịch (20 triệu VNĐ)'),
('MIN_TRANSFER_AMOUNT', '10000', 'Số tiền chuyển tối thiểu (10.000 VNĐ)'),
('WITHDRAW_FEE', '5000', 'Phí rút tiền cố định (5.000 VNĐ)'),
('P2P_FEE_PERCENT', '0.0', 'Phí chuyển tiền P2P (%)'),
('OTP_THRESHOLD', '2000000', 'Ngưỡng bắt buộc xác thực OTP (2 triệu VNĐ)'),
('MAINTENANCE_MODE', 'false', 'Bật/Tắt chế độ bảo trì hệ thống'),
('ALLOW_REGISTRATION', 'true', 'Cho phép người dùng mới đăng ký')
ON CONFLICT (key) DO NOTHING;

INSERT INTO audit_logs
(id, action, performer, performer_role, target_user, service_name, ip_address, details, created_at)
VALUES
('a0011111-1111-1111-1111-111111111111', 'UNLOCK_ACCOUNT', 'Quản Trị Viên (Admin)', 'ROLE_ADMIN', 'user456 (Lê Văn B)', 'identity-service', '192.168.1.100', '{"reason": "Đã xác minh giấy tờ tùy thân"}'::jsonb, NOW() - INTERVAL '5 minutes'),
('a0022222-2222-2222-2222-222222222222', 'LOCK_ACCOUNT', 'Quản Trị Viên (Admin)', 'ROLE_ADMIN', 'user123 (Nguyễn Văn User)', 'identity-service', '192.168.1.100', '{"reason": "Nhập sai mã PIN quá 5 lần"}'::jsonb, NOW() - INTERVAL '10 minutes'),
('a0033333-3333-3333-3333-333333333333', 'UPDATE_CONFIG', 'Quản Trị Viên (Admin)', 'ROLE_ADMIN', 'Hệ Thống Tham Số', 'audit-service', '192.168.1.100', '{"key": "DAILY_TRANSFER_LIMIT", "newValue": "100000000"}'::jsonb, NOW() - INTERVAL '25 minutes')
ON CONFLICT (id) DO NOTHING;
