# Planned schema

- Better Auth managed user/session/account/verification tables.
- conversations(id, user_id, title, created_at, updated_at).
- messages(id, conversation_id, role, content, status, provider, model_id, created_at).
- user_settings(user_id, theme, response_style).
- usage_events(id, user_id, model_id, input_tokens, output_tokens, created_at).

Use indexed owner lookups and per-request ownership checks. No DB connected yet.
