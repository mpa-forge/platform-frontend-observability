import { beforeEach, describe, expect, it, vi } from "vitest";

const faroMock = vi.hoisted(() => {
  const api = {
    pushEvent: vi.fn(),
    pushError: vi.fn(),
    pushMeasurement: vi.fn(),
    setUser: vi.fn(),
    resetUser: vi.fn(),
    setSession: vi.fn(),
    resetSession: vi.fn(),
    getSession: vi.fn(),
    setView: vi.fn(),
    getView: vi.fn(),
    setPage: vi.fn(),
    getPage: vi.fn(),
  };

  return {
    api,
    faro: {
      api,
      config: {} as never,
      instrumentations: {} as never,
      internalLogger: {} as never,
      metas: {} as never,
      pause: vi.fn(),
      transports: {} as never,
      unpatchedConsole: console as never,
      unpause: vi.fn(),
    },
    fetchTransportOptions: [] as Array<Record<string, unknown>>,
    initializeFaro: vi.fn(),
  };
});

vi.mock("@grafana/faro-web-sdk", () => {
  faroMock.initializeFaro.mockReturnValue(faroMock.faro);

  return {
    FetchTransport: class MockFetchTransport {
      constructor(options: Record<string, unknown>) {
        faroMock.fetchTransportOptions.push(options);
      }
    },
    initializeFaro: faroMock.initializeFaro,
  };
});

import {
  buildFaroErrorContext,
  buildFaroPageViewAttributes,
  buildFaroSession,
  buildFaroUser,
  buildFaroWebVitalPayload,
  createFaroClient,
} from "./faro-client";

describe("internal Faro client", () => {
  beforeEach(() => {
    faroMock.fetchTransportOptions.length = 0;
    Object.values(faroMock.api).forEach((mockFn) => mockFn.mockReset());
    faroMock.initializeFaro.mockReset();
    faroMock.initializeFaro.mockReturnValue(faroMock.faro);
  });

  it("maps platform user context into Faro user and session metadata", () => {
    expect(
      buildFaroUser({
        kind: "member",
        userId: "user-1",
        displayName: "Casey Example",
        isAuthenticated: true,
        attributes: {
          team: "platform",
        },
      }),
    ).toEqual({
      id: "user-1",
      fullName: "Casey Example",
      attributes: {
        team: "platform",
        kind: "member",
        is_authenticated: "true",
      },
    });

    expect(
      buildFaroSession({
        kind: "member",
        sessionId: "session-1",
        isAuthenticated: true,
      }),
    ).toEqual({
      id: "session-1",
      attributes: {
        kind: "member",
        is_authenticated: "true",
      },
    });
  });

  it("builds Faro attributes and contexts from normalized platform inputs", () => {
    expect(
      buildFaroPageViewAttributes(
        {
          path: "/profile",
          name: "Current User Profile",
          routeTemplate: "/users/:id",
          attributes: {
            feature_area: "account",
          },
        },
        {
          dataset: "frontend-web",
        },
      ),
    ).toEqual({
      dataset: "frontend-web",
      feature_area: "account",
      path: "/profile",
      page_name: "Current User Profile",
      route_template: "/users/:id",
    });

    expect(
      buildFaroErrorContext(
        {
          name: "Error",
          message: "boom",
          route: "/profile",
          routeTemplate: "/users/:id",
          attributes: {
            boundary: "root",
          },
        },
        {
          dataset: "frontend-web",
        },
      ),
    ).toEqual({
      dataset: "frontend-web",
      boundary: "root",
      route: "/profile",
      route_template: "/users/:id",
    });

    expect(
      buildFaroWebVitalPayload(
        {
          name: "LCP",
          value: 1200,
          delta: 50,
          id: "metric-1",
          rating: "good",
          navigationType: "navigate",
          attributes: {
            page_group: "profile",
          },
        },
        {
          dataset: "frontend-web",
        },
      ),
    ).toEqual({
      type: "LCP",
      values: {
        value: 1200,
        delta: 50,
      },
      context: {
        dataset: "frontend-web",
        page_group: "profile",
        id: "metric-1",
        rating: "good",
        navigation_type: "navigate",
      },
    });
  });

  it("initializes Faro behind the wrapper and translates runtime calls", () => {
    const client = createFaroClient(
      {
        app: {
          name: "frontend-web",
          environment: "rc",
          release: "2026.04.06",
        },
        ingest: {
          endpoint: "https://example.test/collect",
        },
        resourceAttributes: {
          dataset: "frontend-web",
        },
      },
      {
        kind: "member",
        userId: "user-1",
        sessionId: "session-1",
        displayName: "Casey Example",
        isAuthenticated: true,
      },
    );

    expect(faroMock.initializeFaro).toHaveBeenCalledWith(
      expect.objectContaining({
        app: {
          name: "frontend-web",
          environment: "rc",
          release: "2026.04.06",
          version: "2026.04.06",
        },
        instrumentations: [],
        isolate: true,
        preventGlobalExposure: true,
        sessionTracking: {
          enabled: false,
        },
        transports: expect.any(Array),
      }),
    );
    expect(faroMock.fetchTransportOptions).toEqual([
      {
        url: "https://example.test/collect",
      },
    ]);
    expect(faroMock.api.setUser).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "user-1",
        fullName: "Casey Example",
      }),
    );
    expect(faroMock.api.setSession).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "session-1",
      }),
    );

    client.trackPageView(
      {
        path: "/profile",
        name: "Current User Profile",
        routeTemplate: "/users/:id",
      },
      1000,
    );
    client.captureError(
      {
        name: "Error",
        message: "frontend exploded",
        route: "/profile",
      },
      2000,
    );
    client.reportWebVital(
      {
        name: "LCP",
        value: 1200,
        rating: "good",
      },
      3000,
    );
    client.setUserContext(null);

    expect(faroMock.api.setView).toHaveBeenCalledWith({
      name: "Current User Profile",
    });
    expect(faroMock.api.setPage).toHaveBeenCalledWith({
      id: "/users/:id",
      url: "/profile",
      attributes: {
        dataset: "frontend-web",
        path: "/profile",
        page_name: "Current User Profile",
        route_template: "/users/:id",
      },
    });
    expect(faroMock.api.pushEvent).toHaveBeenCalledWith(
      "page_view",
      {
        dataset: "frontend-web",
        path: "/profile",
        page_name: "Current User Profile",
        route_template: "/users/:id",
      },
      "platform_frontend_observability",
      { timestampOverwriteMs: 1000 },
    );
    expect(faroMock.api.pushError).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Error",
        message: "frontend exploded",
      }),
      {
        context: {
          dataset: "frontend-web",
          route: "/profile",
        },
        timestampOverwriteMs: 2000,
        type: "Error",
      },
    );
    expect(faroMock.api.pushMeasurement).toHaveBeenCalledWith(
      {
        type: "LCP",
        values: {
          value: 1200,
        },
        context: {
          dataset: "frontend-web",
          rating: "good",
        },
      },
      { timestampOverwriteMs: 3000 },
    );
    expect(faroMock.api.resetUser).toHaveBeenCalled();
    expect(faroMock.api.resetSession).toHaveBeenCalled();
  });
});
