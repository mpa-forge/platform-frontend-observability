# platform-frontend-observability

Shared frontend observability package repository for the platform blueprint.

## Current Scope

This repository hosts the shared frontend observability package for browser
applications in the platform blueprint.

The first deliverable is a reusable runtime plus optional React and
React Router helpers consumed first by `frontend-web`.

## Structure

- `src/`: shared package source, runtime helpers, and tests
- `docs/`: repo-specific documentation and integration notes
- `openspec/`: canonical repo behavior specs and archived change history

Primary package entrypoints:

- `@mpa-forge/platform-frontend-observability`: framework-agnostic runtime,
  config normalization, request correlation, and Web Vitals helpers
- `@mpa-forge/platform-frontend-observability/react`: optional React provider
  and hooks
- `@mpa-forge/platform-frontend-observability/react-router`: optional React
  Router page-view hook
- `@mpa-forge/platform-frontend-observability/frontend-web`: optional helpers
  tailored to the current `frontend-web` auth and protected-request boundaries

Published package contract:

- versioned npm package: `@mpa-forge/platform-frontend-observability`
- registry: `https://npm.pkg.github.com`
- built artifacts: `dist/`
- consumer auth: `GITHUB_PACKAGES_TOKEN`

## Toolchain

- GNU Make (or a compatible `make` implementation) and a bash-compatible shell
- Bun `1.3.11`
- Node.js `24.13.1`
- Version pin source: `.tool-versions` and `package.json`

## Setup

Before running bootstrap:

- Shared workspace requirement: keep `platform-blueprint-specs` checked out as a sibling directory if you want to use `make doctor`.
- Required: GNU Make (or a compatible `make` implementation) and a bash-compatible shell
- Recommended: `mise` or `asdf` for automatic tool installation from `.tool-versions`
- Fallback: manually install the pinned tool versions listed above

Run the setup commands from the repository root:

- Workstation checks: `make doctor`
- Bootstrap: `make bootstrap`

Bootstrap installs the pinned Bun dependencies and Python tooling for hooks.

## Build And Package

- Build the published artifact: `make build`
- Validate the packaged file set: `make package-check`
- The package publishes from `dist/` and exposes built subpath entrypoints for
  the core runtime, React helpers, React Router helpers, and `frontend-web`
  helpers.
- The repo commits `.npmrc` scope mapping for GitHub Packages. Publishing and
  install auth are provided through `GITHUB_PACKAGES_TOKEN`.

## Lint and Format

- Install git hooks: `make precommit-install`
- Run all pre-commit checks manually: `make precommit-run`
- Run repo lint checks: `make lint`
- Run repo tests: `make test`
- Run repo typecheck: `bun run typecheck`
- Apply formatting: `make format`
- Check formatting only: `make format-check`

Package integration notes:

- [docs/frontend-observability-runtime.md](docs/frontend-observability-runtime.md)
- [docs/frontend-package-release.md](docs/frontend-package-release.md)
- [docs/frontend-package-consumer-auth.md](docs/frontend-package-consumer-auth.md)

## Status

- GitHub repo created
- shared skills sync wired
- OpenSpec initialized
- `P3-T03A` runtime scaffold implemented and ready for `frontend-web`
  consumption work in `P3-T03B`
