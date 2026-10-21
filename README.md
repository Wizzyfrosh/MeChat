# MeChat

MeChat is an authentication-first, conversation-centered AI web application built with Next.js, Better Auth, Neon PostgreSQL, Brevo email OTP, and server-side DeepSeek streaming.

## Routes

- `/` redirects to `/sign-in` or `/chat` depending on the server session.
- `/sign-in`, `/sign-up`, `/verify-email`, `/reset-password` provide registration, sign-in, email OTP verification, and password recovery.
- `/chat` is the protected workspace. `/chat/[id]` loads an existing conversation.
- `/api/auth/[...all]` handles Better Auth requests.
- `/api/conversations`, `/api/conversations/[id]`, `/api/chat` serve session-protected chat operations.

## Design

The public landing dashboard has been removed. The redesigned UI follows a neutral, editorial style with a custom SVG monogram, warm-gray surfaces, subtle dark-teal accents, excellent message readability and mobile drawer navigation. Appearance can be switched between light and dark.

## Setup

Copy `.env.example` to `.env.local` and configure:

```
DATABASE_URL=
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=
BREVO_API_KEY=
BREVO_SENDER_EMAIL=
DEEPSEEK_API_KEY=
DEEPSEEK_MODEL=deepseek-flash
```

Use a real, verified Brevo sender. Keep all keys on the server, never use `NEXT_PUBLIC_` for these secrets. The app must have database migrations applied before authentication and conversations work.

```sh
npm install
npm run db:generate
# Review generated SQL, test on a Neon preview/dev branch, then get migration approval.
npm run db:migrate
npm run lint
npm run build
```

**Do not apply migrations to the Neon production branch without review and explicit approval.**

## Current status

The full server routes and frontend flow are implemented in source. They require valid secrets, migrations, and end-to-end testing to become a functioning production service. The absence of credentials is surfaced as an unavailable authentication service, not faked sign-in. There is no demo chatbot mode.

## Security considerations

Server checks sessions, verifies email, and scopes conversation reads/mutations to the authenticated owner. The AI key is only used server-side. Message input and model output are bounded; per-user daily message quotas and idempotency request IDs are recorded. Prior to public rollout, add a stronger atomic/concurrent request quota, provider cost reconciliation, alerting, observability, and resilience testing.
