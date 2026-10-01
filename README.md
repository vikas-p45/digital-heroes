# Digital Heroes

Golf-score, monthly-draw and charity-giving platform (PRD Level 1).

| Layer | Choice |
|---|---|
| Frontend | React 18 + Vite + **Tailwind CSS** + React Router |
| Backend | Node.js + Express |
| Database | Supabase PostgreSQL (plain SQL, `pg`) |
| Auth | JWT (bcrypt password hashes, role-based: subscriber / admin) |
| Payments | Built-in **test checkout** by default; real **Stripe Checkout** by env switch |
| Deploy | Vercel (client) + Render (server) |

```
client/src  components/{common,dashboard,forms,layout,ui}  pages/{Home,Auth,Dashboard,Scores,Charity,Draw,Subscribe,Winners,Admin}
            layouts  routes  context  services  hooks  utils
server/     config  controllers  middleware  models  routes  services  utils  scripts  app.js  server.js
```

Request flow: `routes` → `middleware` (auth / validation) → `controllers` → `models` (all SQL) / `services` (draw engine, scores, subscriptions).

## 1. Database (Supabase)

1. Create a **new** Supabase project (the PRD asks for a fresh one).
2. Project Settings → Database → copy the connection string (use the *pooler* URI for Render).
3. Put it in `server/.env` as `DATABASE_URL`.

## 2. Run locally

```bash
# server
cd server
cp .env.example .env        # fill DATABASE_URL and JWT_SECRET
npm install
npm run migrate             # creates all tables (idempotent)
npm run seed                # charities, admin, demo player + 14 demo subscribers
npm run dev                 # http://localhost:4000

# client (second terminal)
cd client
cp .env.example .env        # VITE_API_URL=http://localhost:4000
npm install
npm run dev                 # http://localhost:5173
```

Test credentials after `npm run seed`:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@digitalheroes.test` | `Admin@12345` (override with `ADMIN_EMAIL` / `ADMIN_PASSWORD`) |
| Player | `demo@digitalheroes.test` | `Demo@12345` |

Try it: log in as admin → **Draws** → *Simulate* → *Publish*. Then log in as a winning player to upload proof, and back in admin → **Winners** to approve and mark paid.

Draw-engine tests: `cd server && npm test`.

## 3. Deploy

**Render (server)** - New Web Service, root directory `server`, build `npm install`, start `npm start`. Environment:
`DATABASE_URL`, `JWT_SECRET`, `CLIENT_URL` (your Vercel URL, comma-separate several), `NODE_ENV=production`, `PAYMENT_PROVIDER`. Run `npm run migrate` and `npm run seed` once from your machine (with the same `DATABASE_URL`) or from Render's shell.

**Vercel (client)** - Import the repo, root directory `client`, framework Vite. Environment: `VITE_API_URL` = your Render URL. `vercel.json` already handles SPA routing. Use a **new** Vercel account and Supabase project as the PRD requires.

**Stripe (optional)** - set `PAYMENT_PROVIDER=stripe`, `STRIPE_SECRET_KEY`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY`, and add a webhook to `https://<render-url>/webhooks/stripe` for `checkout.session.completed`, `invoice.paid`, `customer.subscription.deleted` (put its secret in `STRIPE_WEBHOOK_SECRET`). No card data ever touches this app.

## 4. How the ambiguous parts were decided

The PRD says ambiguity is part of the test, so these are explicit choices:

- **Rolling five scores**: the five most recent *by date* are kept. Adding a sixth deletes the oldest. A score dated older than all five stored ones is rejected with a clear message (it would be the one dropped). One score per date (DB unique constraint + friendly error). Enforced in a transaction with a per-user row lock.
- **Who enters a draw**: active subscribers with all five scores logged. A match counts distinct drawn numbers found among the player's five scores.
- **Prize pool**: each active subscriber contributes `monthly-equivalent fee × pool %` (default 50%). Tiers default to 40 / 35 / 25. **Both are stored in `draw_settings` and editable in Admin → Draws**, not hard-coded.
- **Payouts**: winners in a tier split it equally (rounded down to the paisa). Only the 5-match jackpot rolls over; unclaimed 4- and 3-match money stays with the platform.
- **Simulation = publish**: both call the same calculation. A simulation writes nothing; publishing with the simulated numbers gives exactly the previewed result. More than one draw per month is allowed.
- **Subscription status** is read from the database on **every** authenticated request, so a lapsed plan loses write access immediately.
- **Winner flow**: proof `none → submitted → approved/rejected`; payment `pending → paid`, and "paid" is only allowed after approval.
- **Charity**: minimum 10% (server-enforced), adjustable up to 100%. Independent donations work for visitors and members.
- **Winner proof images** are stored as data URLs in Postgres (max 1.5 MB) so the app works with zero extra setup. For higher volume, move them to Supabase Storage.
- **Mock checkout** does not auto-renew: when the period ends the plan lapses. Stripe handles renewals through `invoice.paid`.

## 5. Security notes

Helmet, CORS allow-list, login/signup rate limit, bcrypt, zod validation on every body, role checks on all `/api/admin` routes, parameterised SQL only, Row Level Security enabled on every table so Supabase's public REST API can't read them, secrets only via environment variables.
