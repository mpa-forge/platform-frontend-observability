import { beforeEach, describe, expect, it, vi } from "vitest";

const faroClientMock = vi.hoisted(() => {
  const client = {
    setUserContext: vi.fn(),
    trackPageView: vi.fn(),
    captureError: vi.fn(),
    reportWebVital: vi.fn(),
  };

  return {
    client,
    createFaroClient: vi.fn(() => client),
  };
});

vi.mock("./internal/faro-client", () => ({
  createFaroClient: faroClientMock.createFaroClient,
}));

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
  beforeEach(() => {
    faroClientMock.createFaroClient.mockClear();
    Object.values(faroClientMock.client).forEach((mockFn) =>
      mockFn.mockReset(),
    );
  });

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
    expect(faroClientMock.createFaroClient).not.toHaveBeenCalled();
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
          apiKey: "secret",
        } as never,
      }),
    ).toThrow(/must not include browser-held secrets/i);
  });

  it("emits events and delegates normalized telemetry to the Faro wrapper", () => {
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
    runtime.clearUserContext();

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
    expect(faroClientMock.createFaroClient).toHaveBeenCalledWith(
      {
        app: {
          name: "frontend-web",
          environment: "rc",
          release: "2026.04.06",
        },
        ingest: undefined,
        resourceAttributes: undefined,
      },
      null,
    );
    expect(faroClientMock.client.setUserContext).toHaveBeenNthCalledWith(1, {
      kind: "member",
      userId: "user-1",
      displayName: "Casey Example",
      isAuthenticated: true,
    });
    expect(faroClientMock.client.trackPageView).toHaveBeenCalledWith(
      {
        path: "/profile",
        name: "Current User Profile",
        routeTemplate: "/",
        attributes: undefined,
        referrer: undefined,
        title: undefined,
      },
      expect.any(Number),
    );
    expect(faroClientMock.client.captureError).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Error",
        message: "frontend exploded",
        route: "/profile",
      }),
      expect.any(Number),
    );
    expect(faroClientMock.client.reportWebVital).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "LCP",
        rating: "good",
        value: 1200,
      }),
      expect.any(Number),
    );
    expect(faroClientMock.client.setUserContext).toHaveBeenNthCalledWith(
      2,
      null,
    );
    expect(requestContext.correlationId).toBe("req-123");
    expect(requestContext.headers).toMatchObject({
      [FRONTEND_OBSERVABILITY_HEADER_NAMES.correlationId]: "req-123",
      [FRONTEND_OBSERVABILITY_HEADER_NAMES.app]: "frontend-web",
      [FRONTEND_OBSERVABILITY_HEADER_NAMES.route]: "/profile",
      [FRONTEND_OBSERVABILITY_HEADER_NAMES.operation]: "get-current-user",
    });
  });

  it("normalizes resource attributes into runtime metadata", () => {
    const runtime = createFrontendObservability({
      app: {
        name: "frontend-web",
        environment: "rc",
        release: "2026.04.06",
      },
      enabled: true,
      ingest: {
        endpoint: " https://example.test/collect ",
        transport: " faro_fetch ",
        dataset: " frontend-web ",
        attributes: {
          region: " eu ",
          " ": "ignored",
        },
      },
    });

    expect(runtime.getMetadata()).toEqual({
      appName: "frontend-web",
      environment: "rc",
      release: "2026.04.06",
      enabled: true,
      ingestEndpoint: "https://example.test/collect",
      ingestTransport: "faro_fetch",
      ingestDataset: "frontend-web",
      resourceAttributes: {
        region: "eu",
      },
    });
    expect(faroClientMock.createFaroClient).toHaveBeenCalledWith(
      {
        app: {
          name: "frontend-web",
          environment: "rc",
          release: "2026.04.06",
        },
        ingest: {
          endpoint: "https://example.test/collect",
          transport: "faro_fetch",
          dataset: "frontend-web",
          attributes: {
            region: "eu",
          },
        },
        resourceAttributes: {
          region: "eu",
        },
      },
      null,
    );
  });
});
