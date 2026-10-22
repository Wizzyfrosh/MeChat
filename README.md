# MeChat

**MeChat is an authentication-first AI chat web application.** This repository contains a responsive chat workspace, email/password authentication with six-digit email verification, PostgreSQL conversation persistence, and a server-side DeepSeek streaming endpoint.

## Product flow

- Visiting `/` redirects guests to `/sign-in` and signed-in users to `/chat`.
- `/sign-up` creates an account; Brevo delivers the six-digit verification email.
- After verification and login, the chat workspace provides conversations, search, rename/delete, streaming model answers, Markdown/code rendering, light/dark mode, and settings.
- A conversation is only visible to its signed-in owner.

There is **no homepage, demo chat, or publicly accessible model endpoint** in this version.

## Tech stack

Next.js 16, React 19, TypeScript, Tailwind CSS, Better Auth + email OTP, Brevo transactional email, Drizzle ORM, Neon PostgreSQL, and DeepSeek Chat Completions (SSE). Deployment target: Vercel.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set the environment values using your secret manager before expecting authentication, model answers, or persistence. Run `npm run lint`, `npm run typecheck`, and `npm run build`.

## Required environment

`DATABASE_URL` — dedicated Neon PostgreSQL connection string.

`BETTER_AUTH_URL` — the actual scheme + host of the deployment, e.g. `https://mechat.example.com`.

`BETTER_AUTH_SECRET` — long random secret (minimum 32 bytes).

`BREVO_API_KEY` and `BREVO_SENDER_EMAIL` — verified sender credentials.

`DEEPSEEK_API_KEY` — server-side inference credential.

Optional `AI_DAILY_MESSAGE_LIMIT` — server-side quota, default 30 messages per user/day.

**Never** put credentials in `NEXT_PUBLIC_*`, browser storage, committed files, or chat screenshots.

## Database releases

Code generation: `npm run db:generate`. Inspect SQL on a disposable Neon development branch, then request explicit approval before applying schema to the real database. Authentication will not function until the schema has been migrated.

## Deployment and release gates

- Runtime features are not considered live until credentials and database tables exist, and the signup → OTP → login → stream → revisit workflow has been tested.
- Perform mobile/desktop visual QA and accessibility testing before release.
- Validate OTP expiry/retry, duplicate signup, per-conversation authorization, chat quotas, session handling, streamed errors and restarts.
- Avoid publishing a claim that MeChat is production-ready before these gates pass.

See `docs/` for implementation roadmap and security notes.

### Install MeChat as an app

Open the HTTPS production site in Chrome and select **Install MeChat** when offered, or use Chrome's **Install app / Add to home screen** menu. The app opens in its own standalone window. On iPhone/iPad, use Safari's **Share → Add to Home Screen → Open as Web App**.

The manifest starts at `/chat`; the existing session check sends signed-out users to sign-in. Only the public offline screen is cached. Signing in, loading conversations, and generating replies require internet; private pages, API responses and credentials are never added to the service-worker cache. Browser installation prompts remain controlled by the browser and may require interaction with the site first.
