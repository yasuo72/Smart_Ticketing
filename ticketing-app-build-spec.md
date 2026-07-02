# Build Spec: AI-Powered Customer Support Ticketing App
### A step-by-step prompt for a coding agent (Claude Code, Cursor, Windsurf, etc.) — 100% free stack for students

---

## HOW TO USE THIS FILE

Give this whole file to your coding agent as context (or paste it into your `CLAUDE.md` / project instructions file). Then work through the **Phases** in order — paste one phase at a time as a prompt, let the agent finish it, review/test what it built, commit to git, then move to the next phase. Don't paste all phases at once; large projects break down better when built incrementally with review checkpoints.

At the start of every phase, tell the agent:
> "We are on Phase X. Read the full spec below for context, but only implement Phase X right now. Ask me clarifying questions before writing code if anything is ambiguous."

---

## 1. Project Overview

Build a full-stack **AI-powered customer support ticketing system** (like a mini Zendesk). Customers submit support tickets (via web form or email), support agents manage and resolve them, and AI assists by summarizing tickets, polishing agent replies, classifying incoming issues, and auto-resolving common requests.

**Goal:** Learn professional, production-style full-stack development while pair-programming with an AI coding agent — planning before prompting, reviewing every AI-generated change, and testing as you go. This is explicitly **not** a copy-paste-and-hope exercise.

---

## 2. Tech Stack — 100% Free for Students

Every tool below has a permanent free tier suitable for a learning project (no credit card traps). Paid alternatives are noted in parentheses for reference only — don't use them.

| Layer | Technology | Free tier notes |
|---|---|---|
| Backend | **Node.js + Express** | Free, open source |
| Language | **TypeScript** | Free, open source |
| Database | **PostgreSQL** | Run free locally via **Docker Desktop**, OR use a free hosted instance on **Neon** (neon.tech — generous free tier, serverless Postgres) |
| ORM | **Prisma** | Free, open source |
| Frontend | **React + Vite** | Free, open source |
| Styling | **Tailwind CSS** | Free, open source |
| UI components | **shadcn/ui** | Free, open source (you own the code, no package to pay for) |
| AI features (in-app) | **Ollama (local models)** for learning/dev, OR free tier of **Google Gemini API** / **Groq API** | Ollama = $0 forever, runs on your own machine. Gemini/Groq free tiers are generous and need no card for basic use *(paid alternative: OpenAI/Anthropic API — costs money per token)* |
| AI dev tool (writing the code) | Any coding agent your student plan/free tier allows — **Claude free tier, Cursor free tier, GitHub Copilot free tier, or local agent via Ollama** | Use whichever free plan you have access to |
| Testing | **Vitest** (unit) + **Playwright** (e2e) | Both free, open source |
| Email sending/receiving | **Resend** (free tier: 100 emails/day) or **Mailtrap Sandbox** (free, fake inbox for dev — no real emails needed while learning) | *(paid alternative: SendGrid at scale)* |
| Local email/webhook tunnel | **ngrok** free tier (or **localtunnel**, fully free/open source) | |
| Error monitoring | **Sentry** free developer tier | Optional — skip if you want to keep it simpler |
| Containerization | **Docker** | Free |
| CI/CD | **GitHub Actions** | Free for public repos (2,000 min/month free even for private repos) |
| Hosting — frontend | **Vercel** free tier | |
| Hosting — backend | **Render.com** free web service tier (or **Fly.io** free allowance) | *(paid alternative: Railway — no longer has a free tier)* |
| Hosting — database | **Neon** free tier Postgres | |
| Version control | **GitHub** free | |

> 💡 **Budget-zero rule of thumb:** If a step ever asks for a credit card and there's no way around it, stop and ask — there's almost always a free alternative for a learning project of this size.

---

## 3. Prerequisites (Install Before Starting)

- [ ] Node.js LTS (v20+)
- [ ] Git + a free GitHub account
- [ ] Docker Desktop (free) — for local Postgres, and later for the app itself
- [ ] A code editor (VS Code, free)
- [ ] A free Neon.tech account (or just use Docker Postgres locally — no account needed)
- [ ] A free Resend or Mailtrap account
- [ ] Ollama installed locally (ollama.com, free) if going the local-AI route — pull a small model like `llama3.2` or `phi3`
- [ ] A coding agent with a free tier connected to your editor/terminal

