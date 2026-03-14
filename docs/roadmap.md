# Studio Editor Roadmap Checklist (MVP -> Advanced/Scale)

Source: `docs/google-drive-import-export-prd.md`

## Phase 1 - MVP Foundation

Goal: ship a secure, usable single-file Google Drive import/export loop.

- [ ] **Auth + connection baseline**
- [ ] Add `Connect Google Drive` entry points in import/export UI
- [ ] Implement backend OAuth URL + callback + status + disconnect endpoints
- [ ] Persist Drive connection state (`connected`/`expired`/`revoked`)
- [ ] **Single-file import/export**
- [ ] Implement Drive import endpoint for one file -> clip payload compatible with existing pipeline
- [ ] Implement export-to-Drive endpoint after render -> return Drive metadata + link
- [ ] Show export state in UI (`idle/loading/success/failure`)
- [ ] **Error + security minimums**
- [ ] Return machine-readable error payloads and required Drive error codes
- [ ] Encrypt tokens at rest; keep tokens server-side only; redact token/PII logs
- [ ] Use least-privilege scope (`drive.file`) unless broader scope is required
- [ ] **Observability + QA**
- [ ] Track connect/import/export success/failure events with error code dimensions
- [ ] Validate happy-path QA: connect/disconnect, single-file import, single-file export

Dependencies
- Existing render/export pipeline and clip ingest contract must stay stable.
- OAuth credentials + callback host configuration must be available.
- Backend token storage and encryption mechanism must be in place before launch.

Risks
- OAuth misconfiguration can block all Drive flows.
- Token lifecycle bugs can cause reconnect loops and failed exports.
- Large media handling may time out without streaming/resumable behavior.

## Phase 2 - Core Workflow Expansion

Goal: make Drive workflows production-usable for day-to-day creator work.

- [ ] **Import UX and throughput**
- [ ] Support multi-file import with ordered timeline insertion
- [ ] Add partial-failure response handling (`clips` + `failed[]`)
- [ ] Add picker fallback/file listing endpoint if client picker constraints require it
- [ ] **Export UX improvements**
- [ ] Support folder selection on export
- [ ] Support custom filename input
- [ ] Improve retry UX for auth and transient upload failures
- [ ] **Reliability controls**
- [ ] Add idempotency keys for retry-safe import/export operations
- [ ] Add explicit reconnect CTA and flow for `DRIVE_TOKEN_EXPIRED`
- [ ] Validate timeout/chunking settings for target file sizes (>=2GB target from PRD)

Dependencies
- Phase 1 endpoints and error contract must be complete.
- UX state machine from existing export panel must be reusable and tested.
- Product decision needed on picker-first vs backend listing-first strategy.

Risks
- Multi-file ingestion can increase queue pressure and timeline ordering bugs.
- Folder selection adds API scope/permission edge cases.
- Retry behavior without idempotency can create duplicate imports/exports.

## Phase 3 - Hardening and Operations

Goal: reduce operational risk and support heavier usage safely.

- [ ] **Operational robustness**
- [ ] Introduce async job tracking for long-running ingest/export flows (`media_ingest_jobs` optional table)
- [ ] Add deeper telemetry dashboards and alert thresholds for Drive failure codes
- [ ] Add runbooks for auth outages, quota errors, and upload failures
- [ ] **Coverage and policy**
- [ ] Expand QA matrix for permission denied, unsupported MIME, large-file behavior
- [ ] Validate privacy/logging posture (PII redaction checks)
- [ ] Finalize default shareability policy for exported files
- [ ] **Capability extension**
- [ ] Add shared drive support (called out in PRD rollout)
- [ ] Capture Drive provenance IDs on clip/export records (if approved)

Dependencies
- Phase 2 reliability controls and metrics instrumentation must be in place.
- Decision on file privacy defaults is required before broader rollout.
- Data model updates must be migration-safe and monitored.

Risks
- Quota/rate limits become more visible as volume grows.
- Missing runbooks slows incident recovery.
- Shared drive ACL differences can create hard-to-reproduce failures.

## Phase 4 - Advanced / Scale (AI-Assist + Platform)

Goal: move from feature-complete integration to intelligent, scalable workflows.

- [ ] **AI-assisted workflow layer**
- [ ] Add smart import recommendations (recent/frequent folders, likely source files)
- [ ] Add auto metadata enrichment (labels/tags/transcript hooks) for imported clips
- [ ] Add export destination suggestions based on project/team patterns
- [ ] **Scale architecture**
- [ ] Separate heavy ingest/export workers from request path
- [ ] Add resumable/chunked upload/download strategy as default path for large files
- [ ] Add backlog controls (concurrency limits, queue priorities, retry budget)
- [ ] **Enterprise readiness**
- [ ] Add policy controls for retention/sharing defaults
- [ ] Add audit-oriented event history for connection and file operations
- [ ] Define SLOs (import latency, export success rate, reconnect success rate) and enforce them

Dependencies
- Phase 3 telemetry and job infrastructure are required for safe AI/scale rollouts.
- AI features require stable metadata capture and historical usage events.
- Platform changes require capacity planning and cost guardrails.

Risks
- AI suggestions can reduce trust if recommendations are noisy/opaque.
- Scale improvements can increase infra cost without queue and retry governance.
- Policy/audit requirements may require additional compliance review.

## Dependency Summary (Cross-Phase)

- OAuth + secure token handling -> required before any import/export capability.
- Stable error contract + idempotency -> required before high-volume retries.
- Observability + async jobs -> required before shared drive and AI/scale features.
- Product decisions (picker strategy, export shareability, provenance storage) -> unblock later phases.
