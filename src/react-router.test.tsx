// @vitest-environment jsdom

import { render } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { useEffect } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, useNavigate } from "react-router-dom";

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

import { FrontendObservabilityProvider } from "./react";
import { useReactRouterPageViews } from "./react-router";
import { createFrontendObservability } from "./runtime";

type TrackerProps = {
  nextPath?: string;
};

function Tracker({ nextPath }: TrackerProps) {
  useReactRouterPageViews();
  const navigate = useNavigate();

  useEffect(() => {
    if (!nextPath) {
      return;
    }

    navigate(nextPath);
  }, [navigate, nextPath]);

  return null;
}

describe("react-router adapter", () => {
  beforeEach(() => {
    faroClientMock.createFaroClient.mockClear();
    Object.values(faroClientMock.client).forEach((mockFn) =>
      mockFn.mockReset(),
    );
  });

  it("tracks route changes through the shared runtime", async () => {
    const emit = vi.fn();
    const runtime = createFrontendObservability({
      app: {
        name: "frontend-web",
        environment: "rc",
        release: "2026.04.06",
      },
      enabled: true,
      emit,
    });

    const wrapper = ({ children }: PropsWithChildren) => (
      <FrontendObservabilityProvider runtime={runtime}>
        <MemoryRouter initialEntries={["/"]}>{children}</MemoryRouter>
      </FrontendObservabilityProvider>
    );

    const { rerender } = render(<Tracker />, { wrapper });
    rerender(<Tracker nextPath="/profile?tab=security" />);

    expect(emit.mock.calls[0]?.[0]).toMatchObject({
      type: "page_view",
      page: { path: "/" },
    });
    expect(emit.mock.calls.at(-1)?.[0]).toMatchObject({
      type: "page_view",
      page: { path: "/profile?tab=security" },
    });
    expect(faroClientMock.client.trackPageView).toHaveBeenCalled();
  });
});
