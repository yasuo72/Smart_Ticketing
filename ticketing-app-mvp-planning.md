# Project Scope & MVP Planning
### AI-Powered Customer Support Ticketing App

This document mirrors the "Project Planning" phase of the course (Defining Scope → Clarifying Requirements → Defining the MVP) but goes deeper, and adds extra features beyond what the course covers so you can decide what to build now vs. later. Give this to your coding agent alongside the build spec so it understands *why* each feature exists, not just *what* to build.

---

## 1. Problem Statement

Small teams and solo founders need a simple way to receive, triage, and resolve customer support requests without paying for Zendesk/Intercom/Freshdesk. Most of that triage work (reading a ticket, figuring out what it's about, drafting a reasonable first reply) is repetitive and can be assisted or partially automated by AI — while a human stays in control of anything ambiguous or high-stakes.

## 2. Target Users / Roles

| Role | Who they are | What they need |
|---|---|---|
| **Customer** | End user with a problem | Submit a request easily (web or email), get timely help, track status |
| **Agent** | Support staff | See a manageable queue, get AI help drafting/understanding tickets, resolve fast |
| **Admin** | Team lead / owner | Manage users, see overall performance, configure the system |

## 3. Goals & Non-Goals

**Goals**
- A working ticketing loop: submit → triage → respond → resolve.
- AI assistance that measurably reduces agent effort (summarizing, drafting, classifying, auto-resolving simple cases).
- Clean enough architecture to be a genuine portfolio piece, not a toy.

**Non-Goals (explicitly out of scope, even long-term)**
- Multi-tenant SaaS billing (this is a single-team internal tool, not a product you sell to other companies).
- Live chat / real-time messaging widget (ticket-based only, not chat-based).
- Native mobile apps (web-responsive is enough).

---

## 4. MVP Feature List (build these first — matches and slightly extends the course scope)

Each feature below has: **what it does**, **why it's in the MVP**, and **acceptance criteria**.

### 4.1 Authentication & Roles
- **What:** Email/password sign-up and login, three roles (Customer, Agent, Admin), session-based auth.
- **Why:** Nothing else works without knowing who's asking.
- **Acceptance criteria:**
  - A new user can sign up as a Customer.
  - Admins can promote a user to Agent or Admin.
  - Protected routes reject unauthenticated requests (401) and wrong-role requests (403).

### 4.2 User Management (Admin)
- **What:** Admin can list, view, edit, deactivate, and change the role of any user.
- **Why:** Someone has to manage the team without touching the database directly.
- **Acceptance criteria:** Admin dashboard lists all users with search/filter by role; deactivated users can't log in.

### 4.3 Ticket Creation
- **What:** Customer creates a ticket via a web form (subject, description, optional attachment) OR via email (Phase 8 in the build spec).
- **Why:** This is the entry point of the whole app.
- **Acceptance criteria:** Ticket appears immediately in the agent queue with status `OPEN`.

### 4.4 Ticket Queue & Detail View (Agent/Admin)
- **What:** Agents see a filterable/sortable list (by status, priority, category, assigned/unassigned) and a detail view with the full reply thread.
- **Why:** This is where agents spend all day — it needs to be fast and clear.
- **Acceptance criteria:** Filtering/sorting works; opening a ticket shows full history in chronological order.

### 4.5 Ticket Assignment & Status Workflow
- **What:** Agent can self-assign or be assigned a ticket; status moves through `OPEN → IN_PROGRESS → RESOLVED → CLOSED` (plus `AUTO_RESOLVED` for AI-handled ones).
- **Why:** Prevents two agents working the same ticket, and gives a clear lifecycle.
- **Acceptance criteria:** Status changes are logged with a timestamp; closed tickets are read-only for customers.

### 4.6 Replies / Conversation Thread
- **What:** Agents and customers can both add replies to a ticket; internal-only notes (visible to agents only, not customers) are supported.
- **Why:** Real support tools always separate "customer-visible" from "internal" notes.
- **Acceptance criteria:** Customer never sees internal notes; reply thread is ordered and timestamped.

### 4.7 AI: Ticket Summarization
- **What:** On creation/update, AI generates a 1–2 sentence summary shown in the queue list, so agents can triage without opening every ticket.
- **Acceptance criteria:** Summary is generated within a few seconds of ticket creation and is regenerated if the description is edited.

### 4.8 AI: Issue Classification
- **What:** AI tags each ticket with a category (e.g., Billing, Technical, Account, Other) and a suggested priority.
- **Acceptance criteria:** Category and priority are visible and filterable in the queue; agent can manually override either.

### 4.9 AI: Reply Polishing
- **What:** Agent drafts a rough reply and clicks "Polish" to get a clearer, more professional AI-rewritten version before sending — agent must approve/edit, never auto-sent without review.
- **Acceptance criteria:** Original draft is never overwritten silently; agent sees both versions and chooses.

### 4.10 AI: Auto-Resolution for Common Requests
- **What:** Background job classifies whether a ticket is a common, low-complexity request (e.g., "how do I reset my password") and if so, drafts and sends a reply automatically, marking the ticket `AUTO_RESOLVED`. Anything uncertain stays in the human queue.
- **Acceptance criteria:** Auto-resolved tickets are clearly labeled as AI-handled to both the customer and in the dashboard, and can be reopened by the customer if the answer didn't help.

### 4.11 Dashboard
- **What:** Ticket counts by status/category/priority, average resolution time, tickets auto-resolved vs. human-resolved, recent activity feed.
- **Acceptance criteria:** Numbers match what's actually in the database (basic sanity-check test).

### 4.12 Email Integration
- **What:** Customers can email support@yourdomain to create a ticket; agent replies also go out as an email to the customer.
- **Acceptance criteria:** A round-trip test (send email → ticket created → reply → customer receives email) works end to end.

---

## 5. Extra Features Beyond the Course (Optional — pick what interests you)

These aren't in the original course but are realistic additions that would make this a stronger portfolio project. Grouped by effort so you can pick based on time available.

### 5.1 Low Effort, High Value
- **Canned Responses / Reply Templates** — agents save and reuse common reply snippets (huge real-world time-saver, easy to build).
- **Ticket Tags** — free-form tags in addition to AI category, for agent-defined organization.
- **Search** — full-text search across tickets (Postgres full-text search is free and built-in, no extra service needed).
- **Dark Mode** — good UI polish practice with Tailwind, low effort.
- **Audit Log** — record who changed what and when on a ticket (status changes, reassignments) — great for demonstrating backend design skill.

### 5.2 Medium Effort
- **Customer Satisfaction Survey (CSAT)** — after a ticket is resolved, customer gets a 1–5 rating prompt; show average CSAT on the dashboard.
- **SLA Tracking** — flag tickets that have been open too long based on priority (e.g., URGENT unanswered for 1 hour = SLA breach warning).
- **Notifications** — in-app + email notification when a ticket you're watching gets a new reply (uses the same email service already set up).
- **Self-Service Knowledge Base** — a simple public FAQ/article section; AI can also search these articles before falling back to auto-resolve logic (this is a genuinely valuable RAG-style extension).
- **Rate Limiting** — protect the ticket-creation endpoint from abuse (express-rate-limit is free, easy to add, and a good interview talking point).

### 5.3 Higher Effort, Great Learning Value
- **RAG-based AI answers** — instead of the AI answering from general knowledge, have it search your own knowledge base articles/past resolved tickets first (using pgvector, which is free and built into Postgres) — this is a genuinely resume-worthy feature and teaches real RAG architecture.
- **Multi-language support (i18n)** — detect customer's ticket language and let agents reply with AI translation assistance.
- **Agent Performance Analytics** — resolution time per agent, tickets handled, CSAT per agent — useful for the Admin role.
- **Webhooks / Public API** — let the ticketing system integrate with other tools (e.g., trigger a Slack-style notification — you could use a free Discord webhook instead of paid Slack for practice).

---

## 6. Explicit MVP Cut Line

If time is limited, here's the exact line between "must build" and "everything else":

**Must have (true MVP):** 4.1–4.6, 4.9, 4.11 (auth, user mgmt, ticket CRUD, replies, reply polishing, basic dashboard).

**Should have (makes it feel like a real AI product):** 4.7, 4.8, 4.10, 4.12 (summarization, classification, auto-resolution, email).

**Nice to have (do only if MVP is solid and tested):** anything in Section 5.

---

## 7. Suggested User Stories (give these directly to your agent per phase)

- *As a customer, I want to submit a support ticket so that I can get help with my issue.*
- *As a customer, I want to see the status of my ticket so that I know if it's being worked on.*
- *As an agent, I want to see a prioritized queue so that I work on the most urgent issues first.*
- *As an agent, I want an AI-generated summary of each ticket so that I don't have to read every full description to triage.*
- *As an agent, I want to polish my reply with AI before sending so that my responses sound professional even when I'm typing quickly.*
- *As an admin, I want to see overall ticket metrics so that I can gauge team performance.*
- *As a customer, I want simple, repetitive questions answered instantly so that I don't wait for a human for things like password resets.*

---

## 8. Definition of Done (for the whole MVP)

- [ ] All 4.1–4.12 features implemented and manually tested.
- [ ] Automated tests cover auth, ticket CRUD, and at least one AI feature (mocked).
- [ ] App deployed on the free stack described in the build spec, reachable via a public URL.
- [ ] README explains how to run it locally and what tech decisions were made and why (great for a portfolio).
- [ ] You can explain, in your own words, every architectural decision — not just that it works, but why it was built that way.
