## Pro Plan Payment Integration - Technical Notes

### Architecture
- **Pattern**: Provider-agnostic payment webhook handler
- **Current**: Hotmart sandbox, future: Stripe
- **Key**: Single RPC (`activate_pro_membership`) + separate validators/parsers per provider
- **Migration path**: Change affiliate link + signature validator, nothing else

### Database Design
- `memberships` table: tracks subscriptions per user (unique constraint on active)
- `payment_webhooks` table: audit log + replay attack prevention
- `email_logs` table: debug email delivery
- Triggers sync `memberships.status` → `user_profiles.subscription_plan`

### Key RPCs
1. `activate_pro_membership(user_id, plan_id, provider, external_id, metadata)` 
   - Generates temp password
   - Inserts membership
   - Flags force_password_change = true
   - Returns temp_password for email

2. `force_password_change(current_pwd, new_pwd)`
   - Validates 8 char, upper, lower, number, special
   - Updates encrypted_password via crypt()
   - Clears force_password_change flag

3. `must_change_password()`
   - Checks current user's flag
   - Returns boolean + reason

### Payment Flow
- Hotmart → X-Hotmart-Signature (HMAC-SHA256)
- Stripe → stripe-signature (timestamp + sig)
- Both validated via crypto.createHmac('sha256', secret)
- Webhook payload → log + verify signature → activate_pro_membership → send email

### Frontend Components
- `UpgradeProModal`: Shows features, redirects to Hotmart affiliate link
- `ForcePasswordChangeModal`: Modal + `useMustChangePassword()` hook
- Both bilingual (ES/EN via useI18n)

### Email Service
- Note: Placeholder RPC `send_email()` in 019_*
- TODO: Integrate Resend, SendGrid, or Supabase email provider
- Templates: HTML + plaintext, with gradient design

### Env Variables Required
```
VITE_HOTMART_SANDBOX_AFFILIATE_LINK=https://sandbox.hotmart.com/a/.../PRODUCT_CODE
VITE_HOTMART_SANDBOX_API_KEY=basic_xxx (for webhook signature validation)
HOTMART_API_KEY=basic_xxx (backend)
PRO_PLAN_ID=uuid (from plans table)
SUPABASE_SERVICE_ROLE_KEY=xxx (backend)
VITE_APP_ENV=development|production
```

### Considerations
- User must already exist in `auth.users` BEFORE webhook is processed
- Temp password generated in DB, never stored, sent via email only
- RLS policies: only admin/service role can read memberships initially
- Webhook signature validation prevents replay attacks + tampering

### Files Created (11 files)
- `supabase/migrations/017_memberships_table.sql` (260 lines)
- `supabase/migrations/018_payment_webhooks_table.sql` (180 lines)
- `supabase/migrations/019_pro_membership_email_password_change.sql` (280 lines)
- `src/utils/payments.ts` (220 lines)
- `src/utils/emailTemplates.ts` (210 lines)
- `src/components/common/UpgradeProModal.tsx` (280 lines)
- `src/components/common/ForcePasswordChangeModal.tsx` (380 lines)
- `HOTMART_STRIPE_SETUP.md` (600+ lines)
- `PRO_PLAN_INTEGRATION.md` (400+ lines)
- `PRO_PLAN_RESUMEN.md` (250+ lines)
- Migration 015 updated (2 params → firm with email + password)

### Migration to Stripe
Minimal changes:
1. Update env: `VITE_STRIPE_PUBLISHABLE_KEY` + `STRIPE_SECRET_KEY`
2. Change webhook endpoint validation: `stripe.webhooks.constructEvent()`
3. Change parser: `parseStripeWebhook()` instead of `parseHotmartWebhook()`
4. Everything else identical: same RPC, same email, same DB structure

### Status
✅ Code complete
✅ Types defined (TypeScript)
✅ i18n ready (ES/EN)
⏳ Migrations pending deployment
⏳ Frontend integration pending (add components to Dashboard)
⏳ Hotmart/Stripe account setup pending
⏳ Webhook backend handler pending (Express or Edge Function)
⏳ Email service integration pending (Resend/SendGrid)

### Testing Checklist
- [ ] Migrations applied to Supabase
- [ ] RPCs callable and return correct types
- [ ] Hotmart sandbox product created ($9.99/month)
- [ ] Hotmart webhook URL configured
- [ ] Affiliate link in env
- [ ] Test payment with card 4111 1111 1111 1111
- [ ] Webhook log appears in DB
- [ ] Email received with temp password
- [ ] User can login with temp password
- [ ] ForcePasswordChangeModal appears
- [ ] Password change successful
- [ ] subscription_plan = 'pro' in DB
- [ ] Force flag cleared after password change
