# KarobarOS — Implementation Specification
**AI Operating System for Indian SMBs — MVP Build Spec for Autonomous Coding Agent**

> ⚠️ SECURITY NOTE (read before building): The keys below were pasted in plain chat. Treat them as **already potentially exposed**. Before going to production: (1) rotate the Supabase service role key in Supabase Dashboard → Settings → API, (2) rotate the Groq key at console.groq.com, (3) never commit `.env` to git — add it to `.gitignore` on the first commit, (4) only the service-role/secret key goes server-side, never in client bundle.

---

## 1. Product Summary

**Name:** KarobarOS
**One-liner:** An AI-powered business assistant for Indian SMBs — owner talks to AI in plain English/Hindi/Hinglish, AI manages customers, sales, appointments, tasks, and gives insights.
**Not building (v1):** generic CRM, invoicing suite, inventory/accounting, WhatsApp bot (that's phase 2).
**Core UX principle:** Owner never learns a UI. Owner types/talks → AI understands intent → calls a tool → executes → confirms.

---

## 2. Tech Stack (fixed for this build)

| Layer | Choice |
|---|---|
| Frontend | Next.js 14+ (App Router), TypeScript, Tailwind, shadcn/ui |
| Backend | Next.js API routes (serverless) |
| Database/Auth | Supabase (Postgres + Auth + RLS) |
| AI Inference | Groq API (Llama 3.3 70B or Llama 3.1 8B for cheap/fast calls) with tool-calling |
| Hosting | Vercel |
| Language | Hindi/English/Hinglish via system prompt, no separate translation layer for v1 |

---

## 3. Environment Variables

Create `.env.local` (NEVER commit this file):

```bash
# App
NEXT_PUBLIC_APP_NAME=KarobarOS
NEXT_PUBLIC_APP_URL=http://localhost:3000

SUPABASE_SECRET_KEY=<your-supabase-secret-key>
GROQ_API_KEY=<your-groq-api-key>

# Later (Phase 2+ — leave blank for MVP)
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

`.gitignore` must include: `.env*`, `!.env.example`. Create a matching `.env.example` with empty values for the repo.

Client-side code may only use `NEXT_PUBLIC_*` vars. `SUPABASE_SERVICE_ROLE_KEY` and `GROQ_API_KEY` are used **only** in server-side API routes.

---

## 4. Database Schema (Supabase Postgres)

Run as a single migration `supabase/migrations/0001_init.sql`.

```sql
-- USERS handled by Supabase Auth (auth.users). We extend with a profile table.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz default now()
);

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text, -- salon, clinic, retail, etc.
  city text,
  phone text,
  working_hours jsonb default '{}',
  currency text default 'INR',
  timezone text default 'Asia/Kolkata',
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create table public.business_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text default 'owner' check (role in ('owner','staff')),
  created_at timestamptz default now(),
  unique(business_id, user_id)
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  tags text[] default '{}',
  total_spent numeric default 0,
  last_visit_at timestamptz,
  created_at timestamptz default now(),
  unique(business_id, phone)
);

create table public.customer_notes (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete cascade,
  note text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  name text not null,
  price numeric not null default 0,
  active boolean default true,
  created_at timestamptz default now()
);

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  customer_id uuid references public.customers(id),
  total_amount numeric not null default 0,
  status text default 'completed' check (status in ('completed','pending','refunded')),
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create table public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid references public.sales(id) on delete cascade,
  service_id uuid references public.services(id),
  name text not null,
  price numeric not null,
  quantity int default 1
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  sale_id uuid references public.sales(id),
  customer_id uuid references public.customers(id),
  amount numeric not null,
  status text default 'pending' check (status in ('pending','paid','failed')),
  method text, -- cash, upi, card
  paid_at timestamptz,
  created_at timestamptz default now()
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  customer_id uuid references public.customers(id),
  title text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  status text default 'scheduled' check (status in ('scheduled','completed','cancelled','no_show')),
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  title text not null,
  due_at timestamptz,
  status text default 'pending' check (status in ('pending','completed')),
  related_customer_id uuid references public.customers(id),
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  user_id uuid references auth.users(id),
  title text,
  created_at timestamptz default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade,
  role text check (role in ('user','assistant','tool')),
  content text,
  tool_calls jsonb,
  created_at timestamptz default now()
);

create table public.ai_actions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  conversation_id uuid references public.conversations(id),
  tool_name text not null,
  input jsonb,
  output jsonb,
  status text check (status in ('success','failed','needs_confirmation')),
  requires_confirmation boolean default false,
  confirmed_at timestamptz,
  created_at timestamptz default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  title text,
  body text,
  read boolean default false,
  created_at timestamptz default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  user_id uuid references auth.users(id),
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz default now()
);

