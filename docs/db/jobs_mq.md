# jobs_mq Queue Schema + Worker Contract

## Table: jobs_mq

**Purpose:** Orchestrate async processing (render, captions, background replace, autocut, etc.).

### SQL (canonical)
See: `supabase/migrations/20260313_jobs_mq.sql`

### Job status lifecycle
- `queued` → `running` → `completed` | `failed`
- `cancelled` is optional for manual aborts

### Required fields
- `id` (uuid)
- `type` (render|captions|scene_detect|autocut|etc)
- `status` (queued|running|completed|failed)
- `payload` (jsonb)
- `trace_id` (uuid/string)
- `created_at`, `updated_at`

### Optional fields
- `started_at`, `completed_at`
- `attempts` (retry count)
- `max_attempts`
- `dedupe_key` (for idempotency)
- `error` (jsonb)

## Worker Contract

### Polling
Workers should claim jobs using `lease_job(type)` (see SQL function) which uses `FOR UPDATE SKIP LOCKED`.

Leasing behavior:
- Claims at most one oldest `queued` job for the requested `type`.
- Uses row-level locking (`FOR UPDATE SKIP LOCKED`) so concurrent workers do not claim the same row.
- Moves the row to `running`, sets `started_at`, and increments `attempts` atomically.

### Idempotency / dedupe
- `dedupe_key` is optional and is used by producers to make enqueue idempotent.
- A partial unique index (`jobs_mq_dedupe_idx`) enforces uniqueness for non-null `dedupe_key` values.
- If an insert reuses an existing `dedupe_key`, treat the unique violation as "already enqueued".

### Acknowledgement
- On claim, set `status=running`, `started_at=now()`, increment `attempts`.
- On success, set `status=completed`, `completed_at=now()`.
- On failure, set `status=failed`, include `error` payload.

### Retry
- If `attempts < max_attempts`, worker may requeue by setting `status=queued`.
- If `attempts >= max_attempts`, fail terminally with `error`.

### Observability
- Always include `trace_id` in logs.
- Attach a `worker_id` to job updates when possible.
