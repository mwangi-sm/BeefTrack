### *This is the backend for the beef tracking software written in Golang*

## Authentication configuration

The React client authenticates with Supabase Auth and sends the session access
token as `Authorization: Bearer <access-token>`. The backend verifies it using
the project's JWKS endpoint and never signs JWTs.

Copy `.env.example` to `.env` and set `SUPABASE_URL` plus the current
`SUPABASE_KEY`. Do not configure `JWT_SECRET`, `SUPABASE_ANON_KEY`,
or `SUPABASE_SERVICE_ROLE_KEY` in this backend.

If legacy JWT-form API keys were previously used, create publishable/secret API
keys in the Supabase Dashboard, update deployed environments, then revoke the
legacy keys and rotate any exposed service-role credential.