-- Indexes
create index idx_customers_business on public.customers(business_id);
create index idx_sales_business on public.sales(business_id);
create index idx_appointments_business_time on public.appointments(business_id, starts_at);
create index idx_tasks_business_status on public.tasks(business_id, status);
create index idx_messages_conversation on public.messages(conversation_id);
```

### Row Level Security (multi-tenant isolation)

Enable RLS on every business-scoped table, gate by membership:

```sql
create or replace function public.is_business_member(biz_id uuid)
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.business_members
    where business_id = biz_id and user_id = auth.uid()
  );
$$;

-- Repeat this pattern for every table with business_id:
alter table public.customers enable row level security;
create policy "members access their business customers"
  on public.customers for all
  using (is_business_member(business_id))
  with check (is_business_member(business_id));
```

Apply the identical `enable row level security` + policy pair to: `businesses` (via a policy checking `business_members`), `business_members`, `customer_notes`, `services`, `sales`, `sale_items` (join via sale→business), `payments`, `appointments`, `tasks`, `conversations`, `messages` (join via conversation→business), `ai_actions`, `notifications`, `audit_logs`.

---

## 5. AI Agent Architecture

**Provider:** Groq (OpenAI-compatible tool-calling API, model `llama-3.3-70b-versatile`).
**Flow:** user message → system prompt (business context + memory) → Groq call with `tools` param → if `tool_calls` returned → validate params → execute against Supabase (server-side, service role, scoped to business_id) → if tool is destructive/external → return `needs_confirmation` and wait for explicit user confirm → else execute and return result → send tool result back to Groq for final natural-language reply.

### System prompt template (server-side, per request)
```
You are the AI assistant inside KarobarOS for {business_name} ({business_category}, {city}).
Working hours: {working_hours}. Currency: INR.
You can ONLY act within this business. Never reveal or reference other businesses.
Always use tools for any data lookup or change — never invent numbers, prices, or customer info.
If a tool result is missing data, say so honestly.
Respond in the language the user used (English, Hindi, or Hinglish).
Actions that send external messages or delete records require confirmation before execution.
```

### Tools (MVP set)

| Tool | Purpose | Confirmation? |
|---|---|---|
| `create_customer(name, phone, email?, tags?)` | Add customer | No |
| `search_customers(query)` | Find customers by name/phone | No |
| `get_customer(customer_id)` | Full profile + history | No |
| `update_customer(customer_id, fields)` | Edit customer | No |
| `create_sale(customer_id, items[], amount)` | Record a sale | No |
| `get_sales_summary(period)` | Totals for today/week/month | No |
| `get_pending_payments()` | List unpaid | No |
| `create_appointment(customer_id, title, starts_at)` | Book slot | No |
| `get_appointments(date_range)` | List appointments | No |
| `cancel_appointment(appointment_id)` | Cancel booking | **Yes** |
| `create_task(title, due_at?, customer_id?)` | Add reminder/task | No |
| `complete_task(task_id)` | Mark done | No |
| `get_business_summary()` | Dashboard-style overview | No |
| `draft_customer_message(customer_id, purpose)` | Draft a follow-up/reminder text | No (drafting only) |
| `send_customer_message(customer_id, message)` | Send external message (stubbed until WhatsApp phase) | **Yes, always** |

Every tool call is logged to `ai_actions` with input/output/status before returning to the model. `send_customer_message` and `cancel_appointment` (and any future delete) must return `needs_confirmation: true` on first call; only execute after a second, explicit user "yes/confirm".

### Memory
- **Business memory**: name, category, services, pricing, hours — pulled fresh from DB each request, not cached in the model.
- **Customer memory**: last 5 interactions/purchases pulled via `get_customer` tool when relevant, not preloaded into every prompt (keeps token cost low).
- **Conversation memory**: last ~10 messages from `messages` table for the active conversation.
- Do NOT store raw AI reasoning or chain-of-thought. Store only tool calls, inputs, outputs, and final replies.

---

## 6. API Routes (Next.js App Router)

- `POST /api/ai/chat` — body: `{ conversation_id?, message }` → runs agent loop, returns `{ reply, tool_calls[], needs_confirmation }`
- `POST /api/ai/confirm` — body: `{ ai_action_id }` → executes a pending confirmed action
- `POST /api/customers`, `GET /api/customers`, `GET/PATCH /api/customers/[id]`
- `POST /api/sales`, `GET /api/sales`
- `POST /api/appointments`, `GET /api/appointments`, `PATCH /api/appointments/[id]`
- `POST /api/tasks`, `PATCH /api/tasks/[id]`
- `GET /api/dashboard` — aggregated summary for home screen
- `POST /api/onboarding` — creates business + first business_member(owner)

All routes: verify Supabase session server-side, resolve `business_id` from `business_members` for `auth.uid()`, reject if no membership. Use the Supabase JS server client with the **service role key only inside these server routes**, never shipped to client.

---

## 7. Frontend Screens (MVP)

1. **Landing** — simple pitch, "Try free" CTA
2. **Login / Signup** — Supabase Auth (email + OTP or password)
3. **Onboarding** — business name, category (dropdown: salon/clinic/retail/services/other), city, working hours
4. **Dashboard** — today's sales, pending payments count, today's appointments, AI quick-input bar
5. **AI Assistant** — chat UI, suggested prompt chips, confirmation cards for risky actions
6. **Customers** — list + search, customer detail (history, notes, total spent)
7. **Sales** — list, add sale form (also reachable via AI)
8. **Appointments** — day/week list view, create/cancel
9. **Tasks** — pending/completed list
10. **Settings** — business profile, staff, working hours

Mobile-first, Tailwind + shadcn/ui, empty states everywhere ("No customers yet — try 'Add Rahul as customer' in AI chat").

---

## 8. Project Structure

```
app/
  (auth)/login, signup
  (app)/dashboard, customers, sales, appointments, tasks, settings, assistant
  api/
    ai/chat, ai/confirm
    customers, sales, appointments, tasks, dashboard, onboarding
