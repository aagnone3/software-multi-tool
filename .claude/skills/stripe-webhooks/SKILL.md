---
name: stripe-webhooks
description: Tests Stripe webhooks locally with Stripe CLI forwarding, Test Clock simulation, account alignment, webhook events, subscription renewals, and account mismatch troubleshooting.
allowed-tools:
  - Bash
  - Read
  - Grep
---

# Stripe Webhooks Skill

> Local webhook testing and Stripe integration guidance

## When to Use This Skill

Invoke this skill when:

- Testing Stripe webhooks locally with the Stripe CLI
- Debugging webhook delivery or processing issues
- Validating webhook integration with your application
- Fixing "account mismatch" errors between CLI and API keys
- Testing subscription renewals with Stripe Test Clock
- Simulating time advancement for subscription testing
- Troubleshooting "No such price" or payment source errors

**Activation keywords**: stripe webhooks, webhook testing, stripe listen, test clock, stripe account mismatch, subscription renewal testing

## Quick Start

### Prerequisites

1. **Stripe CLI installed**: `brew install stripe/stripe-cli/stripe`
2. **Dev server running**: `pnpm dev` (note the port, e.g., 3002)
3. **Environment configured**: `apps/web/.env.local` with Stripe keys

### 3-Step Local Webhook Testing

```bash
# Terminal 1: Start Stripe CLI webhook forwarding
stripe listen --forward-to http://localhost:3002/api/webhooks/payments

# Terminal 2: Start dev server
pnpm dev

# Terminal 3: Run webhook test script
pnpm --filter @repo/scripts stripe:test-credits
```

Copy the webhook signing secret (`whsec_...`) from Terminal 1 to `apps/web/.env.local`:

```bash
STRIPE_WEBHOOK_SECRET="whsec_..."
```

---

## Account Structure

### Critical: Sandbox vs Production Account IDs

**Stripe sandbox (test mode) has a DIFFERENT account ID than production.**

| Environment | Account ID Format        | Key Prefix             |
|-------------|--------------------------|------------------------|
| Sandbox     | `acct_XXXXX` (different) | `sk_test_`, `pk_test_` |
| Production  | `acct_YYYYY` (different) | `sk_live_`, `pk_live_` |

This means:

- CLI logged into sandbox uses sandbox account ID
- CLI logged into production uses production account ID
- **Keys from one won't work with webhooks from the other**

### Verifying Account Alignment

```bash
# Check which account CLI is connected to
stripe config --list

# Look for:
# account_id = 'acct_XXXXX'
# test_mode_api_key = 'sk_test_51XXXXX...'
```

The `STRIPE_SECRET_KEY` in `.env.local` must be from the **same account** the CLI is connected to.

---

## Environment Variables

### Required in `apps/web/.env.local`

```bash
# Stripe API key (must match CLI account)
STRIPE_SECRET_KEY="sk_test_..."

# Webhook signing secret (from `stripe listen` output)
STRIPE_WEBHOOK_SECRET="whsec_..."

# Price IDs (must exist in same Stripe account)
NEXT_PUBLIC_PRICE_ID_PRO_MONTHLY="price_..."
NEXT_PUBLIC_PRICE_ID_PRO_YEARLY="price_..."
```

### Price ID Configuration

Price IDs are account-specific. When switching Stripe accounts:

1. Create products/prices in the new account
2. Update all `NEXT_PUBLIC_PRICE_ID_*` variables
3. Update `config/index.ts` if prices are hardcoded there

---

## Troubleshooting

### Webhooks Not Received

**Symptom**: `stripe listen` shows "Ready!" but no events appear.

**Checklist**:

1. **Account mismatch** (most common):

   ```bash
   # Check CLI account
   stripe config --list | grep account_id

   # Compare with API key account (visible in Stripe Dashboard URL or API errors)
   ```

2. **Port mismatch**:

   ```bash
   # Check what port dev server is running on
   lsof -i -P | grep node | grep LISTEN

   # Update CLI to match
   stripe listen --forward-to http://localhost:YOUR_PORT/api/webhooks/payments
   ```

