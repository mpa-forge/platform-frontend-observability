## Context

`P3-T03A` introduces a new repository whose first job is to give browser
applications one reusable observability initialization path before `frontend-web`
starts emitting Phase 3 telemetry. The current repo is only a Bun/TypeScript
package scaffold, while `frontend-web` already has an authenticated shell,
router-owned boundaries, and a protected API client path that will need
frontend-to-backend correlation metadata in `P3-T03B`.

The package has to stay browser-safe. Browser apps can use public runtime
configuration and release metadata, but they cannot depend on Grafana ingest
secrets being embedded in the app bundle. The design therefore needs to define
one stable initialization contract, shared labeling rules, and explicit hook
points for page views, client-side errors, Web Vitals, and protected-request
correlation without hardcoding a provider-specific SDK strategy into consumer
code. Because the first consumer is already known, the package should also add
an optional layer that fits `frontend-web`'s React bootstrap, React Router
navigation, and shared auth/query request boundaries.

## Goals / Non-Goals

**Goals:**

- Create a reusable TypeScript package baseline for browser observability in
  this repository.
- Define one stable initialization API that accepts app identity, environment,
  release, enablement, and public-safe ingest configuration inputs.
- Expose a runtime handle for page-view tracking, client-error capture, Web
  Vitals reporting, and protected API correlation helpers.
- Keep the package framework-friendly for `frontend-web` without making the
  runtime React-only.
- Add optional React-, router-, and frontend-web-friendly helpers above the
  core runtime so the first consumer can adopt it with less bespoke glue.
- Document the consumer contract that `frontend-web` will adopt in `P3-T03B`.

**Non-Goals:**

- Final provider-specific browser export implementation or secret delivery.
- Automatic router monkey-patching or global framework instrumentation for
  every frontend stack.
- A broad abstraction layer for every possible state manager or frontend
  framework before there is a concrete consumer need.
- Dashboard, alert, or Grafana Cloud provisioning work covered elsewhere in
  Phase 3.
- Direct changes in `frontend-web` as part of this change.

## Decisions

### Use a layered package: framework-agnostic core plus optional frontend-web adapters

The package will keep a small framework-agnostic browser runtime as the
canonical contract and place React-, router-, and state-boundary-friendly
helpers in an optional adapter layer. This lets `frontend-web` integrate
quickly now without forcing the core API to become React-only.

Alternatives considered:

- Keep the entire package framework-agnostic and leave all integration glue to
  `frontend-web`.
  Rejected because it would make the first consumer repeat wiring that the
  shared package already understands.
- Make the whole package React-specific from the start.
  Rejected because it would narrow the reusable surface too early.

### Use one framework-agnostic browser runtime with an explicit initialization entrypoint

The package will center on one exported initialization path that creates a
browser observability runtime from typed config. That keeps React, router, and
consumer-specific state outside the core package surface while still giving
`frontend-web` one stable bootstrap call.

Alternatives considered:

- Build a React-only provider/hook package first.
  Rejected because the repo is meant to serve browser apps generally; React
  helpers belong in the optional adapter layer instead of the core contract.

### Keep provider wiring behind public-safe config and adapter hooks

The runtime will accept public-safe configuration such as app/environment/release
labels, an enabled flag, optional ingest endpoint metadata, and adapter hooks
for actual emission. It will not require committed secrets, prebuilt auth
headers, or direct provider SDK objects in consumer code.

Alternatives considered:

- Hardcode Grafana-specific browser wiring in the shared package.
  Rejected because the browser cannot safely hold provider secrets and Phase 3
  only requires ingest-config hook points at this stage.

### Separate stable context labels from mutable user context

App name, environment, and release are stable bootstrap inputs. User context is
mutable and should be applied through a runtime update method so authenticated
flows can enrich later telemetry without rebuilding the runtime.

Alternatives considered:

- Pass all user context only at startup.
  Rejected because authenticated state in `frontend-web` is not fixed at initial
  app boot and later sign-in/sign-out transitions would become awkward.

### Expose explicit hook methods instead of automatic global capture

The first version of the package will expose clear methods for page views,
client-side errors, and Web Vitals reporting. Consumers stay responsible for
calling those hooks from router boundaries, error boundaries, or performance
observers.

Alternatives considered:

- Install automatic listeners for router transitions and window errors inside
  the shared package.
  Rejected because that would couple the package to framework/runtime details
  too early and make tests less deterministic.

### Add opt-in helpers for React bootstrap, router transitions, and request boundaries

The adapter layer will expose focused helpers for mounting the runtime in React
app bootstrap, translating React Router navigation into page-view events, and
updating user-context or outbound request metadata from the shared frontend-web
boundaries. These helpers stay thin and optional so other consumers can ignore
them.

Alternatives considered:

- Create one large wrapper that owns React, router, auth, and query behavior.
  Rejected because it would overfit the first app and become hard to evolve.
- Avoid adapter helpers entirely.
  Rejected because the current frontend-web architecture is already known, and
  supporting it directly is part of the value of this shared package.

### Model correlation as outbound request metadata, not provider-specific tracing objects

The runtime will provide correlation helpers that return request metadata
headers or equivalent transport-ready context for protected frontend flows.
`frontend-web` can attach that metadata in its protected API client layer
without importing observability-provider internals there.

Alternatives considered:

- Have consumers construct correlation headers manually for each request.
  Rejected because correlation consistency is one of the main reuse goals of the
  shared package.

## Risks / Trade-offs

- [A minimal scaffold may feel too manual for consumers] -> Provide explicit
  runtime methods, adapter helpers, and integration docs for `frontend-web` so
  the first consumer wiring stays straightforward.
- [Browser export transport may change once provider delivery is finalized] ->
  Keep the runtime contract centered on public-safe config and adapter hooks so
  transport details can evolve without breaking consumer call sites.
- [User-context labels can drift into high-cardinality misuse] -> Keep the
  stable app/environment/release contract separate from mutable user context and
  document safe usage boundaries in the implementation docs.
- [Correlation semantics could diverge from backend expectations] -> Keep the
  helper contract header-based and validate it against the protected API client
  integration during `P3-T03B`.
- [frontend-web helpers become too coupled to the current app structure] ->
  Keep the adapter layer thin and centered on stable boundaries like React
  bootstrap, route changes, and request metadata instead of feature-specific
  stores.

## Migration Plan

1. Add the OpenSpec capability and canonical docs for the shared browser
   runtime contract.
2. Implement the TypeScript package entrypoint, config types, disabled-mode
   runtime, and no-op-safe telemetry methods.
3. Add correlation helper utilities and browser hook surfaces for page views,
   errors, and Web Vitals.
4. Add optional React, React Router, and request-boundary helpers above the
   core runtime for the current `frontend-web` architecture.
5. Document the consumer integration path for `frontend-web`, including the
   expected browser-exposed configuration shape and how the adapter layer is
   meant to be used.
6. Validate compile, formatting, and repo-local checks before `P3-T03B`
   consumes the package.

## Open Questions

- None blocking the scaffold. Provider-specific export delivery remains an
  implementation detail behind the package contract.
