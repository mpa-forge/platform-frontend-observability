## Why

The frontend observability runtime now exists, but `frontend-web` cannot depend
on it through the platform's normal shared-package flow because this repository
still behaves like a source-only local package. We need to make it publishable
now so `frontend-web` can install a released GitHub Packages version instead of
depending on unpublished workspace state.

## What Changes

- Add a real package build that emits publishable JavaScript and type
  declarations under `dist/`.
- Define stable published package metadata and subpath exports for the core,
  React, React Router, and `frontend-web` helper entrypoints.
- Add GitHub Packages publish metadata and consumer auth/bootstrap guidance
  consistent with the existing `@mpa-forge/*` package flow.
- Document the release-ready install and validation expectations for the first
  consumer in `frontend-web`.

## Capabilities

### New Capabilities

- `frontend-observability-package-distribution`: Publishable package build,
  export, registry, and consumer-install contract for
  `@mpa-forge/platform-frontend-observability`.

### Modified Capabilities

- None.

## Impact

- Affects this repository's package metadata, build tooling, docs, and release
  readiness.
- Gives `frontend-web` a proper GitHub Packages dependency target instead of a
  local-only source layout.
- Aligns this repo's shared-package flow with the established
  `@mpa-forge/platform-contracts-client` consumer pattern.
