-- ====================================================================
-- MICROSERVICE 5: NOTIFICATION SERVICE DATABASE
-- Target DB Name: notification_db
-- ====================================================================

-- 1. Create Extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title VARCHAR(150) NOT NULL,
    detail VARCHAR(500) NOT NULL,
    type VARCHAR(30) DEFAULT 'SYSTEM', -- SYSTEM, TRANSACTION, SECURITY, PROMOTION
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notif_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_created_at ON notifications(created_at);

-- 3. Seed Initial Notifications
INSERT INTO notifications
(id, user_id, title, detail, type, is_read, created_at)
VALUES
(
    'b0011111-1111-1111-1111-111111111111',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Chào mừng bạn đến với NovaPay!',
    'Tài khoản ví điện tử NovaPay của bạn đã được khởi tạo và định danh KYC thành công. Khám phá các tiện ích thanh toán ngay hôm nay!',
    'SYSTEM',
    TRUE,
    NOW() - INTERVAL '3 days'
),
(
    'b0022222-2222-2222-2222-222222222222',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Nạp tiền ví thành công',
    'Giao dịch nạp +2.000.000 VNĐ từ ngân hàng Quân Đội (MBBank - *6789) đã hoàn tất. Số dư ví khả dụng: 25.450.000 VNĐ.',
    'TRANSACTION',
    FALSE,
    NOW() - INTERVAL '1 day'
),
(
    'b0033333-3333-3333-3333-333333333333',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Chuyển tiền P2P thành công',
    'Bạn đã chuyển thành công 500.000 VNĐ đến ví Trần Thị B (tranthib@novapay.com). Mã giao dịch: TX1723984729.',
    'TRANSACTION',
    FALSE,
    NOW() - INTERVAL '2 hours'
)
ON CONFLICT (id) DO NOTHING;

