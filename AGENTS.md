# MeChat — Engineering contract

Production-oriented, authentication-first AI chat. No homepage. UI direction: quiet typography, warm neutral surfaces, graphite text, restrained deep green accent, original monogram. No emojis or generic AI illustrations. Never invent functioning features, costs, model responses or login success.

## Framework and structure
- Next.js App Router, React, strict TypeScript, server-only secrets.
- Drizzle ORM + Neon PostgreSQL and Better Auth + Brevo OTP.
- Keep provider credentials isolated in server Route Handlers. DeepSeek is primary.
- No mock conversation state in deployed UI: backend persistence only.

## Required security
- Resolve identity via verified server sessions; do not trust userId from requests.
- Every chat mutation and read must filter by authenticated owner.
- Check CSRF/trusted origin for mutations; protect auth endpoints with Better Auth.
- Rate limits and daily quotas, bounded message length and history, provider timeouts and model output limits.
- No XSS from model output; do not use untrusted HTML. No logs containing personal chat content, OTP or credentials.
- On interrupted streams, keep durable explicit status instead of pretending the reply completed.
- Do not change production DB without reviewed migrations and explicit authorization.

## Delivery
- Commit changes on feature branches, lint + typecheck + build, confirm route ownership behavior.
- Don't merge design changes until reviewed on narrow mobile and desktop viewports.
- Keep credentials in environment management and supply a clear release checklist.
