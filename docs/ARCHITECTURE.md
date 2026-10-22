# MeChat architecture — current implementation

MeChat is a Next.js 16 App Router application with TypeScript and a focused original chat interface. It has **no public homepage**. The root route redirects authenticated users to `/chat` and everyone else to `/sign-in`.

## Components
- **React UI:** authentication-first onboarding, responsive chat workspace, grouped history, rename/delete/search, account menu, light/dark, Markdown replies and streaming composer.
- **Better Auth + Drizzle:** email/password, six-digit email OTP verification and recovery, sessions stored in Neon PostgreSQL; Better Auth routes are under `/api/auth/[...all]`.
- **Brevo:** server-side transactional verification and reset-code email sender; no client secret.
- **Neon:** auth tables, conversations, messages, settings, usage events, and daily quota reservations.
- **DeepSeek:** server-only POST `/api/chat` with authenticated session, owner-checked conversation ID, SSE stream, bounded history, timeout, daily atomic quota, status tracking.
- **Vercel:** Next.js server functions; environment variables are kept in Vercel, never GitHub.

## Readiness status (2026-10-21)
- Code builds and deploys on the redesign branch.
- Neon isolated preview branch `mechat-preview` (`br-blue-cake-ar9amf8p`) contains the initial schema; its DB connectivity passed `/api/health`.
- Production/main Neon branch has **not** been migrated.
- Auth remains gated until Brevo credentials are set; DeepSeek remains gated until its key is configured.
- GitHub Actions workflow was repaired and must pass on a new run.
- Production does not launch until signup → OTP → sign-in → chat streaming and ownership/abuse testing passes.

## Important limits
Current daily quota enforcement is atomic per user per UTC day. Durable cost accounting is recorded by request, but provider token pricing and operational cost limits must be validated before public launch. This is a modular monolith, not a distributed microservice architecture.
