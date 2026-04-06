## Context

The package already defines a useful platform-facing frontend observability
contract: browser-safe initialization, normalized metadata, mutable user
context, page-view and error hooks, Web Vitals reporting, request-correlation
helpers, and optional `react`, `react-router`, and `frontend-web` adapters.
The current implementation, however, builds its own event pipeline instead of
delegating telemetry execution to a maintained browser SDK.

Grafana Faro is a better fit for the execution layer because it already solves
browser-side collection, transport, instrumentation, and provider integration.
The design challenge is to adopt Faro without making consuming applications
couple themselves to Faro setup details or weakening the package's existing
platform contract for `frontend-web` and future browser consumers.

## Goals / Non-Goals

**Goals:**

- Keep `@mpa-forge/platform-frontend-observability` as the stable
  platform-facing contract that browser apps import.
- Re-implement the runtime on top of Grafana Faro while preserving
  platform-owned normalization for config, metadata, user context, and request
  correlation.
- Keep framework adapters as platform helpers that talk to the wrapper, not as
  thin pass-throughs that make application code understand Faro.
- Update docs and tests so the Faro-backed architecture is explicit and
  verifiable.

**Non-Goals:**

- Expose the full Grafana Faro SDK surface through this package in the first
  migration.
- Add support for a second observability backend in the same implementation
  pass.
- Redesign `frontend-web` feature-level telemetry flows beyond the adapter and
  request-boundary integration points already defined by the package.

## Decisions

### Decision: Keep a platform-owned runtime facade and move Faro behind it

The package will continue to expose `createFrontendObservability` and the
existing runtime-oriented surface as the primary consumer entrypoint. Internally
that runtime will initialize and hold a Faro client instance, but consumer code
will keep calling package-owned methods for page views, error capture, Web
Vitals reporting, user-context updates, and request-correlation generation.

Rationale:

- Preserves the platform contract already documented in OpenSpec and repo docs.
- Lets the package enforce browser-safe config and normalization before data is
  sent to Faro.
- Keeps `frontend-web` integration stable while changing the engine underneath.

Alternatives considered:

- Re-export Faro directly and move normalization into consumer apps. Rejected
  because it leaks provider setup into `frontend-web` and weakens the shared
  contract.
- Maintain both the custom engine and Faro behind a pluggable backend
  abstraction in this change. Rejected for now because it adds complexity before
  the first provider-backed implementation has stabilized.

### Decision: Treat normalization as platform logic, not provider configuration

Environment/config normalization, metadata/resource normalization, user-context
normalization, and correlation-header conventions will remain package-owned.
The wrapper will translate that normalized contract into Faro initialization
options, event metadata, and user/session context fields.

Rationale:

- Preserves consistent frontend telemetry semantics even if Faro field names or
  plugin setup changes later.
- Keeps tests focused on platform outcomes instead of Faro internals.
- Maintains provider-neutral request correlation behavior for consumers.

Alternatives considered:

- Let consumers pass raw Faro config and labels through the wrapper. Rejected
  because it makes the package a trivial re-export and turns platform
  conventions into optional guidance.

### Decision: Keep adapters wrapper-first and Faro-hidden

The `react`, `react-router`, and `frontend-web` entrypoints will continue to
bind to the wrapper runtime rather than expose Faro providers, hooks, or router
plugins directly. Any Faro-specific integration needed for router events,
error capture, or Web Vitals will be encapsulated inside the package or behind
package-owned helper APIs.

Rationale:

- Keeps app bootstrap and route tracking ergonomics consistent for
  `frontend-web`.
- Prevents app code from taking a direct dependency on Faro concepts that would
  be hard to change later.
- Makes future stack-specific adapters possible without splitting the core
  contract.

Alternatives considered:

- Expose Faro providers for React consumers. Rejected because it shifts too much
  provider knowledge into consuming app code for little platform benefit.

### Decision: Preserve the current public contract unless a proven Faro gap

requires a change

This migration will default to keeping the current runtime types and helper
entrypoints stable. Contract changes will only be introduced if Faro makes an
existing guarantee impossible or materially misleading, and any such change must
be called out for `frontend-web`.

Rationale:

- Minimizes consumer migration cost.
- Keeps the change focused on implementation architecture instead of an API
  redesign.
- Makes it easier to validate behavior parity with existing tests and OpenSpec
  scenarios.

Alternatives considered:

- Use the migration to redesign the package API around Faro terminology.
  Rejected because it increases adoption cost and breaks the abstraction goal.

## Risks / Trade-offs

- [Faro capability mismatch] -> Some existing runtime hooks may not map 1:1 to
  Faro primitives. Mitigation: keep a translation layer in the wrapper and
  document any unavoidable contract adjustments before implementation lands.
- [Leaky abstraction] -> Adapter or bootstrap code could start exposing Faro
  concepts to consumers. Mitigation: keep public APIs wrapper-first and gate new
  exports behind explicit design review.
- [Future backend flexibility] -> Choosing Faro as the execution engine may make
  later non-Faro support harder if internal types become too provider-shaped.
  Mitigation: keep normalized platform contracts as the public boundary and
  isolate Faro-specific mapping in internal modules.
- [frontend-web behavior drift] -> Route, error, or auth-context wiring may
  change subtly if the wrapper delegates too much to Faro defaults. Mitigation:
  update adapter tests to assert platform behavior rather than SDK internals.

## Migration Plan

1. Add Grafana Faro as a package dependency and introduce internal modules that
   create and manage the Faro client.
2. Refactor the core runtime so public initialization and runtime methods remain
   package-owned while delegating telemetry delivery to Faro.
3. Update `react`, `react-router`, and `frontend-web` helpers to keep the same
   wrapper-based ergonomics over the Faro-backed runtime.
4. Refresh docs and specs so the package is described as a platform wrapper on
   top of Faro rather than a custom engine.
5. Expand tests around normalization, wrapper translation, disabled mode, and
   adapter behavior to guard the contract.

Rollback strategy:

- If the Faro-backed wrapper fails validation or creates integration regressions,
  revert the change and keep the current custom runtime until the contract gaps
  are addressed in design.

## Open Questions

- How much of the Faro surface area, if any, should be exposed directly for
  advanced consumers without weakening the platform abstraction?
- Should the internal design leave a deliberate extension point for non-Faro
  backends later, or is Faro the sole supported engine until a new change says
  otherwise?
- Does `frontend-web` need any contract adjustments for route metadata, error
  mapping, or user-context timing once Faro becomes the engine, or can the
  existing consumer-facing API remain unchanged?
