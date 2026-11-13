-- ====================================================================
-- MICROSERVICE 1: IDENTITY SERVICE DATABASE
-- Target DB Name: identity_db
-- ====================================================================

-- 1. Create Extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    pin_hash VARCHAR(255),
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'ROLE_USER', -- ROLE_USER, ROLE_ADMIN
    avatar_url TEXT,
    kyc_status VARCHAR(20) DEFAULT 'VERIFIED', -- UNVERIFIED, PENDING, VERIFIED
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create Refresh Tokens Table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);

-- 4. Seed Initial Data
-- Note: Default password for all seed accounts is 'user123' (or 'admin123' for admin), PIN is '123456'.
-- BCrypt hashes:
-- 'admin123' -> '$2a$10$CnZREQcYiswHWlvJPbcOfeeoxE8iPkfNy3m0//IwAWwgefwqYQcQ6'
-- 'user123'  -> '$2a$10$TLZUuUIxlAY3TH4etoC0uexvDKLy8aDcwu2mRacpx3FLPcC62kG4.'
-- '123456'   -> '$2a$10$34oNfzLWsFezd73F8mQI.eK7FOjTsqM3gTKEs0Pxe4UUvWf24Jqhe'
INSERT INTO users 
(id, username, email, phone_number, password_hash, pin_hash, full_name, role, avatar_url, kyc_status, is_active) 
VALUES 
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 
    'nguyenvana', 
    'user@novapay.com', 
    '0988776655', 
    '$2a$10$TLZUuUIxlAY3TH4etoC0uexvDKLy8aDcwu2mRacpx3FLPcC62kG4.', 
    '$2a$10$34oNfzLWsFezd73F8mQI.eK7FOjTsqM3gTKEs0Pxe4UUvWf24Jqhe', 
    'Nguyễn Văn A', 
    'ROLE_USER', 
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80', 
    'VERIFIED',
    TRUE
),
(
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 
    'admin', 
    'admin@novapay.com', 
    '0900000000', 
    '$2a$10$CnZREQcYiswHWlvJPbcOfeeoxE8iPkfNy3m0//IwAWwgefwqYQcQ6', 
    '$2a$10$34oNfzLWsFezd73F8mQI.eK7FOjTsqM3gTKEs0Pxe4UUvWf24Jqhe', 
    'Quản Trị Viên (Admin)', 
    'ROLE_ADMIN', 
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80', 
    'VERIFIED',
    TRUE
),
(
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 
    'tranthib', 
    'tranthib@novapay.com', 
    '0912345678', 
    '$2a$10$TLZUuUIxlAY3TH4etoC0uexvDKLy8aDcwu2mRacpx3FLPcC62kG4.', 
    '$2a$10$34oNfzLWsFezd73F8mQI.eK7FOjTsqM3gTKEs0Pxe4UUvWf24Jqhe', 
    'Trần Thị B', 
    'ROLE_USER', 
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80', 
    'VERIFIED',
    TRUE
)
ON CONFLICT (username) DO NOTHING;
