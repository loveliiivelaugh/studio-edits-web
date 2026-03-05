# PRD: Google Drive as First-Class Import/Export for Studio Editor

## 1) Objective
Enable users to import source videos from Google Drive and export rendered videos back to Google Drive as a first-class workflow in Studio Editor.

## 2) Problem Statement
Today, users can import local files and export to downloadable URLs. This blocks cloud-first workflows where users keep media in Drive, collaborate, and avoid repeated local downloads/uploads.

## 3) Goals
- Import videos directly from Google Drive picker into Studio Editor projects.
- Export rendered output directly to a selected Drive folder.
- Preserve current local import/export flows.
- Ensure secure OAuth token handling and minimal user friction.

## 4) Non-Goals (Phase 1)
- Full Google Photos integration.
- Shared Drive advanced ACL editing.
- Folder sync/background watcher.
- Multi-account switching UX polish.

## 5) User Stories
- As a creator, I can open Google Drive, pick one or multiple videos, and add them to timeline.
- As a creator, I can export final render directly to a Drive folder and get a link.
- As a creator, I can reconnect Drive if token expires and retry without losing project state.

## 6) Success Metrics
- >= 80% successful Drive import completion for authenticated users.
- >= 90% successful Drive export completion after render success.
- Median time-to-import first clip from Drive < 20s (excluding giant files).
- Export-to-Drive failure rate due to auth/token issues < 5% after reconnect flow.

## 7) Functional Requirements

### 7.1 Auth + Connection
- Add “Connect Google Drive” action in frontend settings/editor import/export entry points.
- Backend must provide OAuth2 authorization URL and callback handling.
- Store user connection status (`connected`, `expired`, `revoked`).
- Support disconnect action.

### 7.2 Drive Import
- User opens Drive picker (or backend-driven list endpoint fallback).
- User selects one or multiple video files.
- Selected files are ingested into existing clip pipeline (`upload-clip` compatible result shape).
- Imported clips must include playable URLs for editor preview + timeline metadata.

### 7.3 Drive Export
- User selects “Export to Google Drive”.
- Backend renders as usual, then uploads output to Drive folder (default configurable folder).
- Return Drive file metadata + shareable URL.
- Show export status: idle/loading/success/failure and retry guidance.

### 7.4 Resilience
- If Drive token expired, return explicit auth error code and reconnect URL.
- Retry-safe endpoints (idempotency key where needed).
- Partial failure handling for multi-file import.

## 8) Proposed API Contract (Backend)

Base: existing OpenStudio backend (`/api/v1/openstudio`)

### 8.1 Connection
- `GET /integrations/google-drive/auth-url`
  - Response: `{ authUrl: string }`
- `GET /integrations/google-drive/callback?code=...&state=...`
  - Handles OAuth callback and persists tokens server-side.
- `GET /integrations/google-drive/status`
  - Response: `{ connected: boolean, expiresAt?: string, email?: string }`
- `POST /integrations/google-drive/disconnect`
  - Response: `{ disconnected: true }`

### 8.2 File Discovery (if picker fallback needed)
- `GET /integrations/google-drive/files?query=&pageToken=&pageSize=`
  - Response: `{ items: [{ id, name, mimeType, size, thumbnailUrl }], nextPageToken? }`

### 8.3 Import
- `POST /integrations/google-drive/import`
  - Request: `{ fileIds: string[], projectId?: string }`
  - Response:
    ```json
    {
      "clips": [
        {
          "id": "clip-...",
          "label": "my-file.mp4",
          "remoteUri": "https://...",
          "localUri": "",
          "uri": "https://...",
          "start": 0,
          "end": 12.3,
          "sourceDuration": 12.3,
          "order": 0
        }
      ],
      "failed": [{ "fileId": "...", "reason": "UNSUPPORTED_MIME" }]
    }
    ```

