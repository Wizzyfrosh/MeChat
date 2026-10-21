# MeChat — Multi-provider AI release verification (2026-10-21)

## Implemented
- Groq `openai/gpt-oss-20b` via GroqCloud OpenAI-compatible Chat Completions.
- Google Gemini `gemini-3.1-flash-lite` via Gemini OpenAI-compatible API.
- OpenRouter Free `openrouter/free` via the OpenRouter Chat Completions router.
- DeepSeek `deepseek-flash` retained as a **manual-only** selection (not part of Auto).
- User-selectable provider menu in the chat header, provider choice stored locally for that browser.
- Auto free-first mode only runs after explicit user selection, trying Groq, then Gemini, then OpenRouter **only when earlier providers reject before streaming**.
- Provider API secrets remain server-side in Vercel, never returned in API/HTML.
- Server sessions, per-conversation ownership checks, existing daily atomic quotas, and message persistence.
- Each saved assistant response records its actual provider/model.

## Key validation
`GROQ_API_KEY`, `GEMINI_API_KEY`, and `OPENROUTER_API_KEY` are configured in Vercel Preview and Production environments. The live model-lookup/key-status checks returned **valid** for all three. These endpoints make no paid text-generation requests.

## Real model test
A generic no-personal-information prompt was streamed from a Vercel Preview build:

| Provider | Result |
|---|---|
| Groq | **PASS**, completed SSE response |
| OpenRouter | **PASS**, completed SSE response |
| Gemini | **HTTP 503** from upstream; credential verified independently |

This is a one-time smoke test, not a guarantee of future free-tier availability. Gemini can be retried manually; Auto can fall through to OpenRouter on transient upstream 503 errors.

## Build and deployment
- Branch: `feat/free-ai-providers`.
- Commit: `d97b5f58f29a06f7b76f074c6f71d48ac63b3918`.
- Vercel deployment: `dpl_7R8F4JdRMxjsyRrMs8aKH9dRPD55`.
- Passed ESLint, TypeScript, 12 unit tests, and Next.js production build.
- Vercel alias `mechat.froshcodeorbit.site` assigned to this preview build; `/api/health?verifyProviders=1` confirms Preview database/auth configuration and all three key checks.
- Initial Neon data remains on the isolated preview branch. **Do not assume production DB migration happened.**

## Required release tests before merging PR #4
1. Sign in with the existing verified MeChat account.
2. Choose Groq; send a short question. Confirm streaming response and the provider label.
3. Reload the page and reopen the conversation: the answer must remain saved.
4. Choose OpenRouter, send a new prompt, and verify saved history.
5. Choose Gemini and record its status. If the upstream returns 503, surface a user-friendly error.
6. Test Auto mode with informed consent, including fallback under an upstream failure.
7. Check conversation isolation between two accounts and mobile Safari/Chrome UI.
8. Keep the feature PR in draft until these tests pass.

**Security note:** Never put actual provider keys, user chat contents, OTP codes, or database credentials in GitHub issues, build logs or screenshots.
