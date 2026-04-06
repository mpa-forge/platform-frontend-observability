## 1. Package Distribution Setup

- [x] 1.1 Add a dedicated build configuration that emits publishable files into
      `dist/` and excludes tests.
- [x] 1.2 Update package metadata to publish built entrypoints, files, types,
      versioning, and GitHub Packages registry configuration.
- [x] 1.3 Add repo-local registry/auth configuration and package preparation
      scripts needed for a proper shared-package flow.

## 2. Consumer And Release Documentation

- [x] 2.1 Update README and package docs so maintainers understand how to
      build, validate, and release the package.
- [x] 2.2 Document the `frontend-web` consumer install/auth path using released
      package versions and `GITHUB_PACKAGES_TOKEN`.

## 3. Validation And Canonical Sync

- [x] 3.1 Add or update validation so package build, typecheck, tests, and a
      pack or publish dry run can be run repo-locally.
- [x] 3.2 Run repo checks plus the package distribution validation commands and
      fix any issues they surface.
- [x] 3.3 Archive the completed change so the canonical package-distribution
      spec is promoted under `openspec/specs/`.
