-- Migration: Add Midtrans columns to payments table
-- Stores Midtrans Snap token, order ID, transaction ID, and payment method

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS snap_token TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS midtrans_order_id TEXT UNIQUE;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS midtrans_transaction_id TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
