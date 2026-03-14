# Canonical Project JSON Schema (v1)

This document defines the **shared project JSON** contract used by frontend, backend, and workers. The authoritative schema lives in:

- `docs/schema/project.schema.json`

## Versioning
- `version` is required.
- Breaking changes must bump the major version (e.g., `2.0.0`).

## Sample Project JSON
```json
{
  "version": "1.0.0",
  "projectId": "proj_123",
  "createdAt": "2026-03-13T21:00:00Z",
  "updatedAt": "2026-03-13T21:30:00Z",
  "assets": [
    {
      "id": "asset_vid_1",
      "type": "video",
      "uri": "s3://bucket/uploads/clip1.mp4",
      "durationMs": 120000
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
            "endMs": 60000,
            "inMs": 5000,
            "outMs": 65000,
            "effects": [{ "effectId": "fx_1" }]
          }
        ]
      }
    ]
  },
  "captions": [
    {
      "id": "cap_1",
      "startMs": 1000,
      "endMs": 4500,
      "text": "Welcome to Studio Edits!"
    }
  ],
  "effects": [
    {
      "id": "fx_1",
      "type": "colorGrade",
      "params": { "preset": "cinematic" }
    }
  ],
  "renderSettings": {
    "resolution": { "width": 1920, "height": 1080 },
    "fps": 30,
    "format": "mp4",
    "bitrateKbps": 8000
  }
}
```

## Compatibility Strategy
- Clients should validate against the schema before save/export.
- Workers should reject unknown major versions with a clear error.
- Add new optional fields in minor versions.
