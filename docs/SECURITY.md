# MeChat security and privacy checklist

- [ ] Configure `BETTER_AUTH_SECRET` securely, `BETTER_AUTH_URL` exactly, and trusted origins for production.
- [ ] Verify database migrations on test branch; apply to production only after explicit approval.
- [ ] Verify Better Auth sessions, secure cookies and six-digit OTP expiry/retries/duplicate email.
- [ ] Use server session to scope every conversation list, select, update, delete and AI request.
- [ ] Test IDOR access using two separate real accounts; test null/invalid UUIDs.
- [ ] Validate CSRF/origin checks for all mutations, including browser credentials and auth routes.
- [ ] Rate limit AI requests with atomic/concurrency-safe quotas in persistent storage.
- [ ] Bound context size, output tokens, timeouts, request body size, provider costs and queue pressure.
- [ ] Store incomplete stream status on disconnection; make retries idempotent.
- [ ] Sanitize/escape AI Markdown (react-markdown with no raw HTML); block dangerous protocols.
- [ ] Confirm no message bodies, passwords, OTP, API keys or connection strings in logs.
- [ ] Review data retention, exports and account deletion requirements.
- [ ] Verify Vercel deployments, configuration, browser behavior and incident rollback procedures.
