# Security gates for production

- Secrets on server only; no NEXT_PUBLIC_ API keys.
- Session verification and explicit conversation ownership.
- Rate limits, spending caps, bounded history, timeouts, idempotency.
- Safe Markdown rendering; do not set innerHTML from model output.
- Minimal logs, database backups and interruption/error states.
- Never claim login or live AI works before verified end-to-end.
