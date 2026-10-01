-- Digital Heroes schema. Safe to re-run (idempotent).
create extension if not exists pgcrypto;

create table if not exists charities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  image_url text,
  events jsonb not null default '[]'::jsonb,
  featured boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists charities_featured_idx on charities (featured) where active;
create index if not exists charities_name_idx on charities (lower(name));

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  password_hash text not null,
  role text not null default 'subscriber' check (role in ('subscriber','admin')),
  charity_id uuid references charities(id) on delete set null,
  charity_percent integer not null default 10 check (charity_percent between 10 and 100),
  created_at timestamptz not null default now()
);
create unique index if not exists users_email_key on users (lower(email));
create index if not exists users_created_idx on users (created_at desc);

create table if not exists plans (
  code text primary key check (code in ('monthly','yearly')),
  name text not null,
  price_minor integer not null check (price_minor > 0),
  interval_months integer not null check (interval_months > 0),
  currency text not null default 'inr',
  active boolean not null default true
);
insert into plans (code, name, price_minor, interval_months) values
  ('monthly', 'Monthly', 49900, 1),
  ('yearly',  'Yearly',  499900, 12)
on conflict (code) do nothing;

create table if not exists subscriptions (
  user_id uuid primary key references users(id) on delete cascade,
  plan_code text not null references plans(code),
  status text not null default 'active' check (status in ('active','ended')),
  current_period_end timestamptz not null,
  cancel_at_period_end boolean not null default false,
  provider text not null default 'mock',
  provider_customer_id text,
  provider_subscription_id text,
  updated_at timestamptz not null default now()
);
create index if not exists subscriptions_live_idx on subscriptions (status, current_period_end);
create index if not exists subscriptions_provider_sub_idx on subscriptions (provider_subscription_id);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  plan_code text references plans(code),
  amount_minor integer not null,
  charity_id uuid references charities(id) on delete set null,
  charity_percent integer not null,
  charity_amount_minor integer not null,
  pool_amount_minor integer not null,
  provider text not null,
  provider_ref text,
  created_at timestamptz not null default now()
);
create index if not exists payments_user_idx on payments (user_id);
create index if not exists payments_charity_idx on payments (charity_id);

create table if not exists donations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  charity_id uuid references charities(id) on delete set null,
  amount_minor integer not null check (amount_minor > 0),
  donor_name text,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists donations_charity_idx on donations (charity_id);

-- One score per user per date; rolling "latest 5" is enforced inside a transaction at write time.
create table if not exists scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  score integer not null check (score between 1 and 45),
  played_on date not null,
  created_at timestamptz not null default now(),
  unique (user_id, played_on)
);
create index if not exists scores_user_date_idx on scores (user_id, played_on desc);

-- Single-row, admin-editable draw configuration (pool % and tier shares are NOT hard-coded).
create table if not exists draw_settings (
  id integer primary key default 1 check (id = 1),
  pool_contribution_percent integer not null default 50 check (pool_contribution_percent between 1 and 100),
  tier_shares jsonb not null default '{"5":40,"4":35,"3":25}'::jsonb
);
insert into draw_settings (id) values (1) on conflict (id) do nothing;

create table if not exists draws (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  draw_month date not null,
  logic text not null default 'random' check (logic in ('random','algorithmic')),
  status text not null default 'draft' check (status in ('draft','published')),
  numbers integer[],
  active_subscribers integer not null default 0,
  pool_total_minor bigint not null default 0,
  rollover_in_minor bigint not null default 0,
  tier_pools jsonb,
  jackpot_rollover_out_minor bigint not null default 0,
  rollover_consumed boolean not null default false,
  created_at timestamptz not null default now(),
  published_at timestamptz
);
create index if not exists draws_status_month_idx on draws (status, draw_month desc);

create table if not exists draw_entries (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid not null references draws(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  scores integer[] not null,
  matches integer not null,
  unique (draw_id, user_id)
);
create index if not exists draw_entries_user_idx on draw_entries (user_id);

create table if not exists winnings (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid not null references draws(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  tier integer not null check (tier in (3,4,5)),
  amount_minor bigint not null,
  proof_image text,
  proof_status text not null default 'none' check (proof_status in ('none','submitted','approved','rejected')),
  payment_status text not null default 'pending' check (payment_status in ('pending','paid')),
  admin_note text,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  unique (draw_id, user_id)
);
create index if not exists winnings_user_idx on winnings (user_id);
create index if not exists winnings_review_idx on winnings (proof_status, payment_status);

-- The API connects with a server-side role. Lock the tables against Supabase's public REST API.
alter table charities enable row level security;
alter table users enable row level security;
alter table plans enable row level security;
alter table subscriptions enable row level security;
alter table payments enable row level security;
alter table donations enable row level security;
alter table scores enable row level security;
alter table draw_settings enable row level security;
alter table draws enable row level security;
alter table draw_entries enable row level security;
alter table winnings enable row level security;
