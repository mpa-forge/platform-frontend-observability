## ADDED Requirements

### Requirement: The frontend observability package builds published artifacts from `dist/`

`@mpa-forge/platform-frontend-observability` SHALL provide a repo-local build
entrypoint that emits the published package surface into `dist/` as JavaScript
and declaration files, and that build MUST exclude test-only files from the
artifact.

#### Scenario: Maintainer builds the package for publication

- **WHEN** a maintainer runs the documented package build command
- **THEN** the repository emits compiled runtime files and type declarations
  into `dist/`
- **AND** the published artifact does not depend on downstream repos compiling
  this repository's test files

### Requirement: Published package metadata exposes stable built entrypoints

The package metadata SHALL publish the core runtime and the `react`,
`react-router`, and `frontend-web` helper subpaths from built files rather than
from raw source paths.

#### Scenario: Consumer imports the shared runtime package by released version

- **WHEN** `frontend-web` or another consumer installs a released package
  version
- **THEN** it can import the documented entrypoints through the package export
  map without referencing repository-local source files

### Requirement: Package publishing uses GitHub Packages and documented token auth

The package MUST define GitHub Packages as its npm publish destination and MUST
document the `GITHUB_PACKAGES_TOKEN` auth/bootstrap pattern used by Bun or npm
consumers under the `@mpa-forge` scope.

#### Scenario: Maintainer prepares the package for GitHub Packages publishing

- **WHEN** a maintainer reviews the package metadata and registry config
- **THEN** the publish destination is `https://npm.pkg.github.com`
- **AND** the documented consumer or maintainer auth flow uses
  `GITHUB_PACKAGES_TOKEN` rather than committed credentials

### Requirement: Package validation proves the release artifact is pack-ready

The repository SHALL provide a validation path that confirms the build output,
metadata, and packaged file set are ready for a released shared-package flow.

#### Scenario: Maintainer runs package distribution validation

- **WHEN** a maintainer runs the documented validation commands for package
  distribution
- **THEN** the repository verifies the build succeeds
- **AND** a pack or publish dry run confirms the expected files and metadata are
  ready for release
