// @vitest-environment jsdom

import { renderHook } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { describe, expect, it } from "vitest";

import {
  applyRequestCorrelationHeaders,
  buildFrontendWebUserContext,
  syncFrontendWebUserContext,
  useFrontendWebUserContext,
} from "./frontend-web";
import { FrontendObservabilityProvider } from "./react";
import { createFrontendObservability } from "./runtime";

function createRuntime() {
  return createFrontendObservability({
    app: {
      name: "frontend-web",
      environment: "rc",
      release: "2026.04.06",
    },
    enabled: true,
    createId: () => "req-456",
  });
}

describe("frontend-web helpers", () => {
  it("builds and syncs user context from the current auth shape", () => {
    const runtime = createRuntime();
    const authSnapshot = {
      isSignedIn: true,
      userId: "user-1",
      sessionId: "session-1",
      userDisplayName: "Casey Example",
    };

    expect(buildFrontendWebUserContext(authSnapshot)).toMatchObject({
      kind: "member",
      userId: "user-1",
      sessionId: "session-1",
    });
    expect(syncFrontendWebUserContext(runtime, authSnapshot)).toMatchObject({
      displayName: "Casey Example",
    });
    expect(runtime.getUserContext()).toMatchObject({
      userId: "user-1",
      sessionId: "session-1",
    });
  });

  it("applies correlation headers to request boundaries", () => {
    const runtime = createRuntime();
    const headers = new Headers();

    const requestContext = applyRequestCorrelationHeaders(headers, runtime, {
      route: "/profile",
      operation: "get-current-user",
    });

    expect(requestContext.correlationId).toBe("req-456");
    expect(headers.get("x-platform-correlation-id")).toBe("req-456");
    expect(headers.get("x-platform-client-route")).toBe("/profile");
    expect(headers.get("x-platform-client-operation")).toBe("get-current-user");
  });

  it("syncs auth state through the React helper", () => {
    const runtime = createRuntime();
    const wrapper = ({ children }: PropsWithChildren) => (
      <FrontendObservabilityProvider runtime={runtime}>
        {children}
      </FrontendObservabilityProvider>
    );

    renderHook(
      () =>
        useFrontendWebUserContext({
          isSignedIn: true,
          userId: "user-1",
          userDisplayName: "Casey Example",
        }),
      { wrapper },
    );

    expect(runtime.getUserContext()).toMatchObject({
      userId: "user-1",
      displayName: "Casey Example",
    });
  });
});
