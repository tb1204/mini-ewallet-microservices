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

-- 4. Seed Initial Data
INSERT INTO users 
(id, username, email, phone_number, password_hash, pin_hash, full_name, role, avatar_url, kyc_status) 
VALUES 
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'nguyenvana', 'user@ewallet.com', '0988776655', '$2a$10$abcdefghijklmnopqrstuvwxyz0123456789', '$2a$10$abcdefghijklmnopqrstuvwxyz0123456789', 'Nguyễn Văn A', 'ROLE_USER', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80', 'VERIFIED'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'admin', 'admin@ewallet.com', '0900000000', '$2a$10$abcdefghijklmnopqrstuvwxyz0123456789', '$2a$10$abcdefghijklmnopqrstuvwxyz0123456789', 'Administrator', 'ROLE_ADMIN', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80', 'VERIFIED'),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'tranthib', 'tranthib@ewallet.com', '0912345678', '$2a$10$abcdefghijklmnopqrstuvwxyz0123456789', '$2a$10$abcdefghijklmnopqrstuvwxyz0123456789', 'Trần Thị B', 'ROLE_USER', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80', 'VERIFIED')
ON CONFLICT (username) DO NOTHING;