---

## 4. High-Level Architecture

```
[React + Vite Frontend] <--HTTP--> [Express API Backend] <--Prisma--> [PostgreSQL]
                                          |
                                          |--> [AI Service Layer] --> Ollama (local) or Gemini/Groq (free API)
                                          |
                                          |--> [Email Service] --> Resend/Mailtrap
                                          |
                                          |--> [Background Jobs] --> BullMQ + free local Redis (via Docker) for auto-resolving tickets
```

---

## 5. Suggested Folder Structure

```
ticketing-app/
├── apps/
│   ├── api/                  # Express backend
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   │   ├── ai/       # AI feature logic (summarize, classify, polish, auto-resolve)
│   │   │   │   └── email/
│   │   │   ├── middleware/
│   │   │   ├── jobs/         # background job workers
│   │   │   ├── prisma/
│   │   │   │   └── schema.prisma
│   │   │   └── index.ts
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   └── package.json
│   └── web/                  # React frontend
│       ├── src/
│       │   ├── components/
│       │   ├── pages/
│       │   ├── hooks/
│       │   ├── lib/
│       │   └── main.tsx
│       ├── tests/
│       └── package.json
├── docker-compose.yml         # postgres + redis for local dev
├── .github/workflows/         # CI
├── CLAUDE.md                  # project memory/instructions for the coding agent
└── README.md
```

---

## 6. Data Model (Prisma Schema Outline)

Give this to the agent as a starting point, not gospel — let it refine it with you.

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  passwordHash  String
  name          String
  role          Role     @default(CUSTOMER)
  createdAt     DateTime @default(now())
  tickets       Ticket[] @relation("CustomerTickets")
  assignedTickets Ticket[] @relation("AgentTickets")
  replies       Reply[]
}

enum Role {
  CUSTOMER
  AGENT
  ADMIN
}

model Ticket {
  id           String       @id @default(cuid())
  subject      String
  description  String
  status       TicketStatus @default(OPEN)
  priority     Priority     @default(MEDIUM)
  category     String?      // set by AI classification
  aiSummary    String?      // set by AI summarization
  customerId   String
  customer     User         @relation("CustomerTickets", fields: [customerId], references: [id])
  agentId      String?
  agent        User?        @relation("AgentTickets", fields: [agentId], references: [id])
  replies      Reply[]
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
}