### 8.4 Export to Drive
- `POST /export/google-drive`
  - Request:
    ```json
    {
      "project": { "...": "existing export payload" },
      "folderId": "optional-drive-folder-id",
      "fileName": "optional-custom-name.mp4"
    }
    ```
  - Response:
    ```json
    {
      "driveFileId": "...",
      "name": "project-export.mp4",
      "webViewLink": "https://drive.google.com/file/d/.../view",
      "webContentLink": "https://drive.google.com/uc?...",
      "size": 12345678
    }
    ```

## 9) Error Contract (Required)
All Drive endpoints should return machine-readable error payloads:
```json
{ "code": "DRIVE_TOKEN_EXPIRED", "message": "Google Drive connection expired", "action": "RECONNECT" }
```

Required error codes:
- `DRIVE_NOT_CONNECTED`
- `DRIVE_TOKEN_EXPIRED`
- `DRIVE_PERMISSION_DENIED`
- `DRIVE_FILE_NOT_FOUND`
- `DRIVE_UNSUPPORTED_MIME`
- `DRIVE_QUOTA_EXCEEDED`
- `DRIVE_UPLOAD_FAILED`
- `DRIVE_IMPORT_PARTIAL_FAILURE`

## 10) Security & Compliance Requirements
- Store OAuth refresh/access tokens server-side only; never expose to client logs.
- Encrypt tokens at rest.
- Scope minimization:
  - `drive.file` preferred for least privilege.
  - add broader scopes only if product requires listing arbitrary files.
- Validate OAuth state parameter and anti-CSRF protections.
- Redact all tokens/PII in logs.

## 11) Backend Data Model Additions
Table: `user_google_drive_connections`
- `id`
- `user_id`
- `google_email`
- `access_token_encrypted`
- `refresh_token_encrypted`
- `expires_at`
- `scope`
- `created_at`
- `updated_at`
- `revoked_at`

Optional table: `media_ingest_jobs` for async import tracking.

## 12) Frontend Integration Requirements
- Env names only (no secret values in frontend docs/logs):
  - `VITE_OPENSTUDIO_API_BASE`
  - `VITE_HOSTNAME`
  - `VITE_DEV_HOSTNAME`
- Add import entry point in timeline: `Import from Google Drive`.
- Add export action in export panel: `Export to Google Drive`.
- Reuse existing panel state machine (`idle/loading/success/failure`).
- Display reconnect CTA for auth-related error codes.

## 13) UX Flows

### 13.1 Import from Drive
1. Click `Import from Google Drive`
2. If not connected -> connect OAuth
3. Open picker / file list
4. Select files
5. Show ingest progress
6. Add successful clips to timeline in selected order

### 13.2 Export to Drive
1. Click `Export to Google Drive`
2. Optional folder selection
3. Render + upload
4. Show success with `Open in Drive` link
5. Allow retry on failure

## 14) Performance Constraints
- Import endpoint should stream/download in backend without loading entire file into memory.
- Support files up to at least 2GB for phase 1 (configurable timeout/chunking).
- Export upload should use resumable uploads where feasible.

## 15) Observability
Track events:
- `drive_connect_started/succeeded/failed`
- `drive_import_started/succeeded/failed/partial`
- `drive_export_started/succeeded/failed`
- Include error code dimensions.

## 16) Rollout Plan
- Phase A: backend OAuth + status + import single file + export single file.
- Phase B: multi-file import, folder selection, richer retry UX.
- Phase C: shared drive support and operational hardening.

## 17) QA Checklist
- Connect/disconnect Drive.
- Import 1 file and multiple files.
- Import with unsupported mime.
- Token expiry reconnect flow.
- Export to Drive default folder.
- Export to selected folder.
- Large file handling and timeout behavior.
- Permission denied path.

## 18) Open Questions for Backend Agent
- Can we use Google Picker client-side with backend-issued short-lived session, or do we prefer backend list endpoint first?
- Will exported files be made shareable by default, or private with owner-only access?
- Which maximum media size and timeout budgets are acceptable in current infra?
- Do we store Drive file IDs for provenance on each clip/export record?
