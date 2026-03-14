# Render Worker Contract (Issue #19)

This document defines the minimal queue contract for timeline rendering with the libopenshot/FFmpeg pipeline.

## Scope

- Job type: `render`
- Pipeline goal: transform one canonical project JSON (`v1`) into one rendered media output plus render artifacts
- Queue table and lifecycle baseline: `docs/db/jobs_mq.md`
- Canonical project schema: `docs/schema/project.schema.json`

## Job Contract

The render worker reads `jobs_mq` rows where:

- `type = "render"`
- `status = "queued"` (claimed via `lease_job(type)`)

The `jobs_mq.payload` JSON for render jobs is expected to follow this shape.

### Payload shape (minimal)

```json
{
  "schemaVersion": "1.0",
  "requestId": "rq_20260313_0001",
  "project": {
    "version": "1.0.0",
    "projectId": "proj_123",
    "assets": [],
    "timeline": { "tracks": [] },
    "renderSettings": {
      "resolution": { "width": 1920, "height": 1080 },
      "fps": 30,
      "format": "mp4",
      "bitrateKbps": 8000
    }
  },
  "output": {
    "fileName": "proj_123_master.mp4",
    "storage": {
      "provider": "s3",
      "bucket": "studio-edits-renders",
      "keyPrefix": "projects/proj_123/renders/rq_20260313_0001/"
    }
  },
  "artifacts": {
    "thumbnailCount": 1,
    "includeManifest": true,
    "includeWorkerLog": true
  }
}
```

### Field requirements

- `schemaVersion`: contract version for this render payload
- `requestId`: idempotency-friendly request identifier (stable across retries)
- `project`: full canonical project JSON object; must validate against `docs/schema/project.schema.json`
- `output.fileName`: requested output filename including extension (`.mp4` or `.mov`)
- `output.storage`: target location metadata for write/upload
- `artifacts`: optional switches for non-primary outputs

## Status Updates

Render workers use `jobs_mq.status` for lifecycle and `jobs_mq.error` for terminal failures.

### Lifecycle

- `queued`: enqueued and waiting
- `running`: worker claimed the job and started rendering
- `completed`: render finished and output metadata was recorded
- `failed`: terminal failure with error details
- `cancelled` (optional): manually aborted job

### Progress updates while running

While `status = "running"`, worker may update `payload.progress` in-place:

```json
{
  "phase": "encoding",
  "percent": 67,
  "etaSeconds": 14,
  "updatedAt": "2026-03-13T22:10:33Z"
}
```

Progress is best-effort and non-terminal; terminal state is always represented by `status`.

### Failure shape (`jobs_mq.error`)

```json
{
  "code": "FFMPEG_ENCODE_FAILED",
  "message": "ffmpeg exited with code 1",
  "retryable": true,
  "details": {
    "phase": "encoding",
    "stderrTail": "...last relevant ffmpeg lines..."
  }
}
```

## Artifacts

On success, worker should publish at least one primary media file and metadata describing all generated outputs.

### Required artifact

- Primary rendered media file (`video/mp4` or `video/quicktime`)

### Optional artifacts

- Poster/thumbnail image(s)
- Render manifest JSON (artifact list, checksums, dimensions, duration)
- Worker log snippet for diagnostics

## Example Job Payload

```json
{
  "schemaVersion": "1.0",
  "requestId": "rq_20260313_0007",
  "project": {
    "version": "1.0.0",
    "projectId": "proj_abc",
    "createdAt": "2026-03-13T22:00:00Z",
    "updatedAt": "2026-03-13T22:02:00Z",
    "assets": [
      {
        "id": "asset_vid_1",
        "type": "video",
        "uri": "s3://studio-edits-inputs/proj_abc/clip1.mp4",
        "durationMs": 45000
      }
    ],
    "timeline": {
      "tracks": [
        {
          "id": "track_video_1",
          "type": "video",
          "clips": [
            {
              "id": "clip_1",
              "assetId": "asset_vid_1",
              "startMs": 0,
              "endMs": 30000,
              "inMs": 5000,
              "outMs": 35000
            }
          ]
        }
      ]
    },
    "renderSettings": {
      "resolution": { "width": 1280, "height": 720 },
      "fps": 30,
      "format": "mp4",
      "bitrateKbps": 5000
    }
  },
  "output": {
    "fileName": "proj_abc_v1.mp4",
    "storage": {
      "provider": "s3",
      "bucket": "studio-edits-renders",
      "keyPrefix": "projects/proj_abc/renders/rq_20260313_0007/"
    }
  },
  "artifacts": {
    "thumbnailCount": 1,
    "includeManifest": true,
    "includeWorkerLog": true
  }
}
```

## Expected Output Metadata (on success)

This metadata can be written into the completed job payload (for example at `payload.result`) and/or persisted in a dedicated outputs table.

```json
{
  "requestId": "rq_20260313_0007",
  "status": "completed",
  "output": {
    "uri": "s3://studio-edits-renders/projects/proj_abc/renders/rq_20260313_0007/proj_abc_v1.mp4",
    "mimeType": "video/mp4",
    "sizeBytes": 18422144,
    "durationMs": 30000,
    "resolution": { "width": 1280, "height": 720 },
    "fps": 30,
    "sha256": "3f6f0a0e78d3cb0f72f1f0ecf6c9b1a79fd1e9696f71c15f8ac0b6ed5f1b21d9"
  },
  "artifacts": [
    {
      "kind": "thumbnail",
      "uri": "s3://studio-edits-renders/projects/proj_abc/renders/rq_20260313_0007/thumb_0001.jpg",
      "mimeType": "image/jpeg"
    },
    {
      "kind": "manifest",
      "uri": "s3://studio-edits-renders/projects/proj_abc/renders/rq_20260313_0007/manifest.json",
      "mimeType": "application/json"
    }
  ],
  "completedAt": "2026-03-13T22:15:05Z"
}
```

## Notes

- Keep payloads free of secrets; use storage references/URIs rather than embedded credentials.
- Workers should reject unsupported major versions for either `schemaVersion` or `project.version` with a clear error code.
- Retries should preserve `requestId` to keep output paths and dedupe behavior stable.
