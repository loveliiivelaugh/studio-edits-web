-- issue #29: leasing + idempotency guardrails for jobs_mq

-- Ensure dedupe index exists for producer-side idempotency.
-- `dedupe_key` may be null; uniqueness is enforced only when provided.
create unique index if not exists jobs_mq_dedupe_idx
  on public.jobs_mq(dedupe_key)
  where dedupe_key is not null;

-- Ensure lease function exists and keeps row-level locking semantics.
create or replace function public.lease_job(job_type text)
returns setof public.jobs_mq
language plpgsql
as $$
begin
  return query
  with job as (
    select *
    from public.jobs_mq
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

comment on function public.lease_job(text) is
'Claims one queued job for a type using FOR UPDATE SKIP LOCKED. Idempotency is enforced at enqueue time via jobs_mq.dedupe_key (unique partial index jobs_mq_dedupe_idx).';
