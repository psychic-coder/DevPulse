# Load tests (k6)

This folder contains k6 scripts to load-test critical backend routes.

Scripts:

- `sync.js` — POST /sync/github (heavy route)
- `analytics.js` — GET /analytics/me (Flask microservice proxy)
- `digest.js` — GET /digest/latest (AI digest fetch)
- `ws.js` — WebSocket connection test (generic; adjust URL for socket.io)

Examples:

Run `sync` test:

```bash
k6 run --env TOKEN=your_jwt --env BASE_URL=http://localhost:3001 load-tests/sync.js
```

Run `analytics` test:

```bash
k6 run --env TOKEN=your_jwt --env BASE_URL=http://localhost:3001 load-tests/analytics.js
```

Run `digest` test:

```bash
k6 run --env TOKEN=your_jwt --env BASE_URL=http://localhost:3001 load-tests/digest.js
```

WebSocket test:

```bash
k6 run --env WS_URL=ws://localhost:3001/socket load-tests/ws.js
```

Notes:
- The WebSocket test is a simple raw WebSocket tester. If your server uses Socket.IO, k6 does not implement the Socket.IO protocol; you may need a custom client or a different load tool for Socket.IO specifics.
- Ensure the backend (`apps/backend`) is running and reachable on `BASE_URL` before running tests.
- Use a valid JWT in `TOKEN` when endpoints require authentication.

# Interpreting results
k6 prints summary metrics after the test — look at `http_reqs`, `vus_max`, `http_req_duration` (p95/p99), errors.

Adjust `options` in each script for different VU counts/duration.
