-- TradeCore Africa — Invoice Finance Platform
-- Database Schema v1.0
-- Run this against a fresh PostgreSQL database

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── BUSINESSES ───────────────────────────────────────────────────────────────
-- Companies that upload invoices and receive financing
CREATE TABLE IF NOT EXISTS businesses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(255) NOT NULL,
  registration_no VARCHAR(100) UNIQUE NOT NULL,
  email           VARCHAR(255) UNIQUE NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  country         VARCHAR(100) NOT NULL DEFAULT 'Nigeria',
  sector          VARCHAR(100),
  phone           VARCHAR(50),
  verified        BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- ── INVOICES ─────────────────────────────────────────────────────────────────
-- Invoices uploaded by businesses for financing consideration
CREATE TABLE IF NOT EXISTS invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  invoice_number  VARCHAR(100) NOT NULL,
  debtor_name     VARCHAR(255) NOT NULL,
  debtor_email    VARCHAR(255),
  amount          NUMERIC(15,2) NOT NULL,
  currency        VARCHAR(10) NOT NULL DEFAULT 'NGN',
  due_date        DATE NOT NULL,
  description     TEXT,
  status          VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  -- PENDING | UNDER_REVIEW | APPROVED | FUNDED | REPAID | REJECTED
  document_key    VARCHAR(500),  -- S3 key for invoice document
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW(),
  UNIQUE(business_id, invoice_number)
);

-- ── FINANCE REQUESTS ─────────────────────────────────────────────────────────
-- When a business requests financing against an invoice
CREATE TABLE IF NOT EXISTS finance_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id        UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  business_id       UUID NOT NULL REFERENCES businesses(id),
  requested_amount  NUMERIC(15,2) NOT NULL,
  advance_rate      NUMERIC(5,2),   -- percentage advanced e.g. 80.00
  fee_rate          NUMERIC(5,2),   -- fee percentage e.g. 2.50
  fee_amount        NUMERIC(15,2),
  disbursed_amount  NUMERIC(15,2),
  status            VARCHAR(50) NOT NULL DEFAULT 'SUBMITTED',
  -- SUBMITTED | UNDER_REVIEW | APPROVED | DISBURSED | REPAID | DECLINED
  reviewed_by       VARCHAR(255),
  review_notes      TEXT,
  submitted_at      TIMESTAMP DEFAULT NOW(),
  reviewed_at       TIMESTAMP,
  disbursed_at      TIMESTAMP,
  repaid_at         TIMESTAMP,
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW()
);

-- ── TRANSACTIONS ─────────────────────────────────────────────────────────────
-- Immutable record of every financial movement
CREATE TABLE IF NOT EXISTS transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id      UUID REFERENCES finance_requests(id),
  business_id     UUID NOT NULL REFERENCES businesses(id),
  type            VARCHAR(50) NOT NULL,
  -- DISBURSEMENT | REPAYMENT | FEE | REVERSAL
  amount          NUMERIC(15,2) NOT NULL,
  currency        VARCHAR(10) NOT NULL DEFAULT 'NGN',
  reference       VARCHAR(255) UNIQUE,
  description     TEXT,
  created_at      TIMESTAMP DEFAULT NOW()
  -- transactions are never updated or deleted — append only
);

-- ── AUDIT LOG ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     UUID REFERENCES businesses(id),
  action          VARCHAR(255) NOT NULL,
  resource        VARCHAR(100),
  resource_id     UUID,
  metadata        JSONB,
  ip_address      INET,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ── INDEXES ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_invoices_business    ON invoices(business_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status      ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_requests_business    ON finance_requests(business_id);
CREATE INDEX IF NOT EXISTS idx_requests_status      ON finance_requests(status);
CREATE INDEX IF NOT EXISTS idx_transactions_business ON transactions(business_id);
CREATE INDEX IF NOT EXISTS idx_audit_business       ON audit_log(business_id);
CREATE INDEX IF NOT EXISTS idx_audit_created        ON audit_log(created_at);

-- ── SEED DATA ─────────────────────────────────────────────────────────────────
-- Test business account: email=demo@acmesupplies.ng password=Demo1234!
INSERT INTO businesses (name, registration_no, email, password_hash, country, sector, verified)
VALUES (
  'Acme Supplies Ltd',
  'RC-1234567',
  'demo@acmesupplies.ng',
  '$2a$12$LQv3c1yqBwEHFg6HLL1GbuMn9j/6fZFWEOjHXiqAJ2C9ER7QJLG4i',
  'Nigeria',
  'Manufacturing',
  TRUE
) ON CONFLICT DO NOTHING;