components/        # shadcn-based UI
lib/
  supabase/client.ts, server.ts
  groq/client.ts
agents/
  system-prompt.ts
  tool-definitions.ts
  run-agent.ts       # the tool-call loop
tools/
  create-customer.ts, search-customers.ts, ... (one file per tool, calling supabase)
types/
supabase/
  migrations/0001_init.sql
```

---

## 9. Security Rules (non-negotiable)

- Every DB write from a tool goes through server-side code that injects `business_id` from the authenticated session — never trust a `business_id` passed by the model.
- RLS enabled on every table as above, as defense-in-depth even though server routes also scope manually.
- `send_customer_message` and any delete/cancel action always require explicit confirmation; log both the request and the confirmation in `audit_logs`.
- Rate-limit `/api/ai/chat` per user (basic in-memory or Upstash later).
- Never let the model see or use the Supabase service role key or Groq key directly — only your server code holds them.
- Sanitize all tool inputs (validate phone format, amounts as numbers, dates parseable) before hitting the DB.
- Rotate the two keys pasted above before this repo is pushed anywhere public.

---

## 10. MVP Acceptance Criteria

**Customer creation**
- [ ] User/AI can create a customer with name + phone
- [ ] Phone validated (Indian 10-digit, optional +91)
- [ ] Customer scoped only to creator's business (RLS-enforced)
- [ ] Duplicate phone within same business rejected with clear message
- [ ] `audit_logs` entry created
- [ ] AI tool `create_customer` works with no confirmation step
- [ ] Errors (missing name, bad phone) return actionable message, not silent failure

**Sales recording**
- [ ] Sale linked to existing customer, total computed from items
- [ ] Sales summary tool returns correct today/week/month totals
- [ ] AI never invents an amount — always pulled from `services` table or explicit user input

**Appointments**
- [ ] Booking checks for same-slot conflicts before creating
- [ ] Cancel requires confirmation before the tool executes
- [ ] `get_appointments` returns correct date-range results

**AI Assistant**
- [ ] Every tool call logged in `ai_actions` with status
- [ ] Confirmation-required actions never execute on first request
- [ ] Assistant replies in same language user used
- [ ] Assistant never claims success unless tool returned success

**Multi-tenancy**
- [ ] User from Business A cannot read/write Business B data via API or AI, verified by test

---

## 11. Build Order (for the coding agent)

1. Scaffold Next.js + Tailwind + shadcn, set up `.env.local` with values above
2. Apply Supabase migration (schema + RLS from Section 4)
3. Build Supabase auth (login/signup) + onboarding flow → creates `businesses` + `business_members`
4. Build server Supabase client helper (`lib/supabase/server.ts`) resolving `business_id` per request
5. Build Customers CRUD (API + UI)
6. Build Sales CRUD (API + UI)
7. Build Appointments CRUD (API + UI)
8. Build Tasks CRUD (API + UI)
9. Build Groq client + tool-call loop (`agents/run-agent.ts`) wiring all tools from Section 5
10. Build `/api/ai/chat` and `/api/ai/confirm`
11. Build AI Assistant chat UI with confirmation cards
12. Build Dashboard aggregating sales/appointments/tasks/pending payments
13. Add audit logging to every mutating tool/route
14. Test multi-tenant isolation (two businesses, verify no cross-access)
15. Deploy to Vercel, add env vars in Vercel dashboard, connect domain

---

*End of spec. This document is implementation-ready for an autonomous coding agent — no further human research required for MVP build.*
