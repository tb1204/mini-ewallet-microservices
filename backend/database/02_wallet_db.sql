-- ====================================================================
-- MICROSERVICE 2: WALLET SERVICE DATABASE
-- Target DB Name: wallet_db
-- ====================================================================

-- 1. Create Extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create Wallets Table
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL, 
    balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'VND',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, LOCKED, FROZEN
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create Savings Accounts Table
CREATE TABLE IF NOT EXISTS savings_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    principal_amount NUMERIC(15, 2) NOT NULL CHECK (principal_amount > 0),
    interest_rate NUMERIC(5, 2) NOT NULL, -- Lãi suất %/năm (vd: 8.00)
    term_months INT NOT NULL DEFAULT 0, -- 0: Không kỳ hạn, 3, 6, 12
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, WITHDRAWN
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create Wallet Operations Table (Idempotency Ledger)
CREATE TABLE IF NOT EXISTS wallet_operations (
    id BIGSERIAL PRIMARY KEY,
    operation_key VARCHAR(100) UNIQUE NOT NULL,
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    operation_type VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Seed Initial Data (Thay thế w/s bằng hex hợp lệ d11/d22/d33/e11/e22)
INSERT INTO wallets
(id, user_id, balance, currency, status)
VALUES
('d11ebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 25450000.00, 'VND', 'ACTIVE'),
('d22ebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 500000000.00, 'VND', 'ACTIVE'),
('d33ebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 12300000.00, 'VND', 'ACTIVE')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO savings_accounts
(id, wallet_id, title, principal_amount, interest_rate, term_months, status)
VALUES
('e11ebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'd11ebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Tích Luỹ Linh Hoạt', 10000000.00, 4.00, 0, 'ACTIVE'),
('e22ebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'd11ebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Tiết Kiệm Tương Lai 6M', 50000000.00, 7.20, 6, 'ACTIVE')
ON CONFLICT (id) DO NOTHING;
