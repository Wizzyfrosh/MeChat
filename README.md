# MeChat

Premium responsive AI conversational web app, initially a local-only visual prototype inspired by the supplied lavender/pastel reference.

## Run

```bash
npm install
npm run dev
```

Requires Node 22+. Check with `npm run lint`, `npm run typecheck`, and `npm run build`.

## Phase 1
- `/`: responsive pastel dashboard and topic prompts.
- `/chat`: chat preview, local conversation history, copy, delete and search.
- `/voice`: animated microphone/speech-to-text UI on supported browsers.
- `/sign-in`: honest auth-coming-soon screen.

**Not live:** model APIs, auth, cloud persistence and image generation. Demo messages are labeled. Browser localStorage is not secure storage: do not enter private information in the preview.

## Production direction
Next.js, Better Auth, Neon PostgreSQL, DeepSeek primary with Groq optional; server-only secrets, per-user authorization and quotas. See `docs/`.
