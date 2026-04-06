import { describe, expect, it, vi } from "vitest";

import {
  FRONTEND_OBSERVABILITY_HEADER_NAMES,
  createFrontendObservability,
  normalizeFrontendObservabilityConfig,
} from "./runtime";

function createTestRuntime() {
  const emit = vi.fn();

  return {
    emit,
    runtime: createFrontendObservability({
      app: {
        name: "frontend-web",
        environment: "rc",
        release: "2026.04.06",
      },
      enabled: true,
      emit,
      createId: () => "req-123",
    }),
  };
}

describe("frontend observability runtime", () => {
  it("returns a safe no-op runtime when disabled", () => {
    const runtime = createFrontendObservability({
      app: {
        name: "frontend-web",
        environment: "local",
        release: "dev",
      },
    });

    runtime.trackPageView({ path: "/" });
    const captured = runtime.captureError({ error: new Error("boom") });
    runtime.reportWebVital({ name: "LCP", value: 1200 });

    expect(runtime.isEnabled).toBe(false);
    expect(runtime.getMetadata()).toMatchObject({
      appName: "frontend-web",
      environment: "local",
      release: "dev",
      enabled: false,
    });
    expect(captured.message).toBe("boom");
    expect(
      runtime.createRequestContext({ route: "/profile" }).headers[
        FRONTEND_OBSERVABILITY_HEADER_NAMES.route
      ],
    ).toBe("/profile");
  });

  it("normalizes config and rejects browser-held ingest secrets", () => {
    expect(() =>
      normalizeFrontendObservabilityConfig({
        app: {
          name: "frontend-web",
          environment: "rc",
          release: "2026.04.06",
        },
        ingest: {
          endpoint: "https://example.test",
          headers: { Authorization: "secret" },
        } as never,
      }),
    ).toThrow(/must not include browser-held secrets/i);
  });

  it("emits page views, errors, web vitals, and request correlation metadata", () => {
    const { emit, runtime } = createTestRuntime();

    runtime.setUserContext({
      kind: "member",
      userId: "user-1",
      displayName: "Casey Example",
      isAuthenticated: true,
    });

    runtime.trackPageView({
      path: "/profile",
      name: "Current User Profile",
      routeTemplate: "/",
    });
    runtime.captureError({
      error: new Error("frontend exploded"),
      route: "/profile",
    });
    runtime.reportWebVital({
      name: "LCP",
      value: 1200,
      rating: "good",
    });

    const requestContext = runtime.createRequestContext({
      route: "/profile",
      routeTemplate: "/",
      operation: "get-current-user",
    });

    expect(emit).toHaveBeenCalledTimes(3);
    expect(emit.mock.calls[0]?.[0]).toMatchObject({
      type: "page_view",
      metadata: {
        appName: "frontend-web",
        environment: "rc",
        release: "2026.04.06",
      },
      userContext: {
        userId: "user-1",
        displayName: "Casey Example",
      },
    });
    expect(requestContext.correlationId).toBe("req-123");
    expect(requestContext.headers).toMatchObject({
      [FRONTEND_OBSERVABILITY_HEADER_NAMES.correlationId]: "req-123",
      [FRONTEND_OBSERVABILITY_HEADER_NAMES.app]: "frontend-web",
      [FRONTEND_OBSERVABILITY_HEADER_NAMES.route]: "/profile",
      [FRONTEND_OBSERVABILITY_HEADER_NAMES.operation]: "get-current-user",
    });
  });
});
