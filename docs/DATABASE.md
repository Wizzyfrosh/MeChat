# MeChat database: schema and migrations

## Environments (2026-10-21)

- Neon project: `orange-bar-92581848` (MeChat).
- Database: `mechat` on PostgreSQL 18.
- **Production/main branch:** `br-square-cake-arbrz98c`. Initial application migration has **NOT** been applied.
- **Preview branch:** `br-blue-cake-ar9amf8p` (`mechat-preview`). Initial schema **applied and verified**: 9 public tables, 19 public indexes and 4 foreign keys at baseline.
- Vercel preview `DATABASE_URL` points to the **preview branch**, encrypted.
- Region: Neon `aws-us-west-2`. Consider data residency and latency before accepting real users.

## Source of truth

- `src/db/auth-schema.ts` provides Better Auth tables.
- `src/db/schema.ts` provides conversations, messages, settings, usage events and atomic daily quota reservations.
- `db/migrations/0001_mechat_initial.sql` is the versioned initial schema SQL **for review**. It is not automatically executed in CI or during Vercel build.
- `drizzle.config.ts` can generate future Drizzle migrations, but there is not yet a fully baselined Drizzle migration journal.

## Safe database release

1. Verify the versioned SQL against the TypeScript schema and current Better Auth release.
2. Test expected login/signup/OTP and conversation CRUD on the **isolated Neon preview branch**.
3. Have the user explicitly approve any change to the production/main branch.
4. Apply the reviewed SQL once to production only after approval and scheduled backup/rollback plan.
5. Establish a matching Drizzle migration journal/baseline before using `drizzle-kit migrate`. Do **not** run `db:generate` and blindly migrate the existing initial schema again.
6. Update the production server-side `DATABASE_URL` and complete end-to-end testing.

## Data model

Better Auth: `user`, `account`, `session`, `verification`.
MeChat: `conversations` (per-user ownership), `messages` (cascade deleted on conversation deletion), `user_settings`, `usage_events`, `ai_daily_quotas` (atomic daily request budget).

Messages have a unique (`conversation_id`, `request_id`, `role`) index to support idempotent writes, and statuses `pending`, `complete`, `failed`, `interrupted`. Conversation and usage records are indexed by user ID.

**Important:** A passing schema check is not a complete security test. Verify per-user isolation with two separate test accounts before production.
