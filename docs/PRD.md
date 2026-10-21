# MeChat — Production Product Requirements

## Positioning
MeChat is a clean, capable AI conversation platform for knowledge work, daily tasks and coding. Its visual identity is original: warm white, graphite, forest-green, bespoke M speech mark. ChatGPT-like ergonomic conventions are inspiration, not copied identity.

## Core journeys
1. Guest visits / → /sign-in. User may create account at /sign-up.
2. Email/password signup + six-digit OTP email verification, then login.
3. Authenticated user enters the conversation-first workspace; no homepage.
4. Create/continue/rename/delete chat, persist messages in Neon, stream answers from DeepSeek.
5. Search chat history, copy replies, display Markdown/code, use light/dark mode, sign out.

## Non-negotiable UI
- Typography and high-contrast readable message hierarchy, spacious but responsive.
- Desktop collapsible sidebar, narrow mobile drawer, centered composer, accessible labels and keyboard support.
- No emoji illustrations, flashy rainbow gradients, fake provider switches, unrelated cards or public chat demos.
- Disabled/unavailable features must be absent or explicitly identified.

## Readiness conditions
- Verify registration, email delivery/expiry, duplicate email, session and reset flows.
- Verify streaming answer, error recovery, quota and per-chat ownership.
- Verify keyboard/touch, dark theme, mobile Safari and Android Chrome, accessible focus.
- Verify all environment variables and DB schema migration applied.

**Status:** Source implementation is being validated; live production readiness depends on configuring secrets, migrating DB schema and running end-to-end QA.