3. **Webhook secret not set**:

   ```bash
   grep STRIPE_WEBHOOK_SECRET apps/web/.env.local
   ```

### "No such price" Error

**Cause**: Price ID belongs to different Stripe account than API key.

**Fix**:

1. Log into Stripe Dashboard for the account matching your API key
2. Find/create the product and price
3. Update `NEXT_PUBLIC_PRICE_ID_*` in `.env.local`

### "No attached payment source" Error

**Cause**: Test subscription requires payment method.

**Fix**: The test script automatically attaches `tok_visa` test token. If you see this error, ensure you're using the updated test script.

### Webhook Handler Returns Errors

Check dev server logs for:

- Signature verification failures (wrong `STRIPE_WEBHOOK_SECRET`)
- Missing organization (customer not linked to org)
- Database errors (missing migrations)

---

## Test Script Details

### Location

`tooling/scripts/src/stripe/test-credit-webhooks.ts`

### What It Tests

1. **New Subscription**: Creates test org, customer, subscription → verifies credits granted
2. **Subscription Renewal**: Uses Stripe Test Clock to advance time → verifies credits reset
3. **Cleanup**: Removes all test resources

### Test Clock Usage

Stripe Test Clocks allow simulating time advancement without waiting:

```typescript
// Create clock frozen at specific time
const clock = await stripe.testHelpers.testClocks.create({
  frozen_time: Math.floor(Date.now() / 1000),
  name: "Test Clock",
});

// Create customer attached to clock
const customer = await stripe.customers.create({
  test_clock: clock.id,
  // ...
});

// Advance time to trigger renewal
await stripe.testHelpers.testClocks.advance(clock.id, {
  frozen_time: currentTime + (35 * 24 * 60 * 60), // +35 days
});
```

---

## Webhook Events Handled

| Event                            | Handler                      | Action                          |
|----------------------------------|------------------------------|---------------------------------|
| `customer.subscription.created`  | `handleSubscriptionCreated`  | Create purchase, grant credits  |
| `invoice.paid` (renewal)         | `handleInvoicePaid`          | Reset credits for new period    |
| `customer.subscription.updated`  | `handleSubscriptionUpdated`  | Adjust credits on plan change   |
| `customer.subscription.deleted`  | `handleSubscriptionDeleted`  | Mark subscription cancelled     |

### Event Flow: Subscription Renewal

```text
invoice.paid (billing_reason: subscription_cycle)
  └─> Get subscription ID from invoice.parent.subscription_details
  └─> Look up organization by customer ID
  └─> Reset credits: used=0, overage=0, update period dates
```

---

## Switching Stripe Accounts

When switching between Stripe accounts (e.g., personal → company):

1. **Re-login CLI**:

   ```bash
   stripe login
   # Select correct account
   ```

2. **Update `.env.local`**:
   - `STRIPE_SECRET_KEY` from new account
   - `STRIPE_WEBHOOK_SECRET` from new `stripe listen` session
   - All `NEXT_PUBLIC_PRICE_ID_*` with prices from new account

3. **Restart**:
   - Restart `stripe listen`
   - Restart dev server (to pick up new env vars)

4. **Verify alignment**:

   ```bash
   # CLI account
   stripe config --list | grep account_id

   # Should match account in Dashboard when using the API key
   ```

---

## Related Skills

- **architecture**: Understanding the payments integration
- **debugging**: Troubleshooting webhook delivery and processing issues
- **tools**: Understanding credit costs for tools
- **better-auth**: User and organization authentication for subscriptions
- **application-environments**: Local development environment setup

## Related Files

- **Webhook handler**: `packages/payments/provider/stripe/index.ts`
- **Test script**: `tooling/scripts/src/stripe/test-credit-webhooks.ts`
- **Credit service**: `packages/database/src/lib/credits.ts`
- **Config**: `config/index.ts` (plan credits, price mappings)
