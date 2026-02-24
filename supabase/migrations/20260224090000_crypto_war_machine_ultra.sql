create extension if not exists pgcrypto;
create extension if not exists pg_cron;

create table if not exists public.symbols (
  symbol text primary key,
  base text not null,
  quote text not null,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.market_snapshots (
  id uuid primary key default gen_random_uuid(),
  ts timestamptz not null default now(),
  symbol text not null references public.symbols(symbol),
  price_eur numeric not null,
  volume_24h numeric,
  spread numeric,
  depth_score numeric,
  funding numeric,
  open_interest numeric,
  volatility numeric,
  rsi numeric,
  ema20 numeric,
  ema50 numeric,
  adx numeric,
  pump_24h_pct numeric,
  source jsonb default '{}'::jsonb
);

create table if not exists public.fundamentals (
  symbol text primary key references public.symbols(symbol),
  marketcap numeric,
  circ_supply numeric,
  total_supply numeric,
  max_supply numeric,
  unlock_7d numeric,
  unlock_30d numeric,
  inflation numeric,
  updated_at timestamptz not null default now(),
  data_missing boolean not null default false
);

create table if not exists public.news_items (
  id uuid primary key default gen_random_uuid(),
  ts timestamptz not null default now(),
  source text not null,
  symbol_tags text[] not null default '{}',
  sentiment_score numeric,
  title text not null,
  url text not null unique
);

create table if not exists public.signals (
  id uuid primary key default gen_random_uuid(),
  ts timestamptz not null default now(),
  symbol text not null references public.symbols(symbol),
  mode text not null check (mode in ('BREVE','LUNGO')),
  action text not null check (action in ('BUY','WAIT','AVOID')),
  score_total numeric not null,
  confidence_0_5 int not null check (confidence_0_5 between 0 and 5),
  entry_min numeric not null,
  entry_max numeric not null,
  stop numeric not null,
  t1 numeric not null,
  t2 numeric not null,
  rr numeric not null,
  risk_score numeric not null,
  reasons_simple text[] not null default '{}'
);

create table if not exists public.trades_diary (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  ts timestamptz not null default now(),
  symbol text not null,
  entry numeric not null,
  stop numeric not null,
  exit numeric,
  result numeric,
  notes text,
  tags text[] not null default '{}'
);

alter table public.trades_diary enable row level security;
create policy "Users manage own diary" on public.trades_diary
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists idx_market_snapshots_symbol_ts on public.market_snapshots(symbol, ts desc);
create index if not exists idx_signals_ts on public.signals(ts desc);

-- Scheduler every 5 minutes (Supabase pg_cron + pg_net required in project)
select cron.schedule('job-fetch-binance', '*/5 * * * *',
$$ select net.http_post(url:='https://<PROJECT_REF>.supabase.co/functions/v1/fetch_binance_data',
  headers:='{"Authorization":"Bearer ' || current_setting('app.settings.service_role_key', true) || '"}'::jsonb); $$);

select cron.schedule('job-fetch-fundamentals', '0 * * * *',
$$ select net.http_post(url:='https://<PROJECT_REF>.supabase.co/functions/v1/fetch_fundamentals',
  headers:='{"Authorization":"Bearer ' || current_setting('app.settings.service_role_key', true) || '"}'::jsonb); $$);

select cron.schedule('job-fetch-news', '*/15 * * * *',
$$ select net.http_post(url:='https://<PROJECT_REF>.supabase.co/functions/v1/fetch_news_sentiment',
  headers:='{"Authorization":"Bearer ' || current_setting('app.settings.service_role_key', true) || '"}'::jsonb); $$);

select cron.schedule('job-compute-signals', '*/5 * * * *',
$$ select net.http_post(url:='https://<PROJECT_REF>.supabase.co/functions/v1/compute_signals',
  headers:='{"Authorization":"Bearer ' || current_setting('app.settings.service_role_key', true) || '"}'::jsonb); $$);
