-- ====================================================================
-- MICROSERVICE 3: TRANSACTION SERVICE DATABASE
-- Target DB Name: transaction_db
-- ====================================================================

-- 1. Create Extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_code VARCHAR(50) UNIQUE NOT NULL,
    sender_wallet_id UUID, 
    receiver_wallet_id UUID, 
    service_type VARCHAR(30) NOT NULL, -- TOPUP, TRANSFER, WITHDRAW, UTILITY_BILL, UTILITY_DATA, UTILITY_MOVIE, SAVINGS, INSURANCE
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    fee NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS', -- PENDING, SUCCESS, FAILED, CANCELLED
    description TEXT,
    idempotency_key VARCHAR(100) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create Idempotency Keys Table
CREATE TABLE IF NOT EXISTS idempotency_keys (
    key VARCHAR(100) PRIMARY KEY,
    user_id UUID NOT NULL,
    request_path VARCHAR(255) NOT NULL,
    response_code INT,
    response_body JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'PROCESSING', -- PROCESSING, COMPLETED, FAILED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 4. Create Saga Instances Table
CREATE TABLE IF NOT EXISTS saga_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    saga_type VARCHAR(50) NOT NULL, -- TRANSFER_SAGA, PAYMENT_SAGA
    current_step VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'STARTED', -- STARTED, COMPLETED, COMPENSATING, FAILED
    payload JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Seed Initial Data (Thay thế w bằng hex hợp lệ d11/d33)
INSERT INTO transactions
(id, transaction_code, sender_wallet_id, receiver_wallet_id, service_type, amount, fee, status, description, created_at)
VALUES
(gen_random_uuid(), 'TX1723984729', 'd11ebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'd33ebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'TRANSFER', 500000.00, 0.00, 'SUCCESS', 'Chuyển tiền trả tiền ăn trưa cho B', NOW() - INTERVAL '2 hours'),
(gen_random_uuid(), 'TX1723981122', NULL, 'd11ebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'TOPUP', 2000000.00, 0.00, 'SUCCESS', 'Nạp tiền từ Ngân hàng Vietcombank (*8899)', NOW() - INTERVAL '1 day'),
(gen_random_uuid(), 'TX1723979988', 'd11ebc99-9c0b-4ef8-bb6d-6bb9bd380a11', NULL, 'UTILITY_BILL', 485000.00, 0.00, 'SUCCESS', 'Thanh toán tiền điện EVN TP.HCM (Kỳ 08/2026)', NOW() - INTERVAL '2 days'),
(gen_random_uuid(), 'TX1723975544', 'd11ebc99-9c0b-4ef8-bb6d-6bb9bd380a11', NULL, 'UTILITY_DATA', 90000.00, 0.00, 'SUCCESS', 'Đăng ký gói 4G ST90K Viettel Telecom', NOW() - INTERVAL '3 days')
ON CONFLICT (transaction_code) DO NOTHING;
