# AI Ticketing

An AI-powered customer support ticketing app built with Express, React, PostgreSQL, Prisma, Redis, and Gemini's free API for AI assistance.

## Phase 1 Local Development

Install dependencies:

```bash
npm install
```

Create a local PostgreSQL database named `ai_ticketing`, or choose your own name and update `apps/api/.env`.

Example database URL for a common local PostgreSQL install:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_ticketing?schema=public
```

Docker Compose is included as an optional fallback for Postgres and for Redis later:

```bash
docker compose up -d
```

Run the API:

```bash
npm run dev:api
```

Run the web app:

```bash
npm run dev:web
```

Default local URLs:

- API: `http://localhost:4000`
- Web: `http://localhost:5173`

AI features will use Gemini later. Add this to `apps/api/.env` once Phase 6 begins:

```bash
GEMINI_API_KEY=your-key-here
AI_PROVIDER=gemini
```

## Phase 2 Database Commands

The API uses Prisma with local PostgreSQL. From the repo root:

```bash
npm run db:generate --workspace apps/api
npm run db:migrate --workspace apps/api -- --name init
npm run db:seed --workspace apps/api
npm run db:studio --workspace apps/api
```

If migration cannot connect, confirm PostgreSQL is running and that `apps/api/.env` has the correct `DATABASE_URL`.

## Phase 3 Auth

Auth uses email/password with bcrypt hashes and signed HTTP-only cookie sessions.

Seeded development accounts use this password:

```txt
Password123!
```

Seeded account emails:

- `admin@aiticketing.local`
- `agent@aiticketing.local`
- `customer@aiticketing.local`

Core auth endpoints:

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

## Phase 4 Admin Users

Admins can manage users through:

- `GET /api/admin/users`
- `GET /api/admin/users/:id`
- `PATCH /api/admin/users/:id`
- `DELETE /api/admin/users/:id`

`DELETE` deactivates a user instead of hard-deleting the row so ticket history remains intact.

## Phase 5 Tickets

Tickets are available through:

- `GET /api/tickets`
- `POST /api/tickets`
- `GET /api/tickets/:id`
- `PATCH /api/tickets/:id`
- `POST /api/tickets/:id/replies`

Customers only see their own tickets. Agents and admins see the full queue, can assign tickets, update status/priority, and add internal notes.

## Phase 6 AI

AI features use a provider abstraction with Gemini as the configured provider.

Environment variables:

```bash
GEMINI_API_KEY=your-key-here
GEMINI_MODEL=gemini-2.5-flash
AI_PROVIDER=gemini
```

Implemented AI features:

- Ticket summaries on create/update
- Ticket category and suggested priority
- Inline auto-resolution for simple low-risk requests
- Agent/admin reply polishing through `POST /api/ai/polish-reply`

If the Gemini key is missing, ticket creation still succeeds and AI enrichment is skipped.

## Phase 7 Dashboard

Agents and admins can view live-updating dashboard metrics through:

- `GET /api/dashboard`

The web dashboard polls every 10 seconds and shows ticket counts by status, priority, category, average resolution time, and recent activity.

## Phase 8 Email

Outbound email uses Resend when configured:

```bash
RESEND_API_KEY=your-key
RESEND_FROM_EMAIL="AI Ticketing <support@yourdomain.com>"
SUPPORT_EMAIL=support@yourdomain.com
```

When an agent/admin sends a public ticket reply, the customer receives an email. Internal notes are never emailed. If Resend is not configured, sends are skipped safely in development.

Inbound email webhook:

```txt
POST /api/email/inbound/resend
```

For local Resend testing, expose the API with a tunnel and configure the Resend webhook URL to:

```txt
https://your-tunnel-url/api/email/inbound/resend
```

Select the `email.received` event. Resend webhook payloads contain metadata, so the API retrieves the full received email body when `RESEND_API_KEY` is configured. Dev/test payloads may include `from`, `subject`, and `text` directly.

## Phase 9 Testing

Run API unit/integration tests:

```bash
npm run test
```

Run browser end-to-end tests:

```bash
npm run test:e2e
```

Run both:

```bash
npm run test:all
```

Playwright uses ports `4100` and `5174` with mock AI and disabled email sends, so it does not consume Gemini or Resend quota.

## Current Status

Phase 1 scaffolding is complete. Database, auth, tickets, AI, email, and deployment will be added in later phases.
