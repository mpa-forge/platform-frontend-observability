## Context

`platform-frontend-observability` already contains the shared runtime and the
optional `frontend-web` adapters, but the current package metadata still points
directly at source files and marks the package as private. That is enough for
local development inside this repo, but it is not a safe or repeatable contract
for `frontend-web`, which already consumes shared packages from GitHub Packages
through committed `.npmrc` scope mapping and `GITHUB_PACKAGES_TOKEN`.

This change needs to turn the repository into a proper shared package without
changing the runtime surface itself. The result should look like a normal npm
artifact: built files in `dist/`, stable export paths, publish metadata for
GitHub Packages, and consumer documentation that tells `frontend-web` exactly
how to install a released version.

## Goals / Non-Goals

**Goals:**

- Add a deterministic build that emits JavaScript and declaration files for the
  package entrypoints.
- Publish from built artifacts rather than raw `src/` files.
- Define stable npm metadata and GitHub Packages publish configuration.
- Document the install/auth flow so `frontend-web` can adopt the package by
  released version.
- Add a validation step that proves the package can be packed or prepared for
  publication cleanly.

**Non-Goals:**

- Actual `frontend-web` consumption work in this change.
- Automatic release tagging or a full CI publish workflow.
- New runtime behavior beyond what the current package already exposes.
- Broad multi-repo rollout beyond the consumer guidance needed for the first
  released package.

## Decisions

### Build to `dist/` with a package-focused TypeScript build config

The package will emit compiled JavaScript and `.d.ts` files into `dist/` using
an explicit build config that excludes tests and keeps the published surface
small. This matches how shared TypeScript package consumers expect to install
artifacts and avoids depending on TypeScript source transpilation in downstream
repos.

Alternatives considered:

- Publish raw source files directly.
  Rejected because downstream repos should not have to interpret this repo's
  source layout or compiler settings.

### Export stable subpaths from built files only

The package metadata will expose `.` plus the existing `react`,
`react-router`, and `frontend-web` subpaths from `dist/` rather than from
`src/`. This preserves the runtime API shape while making the published package
safe to consume as a normal artifact.

Alternatives considered:

- Collapse everything into one entrypoint.
  Rejected because the current layered API intentionally separates optional
  helpers from the core runtime.

### Mirror the established GitHub Packages contract used by other `@mpa-forge/*` packages

The repo will adopt the same consumer-facing package flow already used by
`platform-contracts-client`: committed `.npmrc` scope mapping, `publishConfig`
pointing at `https://npm.pkg.github.com`, and auth driven by
`GITHUB_PACKAGES_TOKEN`.

Alternatives considered:

- Use a different registry or a repo-specific auth pattern.
  Rejected because `frontend-web` already has a working shared-package consumer
  flow that we should reuse.

### Add package preparation validation, not a full publish automation workflow

This change will add a build plus a pack-ready validation step such as
`npm pack --dry-run` so maintainers can confirm the artifact shape locally. The
actual tagged release and publish ceremony can remain a deliberate follow-up
step after the package contract is stable.

Alternatives considered:

- Add full automated publishing immediately.
  Rejected because the immediate blocker is package readiness, not end-to-end
  release automation.

## Risks / Trade-offs

- [Build output accidentally includes tests or non-runtime files] ->
  Use a dedicated build config and package `files` whitelist centered on
  `dist/` plus documentation.
- [Published subpath exports drift from the runtime surface] -> Keep the export
  map aligned to the existing entrypoint structure and validate through build
  output.
- [Consumers try to install floating unpublished state] -> Document released
  version installs explicitly and keep the package ready for GitHub Packages.
- [Publish auth becomes confusing for maintainers] -> Mirror the same
  `.npmrc` and `GITHUB_PACKAGES_TOKEN` contract already documented for
  `frontend-web`.

## Migration Plan

1. Add the OpenSpec distribution capability.
2. Add build configuration, package metadata, and registry configuration for a
   publishable artifact.
3. Update README and package docs with release-ready consumer guidance.
4. Validate build, tests, formatting, and a package pack/publish dry run.
5. Archive the change so the canonical distribution spec is promoted.

## Open Questions

- None blocking this change. CI-driven release automation can follow once the
  package contract is proven locally.
