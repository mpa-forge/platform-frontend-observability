# Frontend Observability Runtime

This package provides a layered frontend observability contract for browser
applications:

- a framework-agnostic core runtime for configuration, telemetry events, and
  request correlation
- optional React and React Router helpers for app bootstrap and route tracking
- optional `frontend-web` helpers that fit the current auth and protected API
  client boundaries

Under the hood, enabled telemetry is implemented with the Grafana Faro Web SDK.
Applications still depend on this package's platform contract rather than
initializing Faro directly.

## Core Runtime

Use the core package entrypoint when you want a browser-safe runtime with no
framework lock-in:

```ts
import { createFrontendObservability } from "@mpa-forge/platform-frontend-observability";

const runtime = createFrontendObservability({
  app: {
    name: "frontend-web",
    environment: import.meta.env.VITE_APP_ENV,
    release: import.meta.env.VITE_APP_RELEASE ?? "dev",
  },
  enabled: import.meta.env.VITE_OBSERVABILITY_ENABLED === "true",
  ingest: {
    endpoint: import.meta.env.VITE_OBSERVABILITY_ENDPOINT,
    transport: "otlp_http",
  },
  emit: (event) => {
    console.info("frontend observability event", event);
  },
});
```

Notes:

- the runtime accepts only browser-safe config
- do not pass secrets, tokens, or prebuilt auth headers
- the wrapper does not expose or require Faro-specific bootstrap in app code
- mutable user context is updated after startup through runtime methods or the
  optional helpers below
- when an ingest endpoint is configured, the wrapper initializes Faro transport
  internally; when it is omitted, the runtime still behaves consistently and
  remains safe for local development and tests

## React Bootstrap

Wrap the app once so route and auth-related helpers can access the shared
runtime:

```tsx
import { FrontendObservabilityProvider } from "@mpa-forge/platform-frontend-observability/react";

<FrontendObservabilityProvider runtime={runtime}>
  <AppProviders>
    <AppRouter />
  </AppProviders>
</FrontendObservabilityProvider>;
```

## React Router Page Views

Track route changes from one router-owned module instead of feature-level page
components:

```tsx
import { useReactRouterPageViews } from "@mpa-forge/platform-frontend-observability/react-router";

export function FrontendObservabilityRouteTracker() {
  useReactRouterPageViews({
    getPageName: (location) => location.pathname,
  });

  return null;
}
```

Mount that tracker once inside the router tree so page views follow route
transitions automatically.

## Frontend-Web Helpers

The optional `frontend-web` helpers are designed for the current app structure:

- `buildFrontendWebUserContext`: map auth state to the shared user-context
  contract
- `syncFrontendWebUserContext`: push auth-driven user-context updates into the
  runtime
- `useFrontendWebUserContext`: React hook for the current auth provider shape
- `applyRequestCorrelationHeaders`: attach runtime-generated request headers to
  the protected API transport boundary

Example for the current protected request flow:

```ts
import { applyRequestCorrelationHeaders } from "@mpa-forge/platform-frontend-observability/frontend-web";

const requestContext = applyRequestCorrelationHeaders(req.header, runtime, {
  route: "/profile",
  routeTemplate: "/",
  operation: "get-current-user",
});
```

That keeps correlation-header construction out of feature modules while staying
provider-neutral.

## Wrapper Decisions

Current implementation decisions for the Faro-backed architecture:

- Faro surface area: the package does not expose the raw Faro client or ask
  consumer apps to import Faro setup primitives. Advanced provider behavior can
  be added later through new package-owned APIs if there is a proven need.
- Backend flexibility: the public contract stays provider-neutral, but the
  current implementation intentionally standardizes on Faro rather than carrying
  a second backend abstraction before another backend is needed.
- `frontend-web` contract impact: no consumer-facing contract change is
  required for the current adapters. Route tracking, auth-driven user-context
  sync, and request-correlation helpers continue to flow through the existing
  package entrypoints.

## Browser Config Contract

Recommended browser-exposed variables for the first consumer:

- required:
  - `VITE_APP_ENV`
  - release identifier value owned by the consumer app
- optional:
  - `VITE_OBSERVABILITY_ENABLED`
  - `VITE_OBSERVABILITY_ENDPOINT`
  - additional browser-safe dataset or transport hints

Do not commit or embed provider secrets in frontend code or `.env.example`.
The shared package intentionally does not accept header or token secrets in its
config contract, including Faro API keys.
