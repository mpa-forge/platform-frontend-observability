// @vitest-environment jsdom

import { renderHook } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { describe, expect, it } from "vitest";

import {
  FrontendObservabilityProvider,
  useFrontendObservabilityRuntime,
  useFrontendObservabilityUserContext,
} from "./react";
import { createFrontendObservability } from "./runtime";

function createRuntime() {
  return createFrontendObservability({
    app: {
      name: "frontend-web",
      environment: "rc",
      release: "2026.04.06",
    },
    enabled: true,
  });
}

describe("react adapter", () => {
  it("provides the runtime through context and syncs user context", () => {
    const runtime = createRuntime();
    const wrapper = ({ children }: PropsWithChildren) => (
      <FrontendObservabilityProvider runtime={runtime}>
        {children}
      </FrontendObservabilityProvider>
    );

    const { result } = renderHook(
      () => {
        useFrontendObservabilityUserContext({
          kind: "member",
          userId: "user-1",
          displayName: "Casey Example",
        });

        return useFrontendObservabilityRuntime();
      },
      { wrapper },
    );

    expect(result.current).toBe(runtime);
    expect(runtime.getUserContext()).toMatchObject({
      userId: "user-1",
      displayName: "Casey Example",
    });
  });
});
