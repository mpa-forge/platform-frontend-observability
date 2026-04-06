import type { PropsWithChildren } from "react";
import { createContext, useContext, useEffect } from "react";

import type {
  FrontendObservabilityRuntime,
  FrontendObservabilityUserContext,
} from "./runtime";

const FrontendObservabilityContext =
  createContext<FrontendObservabilityRuntime | null>(null);

export type FrontendObservabilityProviderProps = PropsWithChildren<{
  runtime: FrontendObservabilityRuntime;
}>;

export function FrontendObservabilityProvider({
  children,
  runtime,
}: FrontendObservabilityProviderProps) {
  return (
    <FrontendObservabilityContext.Provider value={runtime}>
      {children}
    </FrontendObservabilityContext.Provider>
  );
}

export function useMaybeFrontendObservabilityRuntime() {
  return useContext(FrontendObservabilityContext);
}

export function useFrontendObservabilityRuntime() {
  const runtime = useMaybeFrontendObservabilityRuntime();

  if (!runtime) {
    throw new Error(
      "Frontend observability runtime is missing. Wrap the tree in FrontendObservabilityProvider or pass runtime explicitly.",
    );
  }

  return runtime;
}

export function useFrontendObservabilityUserContext(
  userContext: FrontendObservabilityUserContext | null,
  runtimeOverride?: FrontendObservabilityRuntime | null,
) {
  const contextualRuntime = useMaybeFrontendObservabilityRuntime();
  const runtime = runtimeOverride ?? contextualRuntime;

  useEffect(() => {
    if (!runtime) {
      return;
    }

    if (userContext) {
      runtime.setUserContext(userContext);
      return;
    }

    runtime.clearUserContext();
  }, [runtime, userContext]);
}
