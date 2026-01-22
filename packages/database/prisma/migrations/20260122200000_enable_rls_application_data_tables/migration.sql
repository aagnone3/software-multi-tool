-- Phase 4: Enable Row Level Security on application data tables
-- This migration completes the RLS implementation for all remaining application tables.
--
-- Tables in scope (8 tables):
-- - ai_chat: Chat conversations (user or org scoped)
-- - purchase: Subscriptions/purchases (user or org scoped)
-- - credit_balance: Org credit balance (org members)
-- - credit_transaction: Credit history (org members)
-- - audit_log: Activity logs (admins only)
-- - notification: User notifications (user's own)
-- - tool_job: Background jobs (user scoped)
-- - rate_limit_entry: Rate limit tracking (system only)
--
-- Since this application uses Prisma (which connects via service role), it bypasses RLS.
-- By enabling RLS without creating any policies, we effectively deny all access
-- to these tables via PostgREST while allowing Prisma/service role full access.
--
-- This is the recommended pattern for application tables that should only be
-- accessed through the API layer (Hono + oRPC) and never directly via PostgREST.

-- Enable RLS on ai_chat table (chat conversations)
ALTER TABLE "public"."ai_chat" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on purchase table (subscriptions and purchases)
ALTER TABLE "public"."purchase" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on credit_balance table (organization credit balances)
ALTER TABLE "public"."credit_balance" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on credit_transaction table (credit transaction history)
ALTER TABLE "public"."credit_transaction" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on audit_log table (activity and security logs)
ALTER TABLE "public"."audit_log" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on notification table (user notifications)
ALTER TABLE "public"."notification" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on tool_job table (background job processing)
ALTER TABLE "public"."tool_job" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on rate_limit_entry table (rate limiting tracking)
ALTER TABLE "public"."rate_limit_entry" ENABLE ROW LEVEL SECURITY;

-- No policies are created intentionally:
-- - Service role (used by Prisma) bypasses RLS automatically
-- - Anonymous and authenticated roles have no access policies, so all access is denied
-- - All table access must go through the API layer (Hono + oRPC), which handles
--   authorization logic in the application code
--
-- Access patterns enforced at API layer:
-- - ai_chat: Users can only access their own chats or chats in their orgs
-- - purchase: Users can only access their own purchases or org purchases
-- - credit_balance: Org members can view their org's credit balance
-- - credit_transaction: Org members can view their org's transaction history
-- - audit_log: Only admins can view audit logs
-- - notification: Users can only access their own notifications
-- - tool_job: Users can only access their own jobs
-- - rate_limit_entry: System-managed, no direct user access
