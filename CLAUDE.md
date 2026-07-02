# AI Ticketing App Project Memory

This project is an AI-powered customer support ticketing app built as a full-stack learning and portfolio project.

## Stack

- Monorepo: npm workspaces
- Backend: Node.js, Express, TypeScript
- Frontend: React, Vite, TypeScript, Tailwind CSS, shadcn-style components
- Database: local PostgreSQL with Prisma
- Jobs: Redis and BullMQ, introduced later for background jobs
- Testing: Vitest and Playwright
- AI: Gemini free API first, with a swappable provider abstraction. If the Gemini key is missing, preserve core ticket behavior and skip enrichment gracefully.
- Deployment: Railway for backend/services, Vercel optional for frontend

## Product Scope

Roles are Customer, Agent, and Admin. Customers create tickets and reply to their own tickets. Agents triage, assign, reply, and resolve tickets. Admins manage users and see system-level dashboard data.

## Coding Conventions

- Keep phases small and reviewable.
- Do not add external paid services.
- Keep AI provider calls behind service interfaces.
- Add tests with each risky feature.
- Do not commit secrets. Use `.env.example` for required variables.
- Prefer the user's local PostgreSQL server over Docker Postgres unless they ask to switch.
