# AI Ticketing App Plan

## MVP Scope

Build a single-team customer support ticketing system with three roles: Customer, Agent, and Admin. The core loop is customer ticket creation, agent triage and replies, status management, and dashboard visibility. AI will assist with summaries, classification, reply polishing, and later auto-resolution for simple requests.

## Milestones

1. Project scaffolding: npm workspaces, Express API, React/Vite web app, Tailwind, local PostgreSQL, and Redis later.
2. Database: Prisma schema, migration, and seed data for admin, agent, customer, and sample tickets.
3. Auth: email/password signup and login, signed-cookie sessions, role middleware.
4. Admin users: list, edit, deactivate, and change roles.
5. Tickets: customer ticket creation, agent queue, detail view, assignments, replies, internal notes, status workflow.
6. AI: provider abstraction, summaries, classification, reply polishing, auto-resolution jobs.
7. Dashboard: status/category/priority counts, recent activity, basic resolution metrics.
8. Email: outbound replies and inbound ticket creation.
9. Tests: Vitest service tests and Playwright core journey tests.
10. Deployment: Railway for the backend/app services, Vercel for frontend if we keep split hosting, and managed Postgres/Redis.

## Current Decision Notes

- Use npm workspaces instead of Turborepo/Nx to keep the first version simple.
- Use the user's local PostgreSQL install for development.
- Keep Docker Compose as an optional fallback for Postgres and Redis, and use Redis when background jobs are introduced.
- Use Gemini's free API for AI features, behind a provider interface so other providers can be swapped in later.
- Railway replaces Render as the backend deployment target.
