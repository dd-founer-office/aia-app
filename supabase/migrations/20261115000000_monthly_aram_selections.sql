-- Monthly Aram cause selection (public page, /monthly-aram).
-- One row per person per month: the split across four actions, an optional
-- dedication, an optional occasion, and the Notion sync status.
-- The page is public and anonymous, so this is separate from participations
-- (which need a signed-in contributor). Only the server (service role) reads
-- or writes it: RLS is on and there are deliberately no policies.

create table if not exists public.monthly_aram_selections (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  month date not null,                 -- first day of the contribution month
  name text not null,
  contact text not null,               -- what they typed (mobile or email)
  contact_key text not null,           -- normalised: lower-case email or 10-digit mobile

  annadhanam numeric not null default 0 check (annadhanam = 0 or annadhanam >= 1000),
  tree_planting numeric not null default 0 check (tree_planting = 0 or tree_planting >= 1000),
  education numeric not null default 0 check (education = 0 or education >= 1000),
  medical numeric not null default 0 check (medical = 0 or medical >= 1000),
  total numeric generated always as (annadhanam + tree_planting + education + medical) stored,

  dedication_type text check (dedication_type in ('honour', 'memory')),
  dedicated_to text,
  relationship text,                   -- Parent, Spouse, Child, Friend, or the typed text for Other
  message text,
  occasion text check (occasion in ('Birthday', 'Anniversary', 'Remembrance day', 'Festival', 'Wedding', 'New beginning', 'Other')),
  occasion_date date,

  notion_status text not null default 'pending' check (notion_status in ('pending', 'synced', 'failed', 'skipped')),
  notion_page_id text,
  notion_error text,
  notion_synced_at timestamptz,

  constraint monthly_aram_min_total check (annadhanam + tree_planting + education + medical >= 1000),
  constraint monthly_aram_one_per_month unique (contact_key, month)
);

alter table public.monthly_aram_selections enable row level security;

comment on table public.monthly_aram_selections is
  'Monthly Aram public cause selection: one row per person per month (re-submitting updates it). Server-only via the service role; mirrored to a Notion database for the monthly report.';
