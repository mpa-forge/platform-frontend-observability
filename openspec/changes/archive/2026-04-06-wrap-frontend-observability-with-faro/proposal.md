## Why

The current package defines the right platform-facing frontend observability
contract, but it is implemented as custom runtime logic that duplicates work
already handled well by Grafana Faro. Rebuilding the package around Faro now
lets the platform keep one stable consumer contract while shifting transport,
instrumentation, and browser telemetry execution onto a maintained SDK.

## What Changes

- Rework the shared frontend observability runtime so its implementation is
  backed by the Grafana Faro Web SDK instead of a custom telemetry engine.
- Preserve the package's stable platform-facing API and keep platform-owned
  normalization for environment, config, metadata, user context, and request
  correlation inside this package.
- Keep page-view, error, and Web Vitals reporting available through the shared
  runtime and adapters without requiring consuming apps to wire Faro directly.
- Align the `react`, `react-router`, and `frontend-web` adapters with the
  wrapper architecture so they remain convenience layers over the platform
  contract rather than Faro-specific setup helpers.
- Update repository docs, OpenSpec artifacts, and tests to describe and verify
  the Faro-backed wrapper behavior.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `frontend-observability-runtime`: Change the runtime contract to require a
  platform-owned wrapper implemented on top of Grafana Faro while preserving
  normalization, correlation helpers, and optional framework adapters for
  consumers such as `frontend-web`.

## Impact

- Affects the core runtime, framework adapters, tests, and observability docs
  in this repository.
- Adds a Grafana Faro Web SDK dependency and package/build updates needed to
  ship the wrapper cleanly.
- Impacts `frontend-web` integration expectations because the runtime remains
  the stable contract while its provider implementation changes underneath.
