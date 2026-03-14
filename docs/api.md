# Studio Edits API Reference

This document captures the API surface used by the web app today and the queue-backed API design for project/job workflows.

- OpenStudio base URL: `/api/v1/openstudio`
- Core app base URL: `/api/v1`
- Project JSON schema: `docs/schema/project.schema.json`
- Project schema notes: `docs/canonical-project-schema.md`
- Queue model and worker contract: `docs/db/jobs_mq.md`

## Authentication

The frontend API client can attach `Authorization: Bearer <token>` when `VITE_MASTER_API_KEY` is set.

| Route group | Auth requirement | Notes |
| --- | --- | --- |
| `/api/v1/openstudio/*` | `Bearer` token required in production | Browser/dev setups may allow unauthenticated calls behind trusted network boundaries. |
| `/api/v1/*` (non-openstudio) | Service-specific; default to `Bearer` required | Example: memory query and profile endpoints should enforce app auth server-side. |
| Supabase direct reads (`memories`) | Supabase anon key + RLS policy | Client uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. |
| Worker queue (`jobs_mq`) | Backend/worker credentials only | Never expose queue lease/update operations directly to untrusted clients. |

## Error Format and Status Codes

Use a consistent machine-readable envelope for non-2xx responses.

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Field 'project.clips' is required.",
    "details": {
      "field": "project.clips"
    },
    "traceId": "trc_01HV..."
  }
}
```

Recommended status code usage:

- `200` success for reads or synchronous operations
- `201` created (new project/job/asset metadata)
- `202` accepted for async render/AI pipelines
- `400` invalid request shape or parameters
- `401` missing or invalid auth
- `403` authenticated but not allowed
- `404` resource not found
- `409` dedupe/version conflict
- `422` semantically invalid content
- `429` rate limited
- `500` unexpected server failure

## Endpoints by Domain

### Projects

These endpoints define the canonical project persistence API and use the schema in `docs/schema/project.schema.json`.

#### `GET /api/v1/openstudio/projects`
- Auth: `Bearer`
- Returns paginated project list.

Example response:

```json
{
  "items": [
    {
      "id": "proj_123",
      "name": "Gym Edit",
      "updatedAt": "2026-03-13T21:30:00Z"
    }
  ],
  "nextCursor": null
}
```

#### `POST /api/v1/openstudio/projects`
- Auth: `Bearer`
- Creates a project.

Example request:

```json
{
  "name": "Gym Edit",
  "project": {
    "version": "1.0.0",
    "projectId": "proj_123",
    "assets": [],
    "timeline": {
      "tracks": []
    },
    "renderSettings": {
      "resolution": { "width": 1920, "height": 1080 },
      "fps": 30,
      "format": "mp4"
    }
  }
}
```

Example response (`201`):

```json
{
  "id": "proj_123",
  "name": "Gym Edit",
  "project": {
    "version": "1.0.0",
    "projectId": "proj_123",
    "assets": [],
    "timeline": { "tracks": [] },
    "renderSettings": {
      "resolution": { "width": 1920, "height": 1080 },
      "fps": 30,
      "format": "mp4"
    }
  },
  "createdAt": "2026-03-13T21:00:00Z",
  "updatedAt": "2026-03-13T21:00:00Z"
}
```

#### `GET /api/v1/openstudio/projects/:projectId`
- Auth: `Bearer`
- Returns full project payload.

#### `PATCH /api/v1/openstudio/projects/:projectId`
- Auth: `Bearer`
- Updates project metadata and/or JSON payload.

#### `DELETE /api/v1/openstudio/projects/:projectId`
- Auth: `Bearer`
- Soft-delete recommended; return `204` on success.

### Assets

#### `POST /api/v1/openstudio/upload-clip`
- Auth: `Bearer`
- Content type: `multipart/form-data`
- Uploads one video file for timeline usage.

Example request (curl):

```bash
curl -X POST "$API_BASE/api/v1/openstudio/upload-clip" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@clip.mp4"
```

Example response:

```json
{
  "url": "https://cdn.example.com/media/clip_01.mp4"
}
```

#### `GET /api/v1/openstudio/assets/music`
- Auth: `Bearer`
- Returns music catalog for editor music picker.

Example response:

```json
{
  "tracks": [
    {
      "id": "trk_01",
      "title": "Pulse Run",
      "artist": "Studio Beats",
      "previewUrl": "https://cdn.example.com/music/pulse-run.mp3",
      "duration": 126
    }
  ]
}
```

#### `GET /api/v1/openstudio/assets/music/:trackId/beats`
- Auth: `Bearer`
- Returns beat timestamps in seconds.

Example response:

```json
{
  "beats": [0.42, 0.84, 1.25, 1.67]
}
```

#### `GET /api/v1/openstudio/exports`
- Auth: `Bearer`
- Returns exported videos for feed/profile views.

Example response:

```json
{
  "items": [
    {
      "id": "exp_01",
      "createdAt": "2026-03-13T22:10:00Z",
      "videoUrl": "https://cdn.example.com/media/export_01.mp4"
    }
  ]
}
```

#### `GET /api/v1/openstudio/nano-banana/images`
- Auth: `Bearer`
- Returns generated image assets.

#### `GET /api/v1/openstudio/nano-banana/images-legacy`
- Auth: `Bearer`
- Legacy response shape for existing gallery support.

### AI Tools

#### `POST /api/v1/openstudio/ai/chat-edit`
- Auth: `Bearer`
- Applies natural-language edits to a project.

Example request:

```json
{
  "project": {
    "id": "proj-1700000000000",
    "name": "Project 1",
    "clips": [],
    "overlays": []
  },
  "message": "Add cinematic fade-in and boost highlight pacing."
}
```

Example response:

```json
{
  "project": {
    "id": "proj-1700000000000",
    "name": "Project 1",
    "clips": [],
    "overlays": []
  },
  "explanation": "Applied a short fade-in and tightened clip timing."
}
```

#### `POST /api/v1/openstudio/ai/smart-edit`
- Auth: `Bearer`
- Runs auto-edit heuristics on a full project.

Example request:

```json
{
  "project": {
    "id": "proj-1700000000000",
    "name": "Project 1",
    "clips": [],
    "overlays": []
  }
}
```

Example response:

```json
{
  "project": {
    "id": "proj-1700000000000",
    "name": "Project 1",
    "clips": [],
    "overlays": []
  },
  "previewUrl": "https://cdn.example.com/media/preview_01.mp4",
  "meta": {
    "appliedEffects": ["tempo-cut", "color-boost"],
    "notes": "Optimized for short-form pacing"
  }
}
```

#### `POST /api/v1/openstudio/nano-banana/generate`
- Auth: `Bearer`
- Generates image from prompt.

Example request:

```json
{
  "prompt": "Athlete sprinting through neon rain",
  "negativePrompt": "low quality, blurry"
}
```

Example response:

```json
{
  "imageDataUrl": "data:image/png;base64,iVBOR...",
  "model": "nano-banana-v1"
}
```

#### `POST /api/v1/openstudio/nano-banana/edit`
- Auth: `Bearer`
- Edits image using prompt + source data URL.

Example request:

```json
{
  "imageDataUrl": "data:image/png;base64,iVBOR...",
  "prompt": "Convert to warm golden-hour style",
  "negativePrompt": "grain, artifacts"
}
```

Example response:

```json
{
  "imageDataUrl": "data:image/png;base64,iVBOR...",
  "sourceImageDataUrl": "data:image/png;base64,iVBOR...",
  "model": "nano-banana-v1"
}
```

### Rendering

#### `POST /api/v1/openstudio/export`
- Auth: `Bearer`
- Renders a project to final video and returns downloadable URL.

Example request:

```json
{
  "project": {
    "id": "proj-1700000000000",
    "name": "Project 1",
    "clips": [
      {
        "id": "clip-1",
        "uri": "https://cdn.example.com/media/clip_1.mp4",
        "localUri": "",
        "remoteUri": "https://cdn.example.com/media/clip_1.mp4",
        "start": 0,
        "end": 5,
        "order": 0
      }
    ],
    "overlays": []
  }
}
```

Example response:

```json
{
  "url": "https://cdn.example.com/media/export_1700000000000.mp4"
}
```

Status behavior:

- `200` if render is completed quickly and URL is returned immediately.
- `202` recommended for async render pipelines with queue-backed status polling.

### Jobs (Queue-backed Design)

The queue storage contract is implemented in `supabase/migrations/20260313_jobs_mq.sql` and documented in `docs/db/jobs_mq.md`.

#### `POST /api/v1/openstudio/jobs`
- Auth: `Bearer`
- Enqueues async work (`render`, `captions`, `autocut`, etc.).

Example request:

```json
{
  "type": "render",
  "payload": {
    "projectId": "proj_123"
  },
  "dedupeKey": "render:proj_123:v7"
}
```

Example response (`201`):

```json
{
  "id": "9fc76d5f-b31d-40f8-b7cc-f26c0f9f7e52",
  "type": "render",
  "status": "queued",
  "traceId": "trc_01HV...",
  "createdAt": "2026-03-13T22:15:00Z"
}
```

#### `GET /api/v1/openstudio/jobs/:jobId`
- Auth: `Bearer`
- Returns job status, attempts, and optional error payload.

#### `POST /api/v1/openstudio/jobs/:jobId/cancel`
- Auth: `Bearer`
- Best effort cancel. Return `409` if already completed/failed.

#### Worker lease endpoint (internal only)
- Backends/workers should claim jobs using SQL function `public.lease_job(job_type text)` with `FOR UPDATE SKIP LOCKED`.
- Do not expose lease operations directly to browser clients.
