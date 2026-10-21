# MeChat engineering standards
- Next.js App Router, TypeScript strict and a modular monolith.
- Phase 1 is a UI preview: never fabricate AI responses or claim that authentication works.
- Never place API keys in client components or NEXT_PUBLIC_ settings.
- Route Handlers must authenticate each request and check conversation ownership when backend work begins.
- Enforce quota checks and spending ceilings before model calls.
- Avoid logging message bodies, avoid unsafe HTML insertion, and mark interrupted model messages.
- Prefer accessible reusable components and browser testing on mobile and desktop.
- No fake payments, uploads, voice AI or mocked backend features presented as live.
