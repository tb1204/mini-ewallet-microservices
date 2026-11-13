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

CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_service ON audit_logs(service_name);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

-- 4. Seed Initial Dynamic Configurations
INSERT INTO system_configs
(key, value, description)
VALUES
('DAILY_TRANSFER_LIMIT', '100000000', 'Hạn mức chuyển tiền tối đa trong ngày (100.000.000 VNĐ)'),
('SINGLE_TRANSFER_LIMIT', '20000000', 'Hạn mức tối đa cho 1 giao dịch (20.000.000 VNĐ)'),
('MIN_TRANSFER_AMOUNT', '10000', 'Số tiền giao dịch tối thiểu (10.000 VNĐ)'),
('WITHDRAW_FEE', '5000', 'Phí rút tiền cố định về ngân hàng liên kết (5.000 VNĐ)'),
('P2P_FEE_PERCENT', '0.0', 'Tỷ lệ phí chuyển tiền nội bộ giữa các ví P2P (%)'),
('DEPOSIT_FEE_PERCENT', '0.0', 'Phí nạp tiền vào ví qua cổng thanh toán (%)'),
('UTILITY_COMMISSION_PERCENT', '2.0', 'Tỷ lệ hoa hồng đối tác thanh toán hóa đơn tiện ích (%)'),
('OTP_THRESHOLD', '2000000', 'Ngưỡng giá trị giao dịch bắt buộc xác thực bảo mật OTP 120s (2.000.000 VNĐ)'),
('MAINTENANCE_MODE', 'false', 'Chế độ bảo trì hệ thống toàn diện (true: Chặn giao dịch, false: Hoạt động)'),
('ALLOW_REGISTRATION', 'true', 'Cho phép người dùng mới đăng ký tài khoản ví')
ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    description = EXCLUDED.description;

-- 5. Seed Initial 5W1H Audit Logs
INSERT INTO audit_logs
(id, action, performer, performer_role, target_user, service_name, ip_address, details, created_at)
VALUES
(
    'a0011111-1111-1111-1111-111111111111', 
    'TRANSFER', 
    'user@novapay.com (Nguyễn Văn A)', 
    'ROLE_USER', 
    'tranthib@novapay.com', 
    'transaction-service', 
    '127.0.0.1', 
    '{"amount": 500000, "fee": 0, "type": "WALLET", "status": "SUCCESS", "channel": "WEB"}'::jsonb, 
    NOW() - INTERVAL '2 hours'
),
(
    'a0022222-2222-2222-2222-222222222222', 
    'VERIFY_OTP', 
    'user@novapay.com (Nguyễn Văn A)', 
    'ROLE_USER', 
    'Hệ Thống Xác Thực', 
    'transaction-service', 
    '127.0.0.1', 
    '{"action": "HIGH_VALUE_TX_OTP", "amount": 2500000, "result": "VERIFIED"}'::jsonb, 
    NOW() - INTERVAL '3 hours'
),
(
    'a0033333-3333-3333-3333-333333333333', 
    'UPDATE_CONFIG', 
    'admin@novapay.com (Administrator)', 
    'ROLE_ADMIN', 
    'Tham Số Hệ Thống', 
    'audit-service', 
    '127.0.0.1', 
    '{"key": "OTP_THRESHOLD", "oldValue": "1000000", "newValue": "2000000"}'::jsonb, 
    NOW() - INTERVAL '5 hours'
)
ON CONFLICT (id) DO NOTHING;
