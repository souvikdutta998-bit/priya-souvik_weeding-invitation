# Priya & Souvik — Wedding Invitation

A mobile-first, vertically scrolling wedding invitation for Priya Gupta and Souvik Dutta. Includes an interactive scratch-to-reveal date card and a guest blessings form backed by a SQLite database, plus a password-protected private page at `/admin`.

## Run locally

1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env`.
3. Set a strong `ADMIN_PASSWORD` and a long random `SESSION_SECRET` in `.env`.
4. Run `npm install` and `npm start`.
5. Open `http://localhost:3000`. The private messages page is `http://localhost:3000/admin`.

The SQLite database is created automatically at `./data/blessings.sqlite`. Keep the `data` directory on a persistent disk when deploying; an ephemeral server filesystem will lose messages on restart/redeploy. Deploy behind HTTPS so the admin session cookie is marked Secure (`NODE_ENV=production`). Do not share the admin password with guests.

## Before publishing

- Confirm the venue spelling and addresses, especially the Karnagarh Mahamaya Temple venue line.
- The invitation currently uses the provided event details: Mehendi 8 Dec 2026, Haldi and Shadi 9 Dec 2026, Reception 11 Dec 2026.
- Replace the sample admin password and session secret. The `.env` file must never be committed or shared.

## Included

- `public/index.html`, `style.css`, `script.js`: guest invitation.
- `public/admin.html`: private blessings reader.
- `server.js`: database API and signed, HTTP-only admin session.
- `public/art/`: four illustrated couple function looks.
