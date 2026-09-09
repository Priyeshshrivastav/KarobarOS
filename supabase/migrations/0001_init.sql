-- KarobarOS MVP Migration 0001_init.sql
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/nccwxblawpovrkkevubj/sql

-- 1. Profiles Table (extends Supabase Auth auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz default now()
);

-- 2. Businesses Table
create table if not exists public.businesses (
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

-- 3. Business Members
create table if not exists public.business_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text default 'owner' check (role in ('owner','staff')),
  created_at timestamptz default now(),
  unique(business_id, user_id)
);

-- 4. Customers Table
create table if not exists public.customers (
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

-- 5. Customer Notes
create table if not exists public.customer_notes (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete cascade,
  note text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- 6. Services Table
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  name text not null,
  price numeric not null default 0,
  active boolean default true,
  created_at timestamptz default now()
);

-- 7. Sales Table
create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  customer_id uuid references public.customers(id),
  total_amount numeric not null default 0,
  status text default 'completed' check (status in ('completed','pending','refunded')),
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- 8. Sale Items
create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid references public.sales(id) on delete cascade,
  service_id uuid references public.services(id),
  name text not null,
  price numeric not null,
  quantity int default 1
);

-- 9. Payments Table
create table if not exists public.payments (
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

-- 10. Appointments Table
create table if not exists public.appointments (
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

-- 11. Tasks Table
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  title text not null,
  due_at timestamptz,
  status text default 'pending' check (status in ('pending','completed')),
  related_customer_id uuid references public.customers(id),
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- 12. Conversations Table
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  user_id uuid references auth.users(id),
  title text,
  created_at timestamptz default now()
);

-- 13. Messages Table
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade,
  role text check (role in ('user','assistant','tool')),
  content text,
  tool_calls jsonb,
  created_at timestamptz default now()
);

-- 14. AI Actions Table (Confirmation & Logging)
create table if not exists public.ai_actions (
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

-- 15. Notifications Table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  title text,
  body text,
  read boolean default false,
  created_at timestamptz default now()
);

-- 16. Audit Logs Table
create table if not exists public.audit_logs (
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
create index if not exists idx_customers_business on public.customers(business_id);
create index if not exists idx_sales_business on public.sales(business_id);
create index if not exists idx_appointments_business_time on public.appointments(business_id, starts_at);
create index if not exists idx_tasks_business_status on public.tasks(business_id, status);
create index if not exists idx_messages_conversation on public.messages(conversation_id);

-- Helper function for multi-tenant Row Level Security
create or replace function public.is_business_member(biz_id uuid)
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.business_members
    where business_id = biz_id and user_id = auth.uid()
  );
$$;

-- Enable RLS and Policies for each table
alter table public.profiles enable row level security;
drop policy if exists "Users can view and edit own profile" on public.profiles;
create policy "Users can view and edit own profile" on public.profiles
  for all using (auth.uid() = id);

alter table public.businesses enable row level security;
drop policy if exists "members access their business" on public.businesses;
create policy "members access their business" on public.businesses
  for all using (is_business_member(id)) with check (is_business_member(id));

alter table public.business_members enable row level security;
drop policy if exists "members access business_members" on public.business_members;
create policy "members access business_members" on public.business_members
  for all using (user_id = auth.uid() or is_business_member(business_id));

alter table public.customers enable row level security;
drop policy if exists "members access their business customers" on public.customers;
create policy "members access their business customers" on public.customers
  for all using (is_business_member(business_id)) with check (is_business_member(business_id));

alter table public.customer_notes enable row level security;
drop policy if exists "members access customer_notes" on public.customer_notes;
create policy "members access customer_notes" on public.customer_notes
  for all using (is_business_member(business_id)) with check (is_business_member(business_id));

alter table public.services enable row level security;
drop policy if exists "members access services" on public.services;
create policy "members access services" on public.services
  for all using (is_business_member(business_id)) with check (is_business_member(business_id));

alter table public.sales enable row level security;
drop policy if exists "members access sales" on public.sales;
create policy "members access sales" on public.sales
  for all using (is_business_member(business_id)) with check (is_business_member(business_id));

alter table public.sale_items enable row level security;
drop policy if exists "members access sale_items" on public.sale_items;
create policy "members access sale_items" on public.sale_items
  for all using (exists (
    select 1 from public.sales s
    where s.id = sale_items.sale_id and is_business_member(s.business_id)
  ));

alter table public.payments enable row level security;
drop policy if exists "members access payments" on public.payments;
create policy "members access payments" on public.payments
  for all using (is_business_member(business_id)) with check (is_business_member(business_id));

alter table public.appointments enable row level security;
drop policy if exists "members access appointments" on public.appointments;
create policy "members access appointments" on public.appointments
  for all using (is_business_member(business_id)) with check (is_business_member(business_id));

alter table public.tasks enable row level security;
drop policy if exists "members access tasks" on public.tasks;
create policy "members access tasks" on public.tasks
  for all using (is_business_member(business_id)) with check (is_business_member(business_id));

alter table public.conversations enable row level security;
drop policy if exists "members access conversations" on public.conversations;
create policy "members access conversations" on public.conversations
  for all using (is_business_member(business_id)) with check (is_business_member(business_id));

alter table public.messages enable row level security;
drop policy if exists "members access messages" on public.messages;
create policy "members access messages" on public.messages
  for all using (exists (
    select 1 from public.conversations c
    where c.id = messages.conversation_id and is_business_member(c.business_id)
  ));

alter table public.ai_actions enable row level security;
drop policy if exists "members access ai_actions" on public.ai_actions;
create policy "members access ai_actions" on public.ai_actions
  for all using (is_business_member(business_id)) with check (is_business_member(business_id));

alter table public.notifications enable row level security;
drop policy if exists "members access notifications" on public.notifications;
create policy "members access notifications" on public.notifications
  for all using (is_business_member(business_id)) with check (is_business_member(business_id));

alter table public.audit_logs enable row level security;
drop policy if exists "members access audit_logs" on public.audit_logs;
create policy "members access audit_logs" on public.audit_logs
  for all using (is_business_member(business_id)) with check (is_business_member(business_id));
