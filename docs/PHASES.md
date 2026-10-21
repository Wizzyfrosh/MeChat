# MeChat roadmap

1. **Redesign (current):** Replace rejected lavender concept with authentication-first editorial UI and ChatGPT-style workspace. Remove public homepage and old voice prototype.
2. **Core backend (implemented in source, not yet commissioned):** Better Auth + six-digit Brevo OTP, Neon/Drizzle schema, session checks, owner-scoped conversations and DeepSeek SSE streaming.
3. **Release integration (blocked until configuration):** Review and apply database migrations; configure secret environment and domain; complete signup/verification/login/conversation E2E testing.
4. **Hardening:** Distributed rate limiting, concurrency-safe quotas, privacy/security review, cost observability, cross-browser QA, runbooks, monitoring.
5. **Expansion:** Only after stable launch, consider image understanding, speech and multiple AI providers.

No mock homepage, fake AI response, or demo-only UI should reach production.
