-- jobs_mq queue schema + worker contract

create table if not exists public.jobs_mq (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  status text not null default 'queued' check (status in ('queued','running','completed','failed','cancelled')),
  payload jsonb not null default '{}'::jsonb,
  trace_id text,
  dedupe_key text,
  attempts int not null default 0,
  max_attempts int not null default 3,
  error jsonb,
  worker_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create index if not exists jobs_mq_status_idx on public.jobs_mq(status);
create index if not exists jobs_mq_type_status_idx on public.jobs_mq(type, status);
create unique index if not exists jobs_mq_dedupe_idx on public.jobs_mq(dedupe_key) where dedupe_key is not null;

-- lease function: claim the next queued job of a given type
create or replace function public.lease_job(job_type text)
returns setof public.jobs_mq
language plpgsql
as $$
begin
  return query
  with job as (
    select * from public.jobs_mq
    where status = 'queued' and type = job_type
    order by created_at asc
    for update skip locked
    limit 1
  )
  update public.jobs_mq j
  set status = 'running',
      started_at = now(),
      updated_at = now(),
      attempts = j.attempts + 1
  from job
  where j.id = job.id
  returning j.*;
end;
$$;
