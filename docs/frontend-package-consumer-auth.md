# Frontend Package Consumer Auth

This repo commits scoped registry configuration in `.npmrc` so Bun and npm know
that `@mpa-forge/*` packages are installed from GitHub Packages
(`https://npm.pkg.github.com`).

Secrets are not committed. Consumer auth is provided through the
`GITHUB_PACKAGES_TOKEN` environment variable at install time.

## Local Install

For local installs in PowerShell:

```powershell
$env:GITHUB_PACKAGES_TOKEN = (gh auth token).Trim()
bun add @mpa-forge/platform-frontend-observability@0.1.0
```

Requirements:

- the GitHub CLI account or personal access token must include `read:packages`
- the token must be able to read packages for the `mpa-forge` owner

## Frontend-Web Consumption Pattern

`frontend-web` should consume a released version from GitHub Packages instead of
following this repository by local file path. The shared entrypoints are:

- `@mpa-forge/platform-frontend-observability`
- `@mpa-forge/platform-frontend-observability/react`
- `@mpa-forge/platform-frontend-observability/react-router`
- `@mpa-forge/platform-frontend-observability/frontend-web`

That keeps the frontend package flow aligned with the existing
`@mpa-forge/platform-contracts-client` install pattern.

## CI Or Automation

For CI or automation:

- provide `GITHUB_PACKAGES_TOKEN` as a secret or environment variable
- run Bun or npm normally; the committed `.npmrc` will use that token
  automatically
