-- ====================================================================
-- MASTER DATABASE INITIALIZATION SCRIPT FOR NOVAPAY MICROSERVICES
-- Run this script as 'postgres' superuser to create all required databases.
-- ====================================================================

SELECT 'Creating database identity_db...' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'identity_db')
CREATE DATABASE identity_db;

SELECT 'Creating database wallet_db...' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'wallet_db')
CREATE DATABASE wallet_db;

SELECT 'Creating database transaction_db...' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'transaction_db')
CREATE DATABASE transaction_db;

SELECT 'Creating database audit_db...' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'audit_db')
CREATE DATABASE audit_db;

SELECT 'Creating database notification_db...' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'notification_db')
CREATE DATABASE notification_db;

