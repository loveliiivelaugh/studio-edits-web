# Asset Storage Layer (Supabase Storage / S3-Compatible)

This document defines the storage-layer contract for Issue #24: where asset bytes live, how metadata is stored, how signed URLs are used, and how lifecycle cleanup works.

## Goals

- Support `supabase` and `s3` providers behind the same metadata model.
- Keep object-store details out of app-facing business logic.
- Use short-lived signed URLs for upload/download.
- Provide predictable lifecycle states and cleanup behavior.

## Schema

Canonical SQL migration:

- `supabase/migrations/20260313_assets_storage_layer.sql`

### Table: `public.assets`

Required fields:

- `id uuid` - primary key.
- `project_id uuid` - project linkage.
- `provider text` - `supabase` or `s3`.
- `bucket text` - bucket/container name.
- `object_key text` - object path/key inside bucket.
- `size_bytes bigint` - byte length.
- `mime_type text` - content type.
- `status text` - `pending|uploading|ready|failed|deleted`.

Optional/operational fields:

- `checksum_sha256 text` - integrity and dedupe checks.
- `metadata jsonb` - provider-specific or asset-specific metadata.
- `error jsonb` - failure payload if upload/processing fails.
- `uploaded_at timestamptz` - finalized upload timestamp.
- `expires_at timestamptz` - lifecycle expiry for temporary assets.
- `deleted_at timestamptz` - soft-delete timestamp.
- `created_at`, `updated_at` - record audit timestamps.

### Constraints and indexes

- Uniqueness: `(provider, bucket, object_key)`.
- Provider check constraint: `provider in ('supabase', 's3')`.
- Status check constraint: `pending|uploading|ready|failed|deleted`.
- Indexed for common patterns:
  - `project_id`
  - `status`
  - `(project_id, status)`
  - `expires_at` (partial)
  - `deleted_at` (partial)

## Signed URL Flows

The app/backend should never expose long-lived storage credentials to clients.

### Upload flow (write)

1. Create `assets` row with `status='pending'` and known metadata (`project_id`, `provider`, `bucket`, `object_key`, `mime_type`, optional `size_bytes`).
2. Backend requests a short-lived signed upload URL from the selected provider.
3. Client uploads bytes directly to object storage using the signed URL.
4. Backend verifies object existence (and checksum/size when available), then marks:
   - `status='ready'`
   - `uploaded_at=now()`
   - `size_bytes` / `checksum_sha256` finalized.
5. On error, mark `status='failed'` and populate `error`.

### Download flow (read)

1. Caller resolves asset metadata from `public.assets`.
2. Allow reads only for `status='ready'` and non-deleted rows.
3. Backend issues a short-lived signed download URL.
4. Client fetches bytes directly from storage.

## Object Key Convention

Recommended key layout:

- `project/<project_id>/uploads/<asset_id>/<filename>`
- `project/<project_id>/renders/<asset_id>/<filename>`
- `project/<project_id>/derived/<asset_id>/<variant>`

This keeps project-scoped assets easy to list, migrate, and clean up.

## Lifecycle and Cleanup Policy

### Status lifecycle

- `pending` -> `uploading` -> `ready`
- `pending|uploading` -> `failed`
- `ready|failed` -> `deleted` (soft delete in DB, object deleted from storage)

### Cleanup categories

- **Expired temporary assets:** rows with `expires_at < now()` and not already deleted.
- **Failed stale uploads:** `status='failed'` older than retention window (for example, 7 days).
- **Soft-deleted assets:** `status='deleted'` where object was already removed; row can be retained for audit or purged after retention.

### Cleanup process (recommended)

1. Select candidate rows (`expires_at`, `status`, `deleted_at`).
2. Attempt object deletion in provider (`bucket`, `object_key`).
3. On success, set `status='deleted'`, `deleted_at=now()`.
4. Optionally hard-delete rows older than audit retention.

Example candidate query for expiration cleanup:

```sql
select id, provider, bucket, object_key
from public.assets
where expires_at is not null
  and expires_at < now()
  and status <> 'deleted';
```

## Provider Notes

- **Supabase Storage:** provider value `supabase`; bucket maps to Supabase storage bucket.
- **S3-compatible:** provider value `s3`; bucket/object key map to S3 API conventions.
- Keep provider credentials server-side only; store no secrets in database docs or migrations.
