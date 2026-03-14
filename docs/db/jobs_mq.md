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
