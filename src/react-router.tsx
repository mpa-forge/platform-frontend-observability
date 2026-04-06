import { useEffect, useRef } from "react";
import type { Location } from "react-router-dom";
import { useLocation } from "react-router-dom";

import type {
  FrontendObservabilityAttributes,
  FrontendObservabilityPageViewInput,
  FrontendObservabilityRuntime,
} from "./runtime";
import { useMaybeFrontendObservabilityRuntime } from "./react";

export type ReactRouterPageViewOptions = {
  runtime?: FrontendObservabilityRuntime | null;
  includeHash?: boolean;
  includeSearch?: boolean;
  getPageName?: (location: Location) => string | undefined;
  getAttributes?: (
    location: Location,
  ) => FrontendObservabilityAttributes | undefined;
};

function buildPathFromLocation(
  location: Location,
  includeSearch = true,
  includeHash = false,
) {
  const pathParts = [location.pathname];

  if (includeSearch && location.search) {
    pathParts.push(location.search);
  }

  if (includeHash && location.hash) {
    pathParts.push(location.hash);
  }

  return pathParts.join("");
}

export function buildReactRouterPageView(
  location: Location,
  options: Omit<ReactRouterPageViewOptions, "runtime"> = {},
): FrontendObservabilityPageViewInput {
  return {
    path: buildPathFromLocation(
      location,
      options.includeSearch ?? true,
      options.includeHash ?? false,
    ),
    name: options.getPageName?.(location),
    title: typeof document === "undefined" ? undefined : document.title,
    attributes: options.getAttributes?.(location),
  };
}

export function useReactRouterPageViews(
  options: ReactRouterPageViewOptions = {},
) {
  const contextualRuntime = useMaybeFrontendObservabilityRuntime();
  const runtime = options.runtime ?? contextualRuntime;
  const location = useLocation();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!runtime) {
      throw new Error(
        "React Router page-view tracking requires a frontend observability runtime.",
      );
    }

    const pageView = buildReactRouterPageView(location, options);
    if (lastPathRef.current === pageView.path) {
      return;
    }

    lastPathRef.current = pageView.path;
    runtime.trackPageView(pageView);
  }, [
    runtime,
    location,
    options.includeHash,
    options.includeSearch,
    options.getAttributes,
    options.getPageName,
  ]);
}
