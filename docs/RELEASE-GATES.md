# MeChat release readiness — security and deployment gates

**Status: BLOCKED — preview verification is not production approval.**

## 1. Source branch dependency order

The incremental branches are stacked, not independent release candidates:

1. PR #3 — `redesign/auth-first-workspace` -> `main`
2. PR #4 — `feat/free-ai-providers` -> PR #3 branch
3. PR #5 — `feat/production-chat-hardening` -> PR #4 branch
4. PR #6 — `feat/history-search-export-controls` -> PR #5 branch
5. PR #7 — `feat/account-preferences` -> PR #6 branch
6. This security gate branch -> PR #7 branch

Do **not** merge a downstream branch directly into `main` while
the preceding branches remain unreviewed. Ensure each base/head pair and
SHA are correct, review all diffs, and use protected branch checks.

## 2. Confirm preview configuration and isolation

- [ ] Confirm Preview `DATABASE_URL` refers to **a dedicated test database**, not production.
- [ ] Confirm Vercel Preview `BETTER_AUTH_URL` and allowed origins work for the tested exact URL.
- [ ] Verify two disposable, separately registered, verified test accounts can sign in.
- [ ] Never paste passwords, tokens, session cookies or database URLs in GitHub or chat.
- [ ] Never give a scripted test an administrator's everyday account.
- [ ] Review upstream AI provider terms for routing private user text.

## 3. Automated QA — preview only

After the preview deployment is READY, supply disposable account credentials
through your private shell or an appropriately protected CI environment (not
via command-line arguments, repository files, or echo commands). Use the
following named variables:

- `E2E_BASE_URL`: **exact** deployed MeChat Vercel preview HTTPS URL
- `E2E_USER_A_EMAIL`, `E2E_USER_A_PASSWORD`
- `E2E_USER_B_EMAIL`, `E2E_USER_B_PASSWORD`
- `E2E_ALLOW_PREVIEW_WRITES=YES`: acknowledge test mutations are permitted
  **only** after checking the target uses a disposable database

Run `npm run test:release:isolated`. This intentionally requires real
authenticated sessions; normal lint/build unit tests do not substitute for it.

The smoke test only creates and deletes one generated test conversation and
briefly modifies/restores test account A's theme. It **never** invokes the
clear-all-chats endpoint. It covers anonymous access, distinct users, title
search isolation, chat reads/updates/deletes, single/full exports, preferences,
and invalid Origin handling. A failure produces a nonzero exit status.

Do not invoke this smoke script through a CI job automatically until the
protected disposable credentials and database scope are confirmed.

## 4. Manual functional and security QA

- [ ] Create an AI response with Groq and a second configured provider.
  Verify the stream ends correctly, reload persists the answer, and message
  order is user then assistant.
- [ ] Abort an in-flight AI response, then refresh; incomplete responses must
  not be marked complete or included in the next model prompt.
- [ ] Test duplicate requests, daily quota behavior, and two concurrent tabs.
- [ ] Search >80 owned conversations, including pagination under concurrent
  adds/renames. Search for literal `%`, `_`, `\\` characters.
- [ ] Download one conversation as Markdown and JSON, and full history as JSON.
  Validate the actual file content and character encoding.
- [ ] Test ownership checks for thread GET/PATCH/DELETE/export using two users.
- [ ] Test clearing history **only** in disposable accounts, after export.
  Check that no other user's messages were altered.
- [ ] Reload light/dark and balanced/concise/detailed settings and test them
  on a second device. Test failed settings writes and rollback UI.
- [ ] Verify anonymous health responses never expose provider IDs, keys,
  internal database states, or credential checks.
- [ ] Verify no credentials, OTPs, session cookies, or chat bodies appear in logs.
- [ ] Conduct mobile browser checks on iOS Safari and Android Chrome.

## 5. Production environment gate — currently incomplete

In the Vercel `mechat` project, check the **Production** environment for:

- `DATABASE_URL` — dedicated **production** Neon database; never copy a
  preview/test database URL into production without explicitly deciding the
  migration and data plan.
- `BETTER_AUTH_SECRET` — securely generated production-grade secret.
  Manage session migration/rotation intentionally; unplanned changes sign
  users out.
- `BETTER_AUTH_URL` — exact production origin:
  `https://mechat.froshcodeorbit.site`.
- `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, and approved AI provider secrets
  for Production; confirm values exist without printing or decrypting them.
- Apply/review required database migrations in a controlled process and back up
  production data before any schema or data change.

**Do not deploy to production** if any required item is missing or if the
preview and production database URLs unexpectedly point to the same database.

## 6. Production release and rollback

- [ ] Resolve every required PR and security gate.
- [ ] Freeze an exact reviewed commit SHA.
- [ ] Confirm GitHub lint, TypeScript, unit tests, and Vercel build passed on
  **that exact SHA**.
- [ ] Stage a production build without changing the domain, then run relevant
  smoke tests against a protected staging target.
- [ ] Promote only after release authorization. Monitor errors, sign-in, signup,
  chat streaming, quotas, and database health immediately afterwards.
- [ ] Document the prior deployment ID and rollback process.
- [ ] Do not treat a preview's READY build as proof of correct auth or privacy.

## 7. Known limitations to plan around

- Searches using `ILIKE` over message content may degrade without suitable
  indexes as chat volume grows. Benchmark on representative data and consider
  `pg_trgm` after measuring.
- A full account export covers chats, messages, and basic profile information,
  **not** all independent accounting records, and is not a complete regulatory
  portability or account-erasure workflow.
- Clearing conversation history does not remove the account or content-free
  usage counters. Document retention policy and add audited account deletion
  separately.
- Vercel short-lived functions and free AI quotas can limit very large exports
  and long generations; measure and cap behavior before broad launch.
