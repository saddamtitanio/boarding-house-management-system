-- Migration: Add performance indexes for messaging, conversations, and visitor logs
-- 1. Index on messages(sender_id) to optimize joining message sender profiles
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);

-- 2. Index on conversations(created_at) to speed up conversation thread sorting
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON public.conversations(created_at DESC);

-- 3. Index on visitor_logs(tenant_id) to optimize tenant-specific visitor lists
CREATE INDEX IF NOT EXISTS idx_visitor_logs_tenant_id ON public.visitor_logs(tenant_id);

-- 4. Partial index on visitor_logs(check_out_at) to optimize active (inside) visitor lookups
CREATE INDEX IF NOT EXISTS idx_visitor_logs_active ON public.visitor_logs(check_out_at) WHERE check_out_at IS NULL;
