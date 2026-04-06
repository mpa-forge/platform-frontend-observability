## Why

`frontend-web` is ready to become the first authenticated browser consumer in
Phase 3, but the platform does not yet have a shared frontend observability
package that can initialize browser telemetry in one reusable way. We need to
define that contract now so page views, client errors, Web Vitals, and
frontend-to-backend correlation can be added without hardcoding Grafana
provider secrets or duplicating app-specific wiring.

## What Changes

- Create a reusable frontend observability runtime package contract for browser
  applications in this repository.
- Define one stable initialization path that accepts app, environment, release,
  and user-context labels together with provider-neutral ingest configuration
  hook points.
- Define shared hooks for page-view tracking, client-side error reporting, Web
  Vitals or equivalent UX signals, and protected-flow correlation metadata.
- Add an optional integration layer tailored to the current `frontend-web`
  stack so React bootstrap, router transitions, and shared state or request
  boundaries can adopt the runtime with minimal bespoke glue.
- Document the first-consumer integration expectations for `frontend-web` so
  Phase 3 consumption can happen without bespoke page-component wiring.

## Capabilities

### New Capabilities

- `frontend-observability-runtime`: Shared browser observability initialization,
  labeling, telemetry hooks, integration helpers, and correlation helpers for
  `frontend-web` and future frontend consumers.

### Modified Capabilities

- None.

## Impact

- Affects this repository's canonical OpenSpec behavior contract for the shared
  frontend observability package.
- Establishes the runtime and integration contract that `frontend-web` will
  consume in `P3-T03B`.
- Adds a thin optional adapter layer so the shared package fits the current
  React and React Router architecture without making the core runtime
  framework-specific.
- Introduces new browser-facing configuration expectations that must follow the
  platform `VITE_*` environment-variable strategy without storing provider
  secrets in git.
