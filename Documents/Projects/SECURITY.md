# Aegis Security Notes

Aegis is an academic emergency-management prototype, not a production emergency service.

## Production deployment checklist

- Set `NODE_ENV=production`.
- Set a unique `JWT_SECRET` of at least 32 characters. Production startup fails without it.
- Set `CLIENT_URL` to the exact trusted application origin.
- Keep `TRUST_PROXY=false` unless the app is actually behind a trusted reverse proxy.
- Keep `SEED_DEMO_USER=false`; production never auto-seeds the predictable demo user.
- Serve the application through HTTPS.
- Do not commit `.env` or mutable files containing user/SOS/task state.
- Keep the `package-lock.json` produced by `npm install` in the deployment repository.
- Back up mutable JSON data and use a database if concurrent production-scale writes are expected.

## Built-in protections

Aegis uses bcrypt password hashing, HttpOnly/SameSite cookies, role authorization, input validation, mutation origin/content-type checks, rate limiting, CSP/security headers, no-store protected responses, UUID identifiers, allow-listed operational patches, safe DOM rendering and atomic/locked JSON writes.

## Reporting

For this academic project, report a security problem to the project maintainer before sharing a working exploit publicly. Do not use the simulated SOS/incident features to represent contact with real emergency services.
