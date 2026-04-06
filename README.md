# platform-frontend-observability

Shared frontend observability package repository for the platform blueprint.

## Current Scope

This repository is bootstrapped and ready for the `P3-T03A` package work, but
that implementation has not started yet.

The intended first deliverable is a reusable frontend observability package or
module for browser applications, consumed first by `frontend-web`.

## Structure

- `src/`: future package source
- `docs/`: repo-specific documentation and design notes
- `openspec/`: canonical repo behavior specs and archived change history

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

## Lint and Format

- Install git hooks: `make precommit-install`
- Run all pre-commit checks manually: `make precommit-run`
- Run repo lint checks: `make lint`
- Run repo tests: `make test`
- Apply formatting: `make format`
- Check formatting only: `make format-check`

## Status

- GitHub repo created
- shared skills sync wired
- OpenSpec initialized
- implementation deferred until `P3-T03A`
