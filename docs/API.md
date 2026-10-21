# MeChat API — current implementation

All chat and conversation APIs require a valid Better Auth session. All conversation queries derive the user ID from server session state; never accept client-supplied ownership identifiers.

| Endpoint | Methods | Function |
|---|---|---|
| `/` | GET | Server redirect to sign-in or chat |
| `/api/auth/[...all]` | GET / POST | Better Auth endpoints, six-digit OTP plugin |
| `/api/conversations` | GET | List up to 80 most recent owned conversations |
| `/api/conversations` | POST | Create conversation; 201 |
| `/api/conversations/[id]` | GET | Owned conversation and recent messages |
| `/api/conversations/[id]` | PATCH | Rename owned conversation; 160-character cap |
| `/api/conversations/[id]` | DELETE | Delete owned conversation; 204 |
| `/api/chat` | POST | Validate owned chat, reserve daily quota, stream DeepSeek answer |
| `/api/health` | GET | Operational readiness; returns 503 until DB, auth and AI are configured |

## Streaming

`POST /api/chat` accepts JSON:
```json
{"conversationId":null,"requestId":"<UUID>","content":"Hello"}
```
`conversationId` is optional for a new chat; `requestId` is required, client-generated UUID. Payload is capped at 8,000 characters.

Successful response: `Content-Type: text/event-stream`, with `meta` (conversationId), `delta` (text), `done`, and `error` events. Failed/incomplete model replies are recorded explicitly. Never disclose provider keys to clients.

Current rate limiting: Better Auth handles authentication rate limits; chat reserves one per-user daily slot through an atomic DB upsert before provider call, default 30/day. Further abuse protection, operational alerting and provider spend limits remain release requirements.

**Status:** Implemented in code, not yet production-authorized. Secret configuration, service integration tests and security review are outstanding.
