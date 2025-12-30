# Pastebin Lite Backend

## Overview
This service is a small Pastebin-style API built with Express and MongoDB.
It stores text pastes, supports optional expiration (TTL) and max-view limits, and returns a shareable URL
that points at the frontend viewer. Each successful fetch increments the view count; expired or exhausted
pastes are hidden and return 404.

## How it works
- `src/index.ts` starts the HTTP server and reads `PORT`.
- `src/app.ts` wires middleware (CORS, Helmet, JSON parsing) and defines the routes.
- `src/db.ts` manages a cached MongoDB client and provides access to the `pastes` collection.
- `src/services/pasteService.ts` implements create/fetch logic, including TTL checks and view counting.
- `src/validators/pasteValidators.ts` validates input with Zod.
- `src/middleware/errorHandler.ts` and `src/middleware/notFound.ts` format error responses.

### Request flow (create)
1) `POST /api/pastes` receives JSON.
2) Zod validates the payload.
3) A document is created with `createdAt`, optional `expiresAt`, `maxViews`, and `views=0`.
4) The document is inserted into MongoDB.
5) The API returns `{ id, url }`, where `url` uses `PUBLIC_WEB_BASE_URL`.

### Request flow (fetch)
1) `GET /api/pastes/:id` validates the ObjectId.
2) A single MongoDB query checks expiration and max-view limits.
3) The view count is incremented in the same operation.
4) The API returns the paste content and metadata, or 404 if not available.

## Setup
1) Install dependencies:
```bash
pnpm install
```

2) Configure environment variables:
```bash
copy .env.example .env
```

3) Run in development:
```bash
pnpm dev
```

Build and start:
```bash
pnpm build
pnpm start
```

## Environment variables
- `PORT` (optional): API port. Defaults to `3001`.
- `MONGODB_URI` (required): MongoDB connection string.
- `PUBLIC_WEB_BASE_URL` (required): Base URL for the frontend, used to build the returned paste URL.
- `TEST_MODE` (optional): Set to `1` to allow `x-test-now-ms` to override time in tests.

## Endpoints
### `GET /api/healthz`
Checks MongoDB connectivity.

Response:
```json
{ "ok": true }
```

### `POST /api/pastes`
Create a new paste.

Request body:
```json
{
  "content": "console.log('hello')",
  "ttl_seconds": 3600,
  "max_views": 10,
  "language": "javascript"
}
```

Response:
```json
{
  "id": "64b0f3e9f8d5b7f7f2c2a111",
  "url": "http://localhost:3000/p/64b0f3e9f8d5b7f7f2c2a111"
}
```

Validation rules:
- `content` is required and must be a non-empty string.
- `ttl_seconds` and `max_views` must be positive integers when provided.
- `language` must be one of:
  `text`, `javascript`, `typescript`, `python`, `java`, `cpp`, `csharp`, `go`, `rust`,
  `html`, `css`, `json`, `markdown`, `sql`, `bash`.

### `GET /api/pastes/:id`
Fetch a paste and increment its view count.

Response:
```json
{
  "content": "console.log('hello')",
  "remaining_views": 9,
  "expires_at": "2025-01-01T12:00:00.000Z",
  "language": "javascript"
}
```

Behavior:
- Returns `404` if the id is invalid, the paste is expired, or max views have been reached.
- `remaining_views` is `null` when no max view limit is set.
- `expires_at` is `null` when no TTL is set.

## Error format
Errors follow this shape:
```json
{
  "error": "Invalid input",
  "details": { "fieldErrors": { "content": ["Required"] } }
}
```

## Notes
- CORS is currently open to all origins.
- MongoDB collection name: `pastes`.
