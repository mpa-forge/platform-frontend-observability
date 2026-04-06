# Frontend Observability Runtime

This package provides a layered frontend observability contract for browser
applications:

- a framework-agnostic core runtime for configuration, telemetry events, and
  request correlation
- optional React and React Router helpers for app bootstrap and route tracking
- optional `frontend-web` helpers that fit the current auth and protected API
  client boundaries

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
- mutable user context is updated after startup through runtime methods or the
  optional helpers below

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
config contract.
