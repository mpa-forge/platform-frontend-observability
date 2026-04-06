import {
  FetchTransport,
  initializeFaro,
  type BrowserConfig,
  type Faro,
  type MetaSession,
  type MetaUser,
} from "@grafana/faro-web-sdk";

import type {
  FrontendObservabilityAppIdentity,
  FrontendObservabilityAttributes,
  FrontendObservabilityCapturedError,
  FrontendObservabilityIngestConfig,
  FrontendObservabilityPageViewInput,
  FrontendObservabilityUserContext,
  FrontendObservabilityWebVitalMetric,
} from "../runtime";

const FRONTEND_OBSERVABILITY_FARO_DOMAIN = "platform_frontend_observability";

export type FrontendObservabilityFaroConfig = {
  app: FrontendObservabilityAppIdentity;
  ingest?: FrontendObservabilityIngestConfig;
  resourceAttributes?: FrontendObservabilityAttributes;
};

export type FrontendObservabilityFaroClient = {
  setUserContext(userContext: FrontendObservabilityUserContext | null): void;
  trackPageView(
    pageView: FrontendObservabilityPageViewInput,
    timestampMs: number,
  ): void;
  captureError(
    error: FrontendObservabilityCapturedError,
    timestampMs: number,
  ): void;
  reportWebVital(
    metric: FrontendObservabilityWebVitalMetric,
    timestampMs: number,
  ): void;
};

function mergeAttributes(
  ...sources: Array<FrontendObservabilityAttributes | undefined>
) {
  const mergedEntries = sources.flatMap((source) =>
    Object.entries(source ?? {}).filter(([, value]) => value.length > 0),
  );

  if (mergedEntries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(mergedEntries);
}

function stringifyBoolean(value: boolean | undefined) {
  if (value === undefined) {
    return undefined;
  }

  return value ? "true" : "false";
}

function buildBrowserConfig(
  config: FrontendObservabilityFaroConfig,
): BrowserConfig {
  const transports = config.ingest?.endpoint
    ? [new FetchTransport({ url: config.ingest.endpoint })]
    : [];

  return {
    app: {
      name: config.app.name,
      environment: config.app.environment,
      release: config.app.release,
      version: config.app.release,
    },
    instrumentations: [],
    isolate: true,
    preventGlobalExposure: true,
    sessionTracking: {
      enabled: false,
    },
    transports,
  };
}

export function buildFaroUser(
  userContext: FrontendObservabilityUserContext | null,
): MetaUser | undefined {
  if (!userContext) {
    return undefined;
  }

  const attributes = mergeAttributes(userContext.attributes, {
    kind: userContext.kind ?? "",
    is_authenticated: stringifyBoolean(userContext.isAuthenticated) ?? "",
  });

  const user: MetaUser = {
    id: userContext.userId,
    fullName: userContext.displayName,
    attributes,
  };

  return Object.values(user).some((value) => value !== undefined)
    ? user
    : undefined;
}

export function buildFaroSession(
  userContext: FrontendObservabilityUserContext | null,
): MetaSession | undefined {
  const sessionId = userContext?.sessionId;

  if (!sessionId) {
    return undefined;
  }

  const attributes = mergeAttributes({
    kind: userContext?.kind ?? "",
    is_authenticated: stringifyBoolean(userContext?.isAuthenticated) ?? "",
  });

  return attributes ? { id: sessionId, attributes } : { id: sessionId };
}

export function buildFaroPageViewAttributes(
  pageView: FrontendObservabilityPageViewInput,
  resourceAttributes?: FrontendObservabilityAttributes,
) {
  return mergeAttributes(resourceAttributes, pageView.attributes, {
    path: pageView.path,
    title: pageView.title ?? "",
    page_name: pageView.name ?? "",
    referrer: pageView.referrer ?? "",
    route_template: pageView.routeTemplate ?? "",
  });
}

export function buildFaroErrorContext(
  error: FrontendObservabilityCapturedError,
  resourceAttributes?: FrontendObservabilityAttributes,
) {
  return mergeAttributes(resourceAttributes, error.attributes, {
    route: error.route ?? "",
    route_template: error.routeTemplate ?? "",
  });
}

export function buildFaroWebVitalPayload(
  metric: FrontendObservabilityWebVitalMetric,
  resourceAttributes?: FrontendObservabilityAttributes,
) {
  const values: Record<string, number> = {
    value: metric.value,
  };

  if (metric.delta !== undefined) {
    values.delta = metric.delta;
  }

  const context = mergeAttributes(resourceAttributes, metric.attributes, {
    id: metric.id ?? "",
    rating: metric.rating ?? "unknown",
    navigation_type: metric.navigationType ?? "",
  });

  return {
    type: metric.name,
    values,
    context,
  };
}

class DefaultFrontendObservabilityFaroClient
  implements FrontendObservabilityFaroClient
{
  constructor(
    private readonly faro: Faro,
    private readonly resourceAttributes?: FrontendObservabilityAttributes,
  ) {}

  setUserContext(userContext: FrontendObservabilityUserContext | null) {
    const user = buildFaroUser(userContext);
    if (user) {
      this.faro.api.setUser(user);
    } else {
      this.faro.api.resetUser();
    }

    const session = buildFaroSession(userContext);
    if (session) {
      this.faro.api.setSession(session);
    } else {
      this.faro.api.resetSession();
    }
  }

  trackPageView(
    pageView: FrontendObservabilityPageViewInput,
    timestampMs: number,
  ) {
    const attributes = buildFaroPageViewAttributes(
      pageView,
      this.resourceAttributes,
    );

    this.faro.api.setView({
      name: pageView.name ?? pageView.path,
    });
    this.faro.api.setPage({
      id: pageView.routeTemplate ?? pageView.path,
      url: pageView.path,
      attributes,
    });
    this.faro.api.pushEvent(
      "page_view",
      attributes,
      FRONTEND_OBSERVABILITY_FARO_DOMAIN,
      { timestampOverwriteMs: timestampMs },
    );
  }

  captureError(error: FrontendObservabilityCapturedError, timestampMs: number) {
    const providerError = new Error(error.message);
    providerError.name = error.name;
    providerError.stack = error.stack;

    this.faro.api.pushError(providerError, {
      context: buildFaroErrorContext(error, this.resourceAttributes),
      timestampOverwriteMs: timestampMs,
      type: error.name,
    });
  }

  reportWebVital(
    metric: FrontendObservabilityWebVitalMetric,
    timestampMs: number,
  ) {
    this.faro.api.pushMeasurement(
      buildFaroWebVitalPayload(metric, this.resourceAttributes),
      { timestampOverwriteMs: timestampMs },
    );
  }
}

export function createFaroClient(
  config: FrontendObservabilityFaroConfig,
  initialUserContext: FrontendObservabilityUserContext | null,
): FrontendObservabilityFaroClient {
  const faro = initializeFaro(buildBrowserConfig(config));
  const client = new DefaultFrontendObservabilityFaroClient(
    faro,
    config.resourceAttributes,
  );

  client.setUserContext(initialUserContext);

  return client;
}
