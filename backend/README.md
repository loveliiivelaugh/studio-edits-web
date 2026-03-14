# Backend API scaffold

Minimal Express + TypeScript scaffold for projects/assets/jobs APIs. This is intentionally in-memory/placeholder only (no database wiring yet).

## Run

```bash
pnpm install
pnpm dev:api
```

The API starts on `http://localhost:8787` by default. Override via `API_PORT`.

## Available routes

- `GET /api/health`
- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:projectId`
- `GET /api/assets`
- `POST /api/assets`
- `GET /api/assets/:assetId`
- `GET /api/jobs`
- `POST /api/jobs`
- `GET /api/jobs/:jobId`

## Auth middleware stub

`backend/src/middleware/auth.ts` is a placeholder middleware. If `Authorization: Bearer <token>` is present, it attaches a fake `req.user` object. Replace this with real auth verification later (JWT/session provider).

## Example HTTP requests

```bash
curl -s http://localhost:8787/api/health
```

```bash
curl -s http://localhost:8787/api/projects
```

```bash
curl -s -X POST http://localhost:8787/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dev-token" \
  -d '{"name":"Launch campaign"}'
```

```bash
curl -s -X POST http://localhost:8787/api/assets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dev-token" \
  -d '{"projectId":"proj_stub_001","kind":"image"}'
```

```bash
curl -s -X POST http://localhost:8787/api/jobs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dev-token" \
  -d '{"projectId":"proj_stub_001","type":"render"}'
```
