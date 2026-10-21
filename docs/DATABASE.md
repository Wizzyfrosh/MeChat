# MeChat database architecture — Phase 2 foundation

## Provisioning (2026-10-21)
- Dedicated Neon project: `orange-bar-92581848` (MeChat).
- Postgres database: `mechat`; default branch: `main`.
- Neon selected `aws-us-west-2`. This is a **development baseline**, not an assertion that Oregon is optimal for Nigeria-based users. Before placing real user data, choose a coordinated Vercel function and database region. Region migration requires a new Neon project/transfer.
- No application tables have been migrated into Neon yet.
- Credentials belong in the deployment environment, not this repository.

## Schema source
- `src/db/schema.ts`: typed Drizzle tables for conversations, messages, settings, usage events.
- `src/db/client.ts`: lazy server-only Neon HTTP connection. Build does not need a DB URL.
- `drizzle.config.ts`: schema and migration configuration.

## Tables
`conversations`: UUID primary key, Better Auth user ID, title, created/updated timestamps. Owner/recency index.

`messages`: UUID primary key, owning conversation cascade foreign key, request UUID and role uniqueness to support retry idempotency, content, status (`pending`/`complete`/`interrupted`/`failed`), AI provider/model, token counts, ordered index.

`user_settings`: Better Auth user ID primary key, light/dark/system theme and response style.

`usage_events`: model/provider request log, owner, token counts, cost estimate in integer micro-USD, unique request UUID. Usage survives conversation deletion, with nullable conversation pointer.

**Important:** Better Auth will generate/manage its own user/account/session/verification schema in the authentication milestone. We deliberately do not generate duplicate versions of its tables. Application user IDs are text and owner checks must be enforced by the server; future migrations can add explicit foreign keys to the finalized Better Auth user schema.

## Safe migration workflow
1. Configure `DATABASE_URL` privately (Neon connection string; server-only).
2. Run `npm install` to resolve dependencies and commit the resulting `package-lock.json`.
3. Run `npm run db:generate` to create migration SQL and review it in a pull request.
4. Exercise the migration on a **separate Neon development branch**.
5. Have the user explicitly approve applying the reviewed schema to the intended Neon main branch before running migrations.
6. Only then set environment variables and enable database routes.

## Security invariants
- Session + per-conversation ownership checks on every read, mutation and stream.
- Never trust `userId` submitted by the browser; derive it from the validated server session.
- Bounded pagination and token/cost quotas.
- Use DB transactions or explicit failure states for interrupted model streams.
- Protect sensitive data from logs and never expose DATABASE_URL to client code.

**Status:** Schema code only; no migrations applied and no live DB access from the web UI.
