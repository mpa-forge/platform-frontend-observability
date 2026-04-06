import { useEffect } from "react";

import { useMaybeFrontendObservabilityRuntime } from "./react";
import type {
  FrontendObservabilityRequestContextInput,
  FrontendObservabilityRuntime,
  FrontendObservabilityUserContext,
} from "./runtime";

export type FrontendWebAuthSnapshot = {
  isSignedIn: boolean;
  userId?: string | null;
  sessionId?: string | null;
  userDisplayName?: string | null;
};

type HeaderTarget = Headers | Pick<Headers, "set">;

function trimOptional(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function buildFrontendWebUserContext(
  authSnapshot: FrontendWebAuthSnapshot,
): FrontendObservabilityUserContext | null {
  if (!authSnapshot.isSignedIn) {
    return null;
  }

  return {
    kind: "member",
    isAuthenticated: true,
    userId: trimOptional(authSnapshot.userId),
    sessionId: trimOptional(authSnapshot.sessionId),
    displayName: trimOptional(authSnapshot.userDisplayName),
  };
}

export function syncFrontendWebUserContext(
  runtime: FrontendObservabilityRuntime,
  authSnapshot: FrontendWebAuthSnapshot,
) {
  const userContext = buildFrontendWebUserContext(authSnapshot);

  if (userContext) {
    runtime.setUserContext(userContext);
    return userContext;
  }

  runtime.clearUserContext();
  return null;
}

export function useFrontendWebUserContext(
  authSnapshot: FrontendWebAuthSnapshot,
  runtimeOverride?: FrontendObservabilityRuntime | null,
) {
  const contextualRuntime = useMaybeFrontendObservabilityRuntime();
  const runtime = runtimeOverride ?? contextualRuntime;

  useEffect(() => {
    if (!runtime) {
      return;
    }

    syncFrontendWebUserContext(runtime, authSnapshot);
  }, [authSnapshot, runtime]);
}

export function applyRequestCorrelationHeaders(
  headerTarget: HeaderTarget,
  runtime: FrontendObservabilityRuntime,
  input?: FrontendObservabilityRequestContextInput,
) {
  const requestContext = runtime.createRequestContext(input);

  for (const [name, value] of Object.entries(requestContext.headers)) {
    headerTarget.set(name, value);
  }

  return requestContext;
}