enum TicketStatus {
  OPEN
  IN_PROGRESS
  AUTO_RESOLVED
  RESOLVED
  CLOSED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

model Reply {
  id        String   @id @default(cuid())
  ticketId  String
  ticket    Ticket   @relation(fields: [ticketId], references: [id])
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  body      String
  isAiDraft Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

---

## 7. PHASES — Build Step by Step

### Phase 0 — Planning (do this with the agent, not alone)
**Prompt to give the agent:**
> "Before writing any code, help me define: the exact MVP feature list for a customer support ticketing app, the tech stack from the table above, and a rough implementation plan broken into milestones. Ask me questions about scope if anything is unclear. Do not write code yet."

**Deliverable:** A written implementation plan you both agree on, saved as `PLAN.md`.

---

### Phase 1 — Project Scaffolding
**Tasks:**
- Initialize a monorepo (npm workspaces or simple two-folder setup is fine for learning — no need for Turborepo/Nx complexity yet).
- Set up `apps/api` with Express + TypeScript.
- Set up `apps/web` with React + Vite + TypeScript + Tailwind + shadcn/ui.
- Set up `docker-compose.yml` with a local Postgres service (and Redis, for later background jobs).
- Create a `CLAUDE.md` (or equivalent) describing the project, stack, and coding conventions, so the agent has persistent memory across sessions.
- Initialize git, push to a new free GitHub repo.

**Prompt to give the agent:**
> "Implement Phase 1: scaffold the monorepo exactly as described in the folder structure above. Use Docker Compose for local Postgres and Redis — no paid services. Set up basic linting (ESLint) and formatting (Prettier). Confirm the API and web app both run locally before moving on."

**Acceptance criteria:** `docker compose up`, `npm run dev` in both apps, works with a "Hello World" API route and a blank React page.

---

### Phase 2 — Database & Prisma Setup
**Tasks:**
- Add Prisma to the API app.
- Implement the schema from Section 6 above (refine together as needed).
- Run initial migration against local Docker Postgres.
- Seed the database with a handful of fake users and tickets for development.

**Prompt to give the agent:**
> "Implement Phase 2: set up Prisma with the schema I've provided, connect it to the local Postgres from Docker Compose, run the migration, and write a seed script with 3 users (one admin, one agent, one customer) and 5 sample tickets."

**Acceptance criteria:** `npx prisma studio` shows seeded data.

---

### Phase 3 — Authentication
**Tasks:**
- Implement sign-up / login / logout with **password hashing (bcrypt or argon2)** and **JWT or session-based auth** (session-based is simpler and free — no external auth service needed).
- Add role-based middleware (CUSTOMER / AGENT / ADMIN).
- Build simple login/signup pages on the frontend.

**Prompt to give the agent:**
> "Implement Phase 3: authentication with email+password, hashed with bcrypt, and session-based auth using a signed cookie (no external auth SaaS — keep this free and self-hosted). Add role-based access control middleware for CUSTOMER, AGENT, and ADMIN roles. Build minimal login/signup pages in React. Write tests for the auth flow before we move on."

**Acceptance criteria:** Can sign up, log in, log out, and hitting a protected route without auth returns 401.

---

### Phase 4 — User Management (CRUD)
**Tasks:**
- Admin-only endpoints: list/view/edit/delete users, change roles.
- Basic admin UI page for user management.

**Prompt to give the agent:**
> "Implement Phase 4: full CRUD for users, restricted to ADMIN role. Include a simple admin dashboard page listing users with edit/delete actions."

---

### Phase 5 — Ticket Management (CRUD) — Core Feature
**Tasks:**
- Customers can create/view their own tickets.
- Agents/admins can view all tickets, assign themselves, update status/priority, reply.
- Build the main ticket list + ticket detail UI (this is the heart of the app).

**Prompt to give the agent:**
> "Implement Phase 5: full CRUD for tickets with role-appropriate permissions (customers only see their own tickets; agents/admins see all). Build a ticket list page with filters (status, priority) and a ticket detail page with a reply thread. After implementing, walk me through the code you wrote before we move to AI features."

**Acceptance criteria:** A customer can create a ticket, an agent can see it, reply, and change its status.

---

### Phase 6 — AI Features (using free AI)
This is where it gets interesting. Implement each feature as a separate service function so they're easy to test and swap providers later.

**6a. AI provider setup**
> "Set up an AI service layer that calls [Ollama running locally / Gemini free tier API — pick one]. Abstract it behind a simple interface (e.g., `generateText(prompt): Promise<string>`) so we can swap providers later without touching feature code."

**6b. Ticket summarization**
> "Implement AI ticket summarization: when a ticket is created or updated, generate a 1-2 sentence summary and store it in `aiSummary`. Show it on the ticket list for agents."

**6c. Issue classification**
> "Implement AI classification: automatically tag incoming tickets with a category (e.g., billing, technical, account, other) using the AI service. Store it in the `category` field."

**6d. Reply polishing**
> "Implement an agent-facing 'Polish my reply' button: agent drafts a rough reply, clicks the button, and the AI rewrites it to be clearer and more professional before sending."

**6e. Auto-resolving common requests**
> "Implement auto-resolution for common, low-complexity requests (e.g., password reset instructions, business hours questions). Use a background job (BullMQ + local Redis) that: classifies whether a ticket is auto-resolvable, and if so, generates and sends a reply, then marks the ticket `AUTO_RESOLVED`. Otherwise leave it in the normal queue for a human agent."

**Acceptance criteria:** Creating a ticket triggers classification + summarization automatically; a simple ticket (e.g., "how do I reset my password") gets auto-resolved; a complex one doesn't.

---

### Phase 7 — Real-Time Dashboard
**Tasks:**
- Build an agent-facing dashboard: open tickets count, tickets by status/category, average resolution time, recent activity.
- "Real-time" can be done for free via polling every few seconds, or WebSockets (Socket.IO, free/open source) if you want to go further.

**Prompt to give the agent:**
> "Implement Phase 7: a dashboard page showing ticket counts by status and category, and a live-updating recent activity feed. Use polling with a short interval, or Socket.IO if you'd rather do it properly — your call, but explain the tradeoff to me first."

---

### Phase 8 — Email Integration (Free Tier)
**Tasks:**
- Set up Resend (or Mailtrap sandbox for pure local dev — no real email needed) for **sending** replies.
- Set up an inbound email webhook (Resend and Mailtrap both support inbound parsing) so customers can email support@yourdomain and have it become a new ticket.
- Use ngrok/localtunnel to expose your local dev server to receive the webhook while developing.

**Prompt to give the agent:**
> "Implement Phase 8: outbound email via Resend's free tier when an agent replies to a ticket. Set up inbound email parsing so a new email creates a new ticket, using [Resend inbound / Mailtrap sandbox]. Walk me through setting up ngrok so I can test the webhook locally."

---

### Phase 9 — Testing
**Tasks:**
- Unit tests (Vitest) for services (auth, AI service layer with mocked responses, ticket logic).
- E2E tests (Playwright) for the core user journeys: sign up → create ticket → agent replies → ticket resolved.

**Prompt to give the agent:**
> "Implement Phase 9: unit tests for the core services, and at least 3 Playwright end-to-end tests covering the main user journeys. Mock the AI provider in tests so we don't burn free-tier API quota running the suite repeatedly."

---

### Phase 10 — Production Prep & Free Deployment
**Tasks:**
- Add Dockerfiles for the API (frontend can be static-built and hosted separately).
- Set up a free Postgres database on Neon for production (separate from your local Docker one).
- Deploy backend to **Render.com free web service**.
- Deploy frontend to **Vercel free tier**.
- Set environment variables (DB URL, session secret, AI API keys, email API keys) in each platform's dashboard — never commit secrets to git.
- (Optional) Set up Sentry free tier for error logging.
- Set up a basic GitHub Actions workflow: run tests on every push/PR (free for this repo size).

**Prompt to give the agent:**
> "Implement Phase 10: prepare the app for production. Write a Dockerfile for the API, add a `.env.example` file listing all required environment variables, and write step-by-step instructions for me to deploy the backend to Render's free tier, the frontend to Vercel's free tier, and switch the database to a free Neon Postgres instance. Also set up a GitHub Actions workflow that runs our test suite on every pull request."

**Acceptance criteria:** The app is live on free URLs (e.g., `your-app.vercel.app` + `your-api.onrender.com`), fully working end to end, for $0/month.

---

## 8. Environment Variables Checklist

```
# Database
DATABASE_URL=

# Auth
SESSION_SECRET=

# AI provider (pick one)
OLLAMA_HOST=http://localhost:11434
# or
GEMINI_API_KEY=
# or
GROQ_API_KEY=

# Email
RESEND_API_KEY=
# or Mailtrap sandbox creds

# Redis (for background jobs)
REDIS_URL=

# Error monitoring (optional)
SENTRY_DSN=
```

---

## 9. Free-Tier Watch-Outs (read this before you start)

- **Neon free tier**: database can go idle/sleep after inactivity — fine for a learning project, just expect a short cold-start delay.
- **Render free tier**: the backend service spins down after inactivity and takes ~30-60s to wake up on the next request — totally fine for a portfolio/learning project, just don't be surprised by it.
- **Gemini/Groq free tiers**: have rate limits (requests per minute). Mock AI calls in your test suite so you don't burn through the quota running tests repeatedly.
- **Ollama**: completely free and unlimited since it runs on your own machine, but needs a reasonably modern laptop (8GB+ RAM) to run small models comfortably.
- **Resend free tier**: 100 emails/day and 1 verified domain — plenty for development; use Mailtrap sandbox if you don't want to deal with domain verification at all while learning.

---

## 10. What to Ask Your Agent at Each Checkpoint

After every phase, before moving on, ask:
1. "Explain what you just built and why, in plain terms."
2. "What would break in production that we're not handling yet?"
3. "Show me the tests that prove this works."

This keeps you in the driver's seat and actually learning — not just accepting code you don't understand, which is the whole point of doing this project in the first place.
