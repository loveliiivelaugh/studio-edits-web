-- issue #24: asset storage layer schema (supabase storage / s3)

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  provider text not null check (provider in ('supabase', 's3')),
  bucket text not null,
  object_key text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  mime_type text not null,
  checksum_sha256 text,
  status text not null default 'pending' check (status in ('pending', 'uploading', 'ready', 'failed', 'deleted')),
  metadata jsonb not null default '{}'::jsonb,
  error jsonb,
  expires_at timestamptz,
  uploaded_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assets_provider_bucket_object_key_uniq unique (provider, bucket, object_key)
);

create index if not exists assets_project_id_idx on public.assets(project_id);
create index if not exists assets_status_idx on public.assets(status);
create index if not exists assets_project_status_idx on public.assets(project_id, status);
create index if not exists assets_expires_at_idx on public.assets(expires_at) where expires_at is not null;
create index if not exists assets_deleted_at_idx on public.assets(deleted_at) where deleted_at is not null;

comment on table public.assets is
'Stores uploaded and derived asset metadata for Supabase Storage and S3-compatible object stores.';

comment on column public.assets.project_id is
'Logical project linkage. Foreign key can be added once the canonical projects table is finalized.';

comment on column public.assets.provider is
'Object storage provider identifier. Supported values: supabase, s3.';

comment on column public.assets.object_key is
'Provider object key/path (for example: project/<project_id>/uploads/<asset_id>.mp4).';

comment on column public.assets.status is
'Asset lifecycle state: pending -> uploading -> ready, with failed/deleted as terminal states.';

comment on column public.assets.expires_at is
'Optional expiry for temporary assets or signed URL lifecycle coordination.';

comment on column public.assets.checksum_sha256 is
'Hex SHA-256 checksum used for integrity validation and dedupe checks.';
