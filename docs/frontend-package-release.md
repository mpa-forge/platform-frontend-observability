# Frontend Package Release

`@mpa-forge/platform-frontend-observability` is intended to be consumed as a
released GitHub Packages artifact rather than through a floating sibling-repo
workspace link.

## Package Contract

- package name: `@mpa-forge/platform-frontend-observability`
- registry: `https://npm.pkg.github.com`
- artifact root: `dist/`
- published entrypoints:
  - `@mpa-forge/platform-frontend-observability`
  - `@mpa-forge/platform-frontend-observability/react`
  - `@mpa-forge/platform-frontend-observability/react-router`
  - `@mpa-forge/platform-frontend-observability/frontend-web`

## Local Release Validation

Run these commands from the repository root before publishing:

```powershell
make lint
make test
bun run typecheck
make build
make package-check
```

`make package-check` builds the package and runs `npm pack --dry-run` so
maintainers can confirm the file set and package metadata without publishing.

## Publishing Auth

Publishing uses the committed `.npmrc` scope mapping together with
`GITHUB_PACKAGES_TOKEN`.

PowerShell example:

```powershell
$env:GITHUB_PACKAGES_TOKEN = (gh auth token).Trim()
npm publish
```

Requirements:

- the token needs GitHub Packages publish rights for the `mpa-forge` owner
- package versions should be bumped deliberately before publish
- maintainers should publish released versions, not ad hoc local snapshots

## Release Guidance

- treat the package version as the consumer contract for `frontend-web`
- publish from a reviewed `main` state rather than an unmerged branch
- keep imports stable across releases so `frontend-web` upgrades by version,
  not by path changes
