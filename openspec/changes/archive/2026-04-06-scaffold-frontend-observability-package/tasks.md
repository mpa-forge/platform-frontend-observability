## 1. Package Bootstrap

- [x] 1.1 Add the shared package entrypoint, exported TypeScript types, and a
      disabled-mode runtime handle for browser consumers.
- [x] 1.2 Implement config normalization for app, environment, release,
      enablement, and public-safe ingest configuration inputs.
- [x] 1.3 Add runtime metadata accessors and mutable user-context update
      support without requiring runtime reinitialization.

## 2. Browser Runtime Hooks

- [x] 2.1 Implement explicit runtime methods for page-view tracking and
      client-side error capture that stay safe in disabled mode.
- [x] 2.2 Implement Web Vitals or equivalent UX-signal reporting hooks through
      the shared runtime surface.
- [x] 2.3 Implement protected-request correlation helpers that return
      transport-ready metadata for frontend API clients.

## 3. Frontend-Web Adapter Layer

- [x] 3.1 Add optional React-friendly helpers for attaching the runtime in the
      current `frontend-web` app bootstrap.
- [x] 3.2 Add React Router integration helpers for page-view tracking that fit
      the current route ownership in `frontend-web`.
- [x] 3.3 Add lightweight user-context or request-boundary helpers that match
      the shared auth and protected API client design in `frontend-web`.

## 4. Consumer Contract And Validation

- [x] 4.1 Document the `frontend-web` consumer contract, including browser-safe
      configuration expectations and where router, error-boundary, and API-client
      integration should happen.
- [x] 4.2 Add or update repo-local validation so the package compiles and the
      shared runtime contract is covered by targeted tests or fixtures.
- [x] 4.3 Run repo checks (`make lint`, `make test`, `make format-check`, and
      `make sync-agent-skills-check`) and fix any issues they surface.
- [x] 4.4 Archive the completed change so the canonical
      `frontend-observability-runtime` spec is promoted under `openspec/specs/`.
