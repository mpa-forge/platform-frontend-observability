import { createFaroClient } from "./internal/faro-client";

export const FRONTEND_OBSERVABILITY_HEADER_NAMES = {
  correlationId: "x-platform-correlation-id",
  app: "x-platform-client-app",
  environment: "x-platform-client-env",
  release: "x-platform-client-release",
  route: "x-platform-client-route",
  routeTemplate: "x-platform-client-route-template",
  operation: "x-platform-client-operation",
} as const;

const FORBIDDEN_INGEST_KEYS = new Set([
  "headers",
  "authorization",
  "authorizationHeader",
  "authHeader",
  "apiKey",
  "apikey",
  "token",
  "secret",
]);

export type FrontendObservabilityEventType =
  | "page_view"
  | "client_error"
  | "web_vital";

export type FrontendObservabilityMetricRating =
  | "good"
  | "needs-improvement"
  | "poor"
  | "unknown";

export type FrontendObservabilityAttributes = Record<string, string>;

export type FrontendObservabilityUserContext = {
  kind?: "guest" | "member" | "service";
  userId?: string;
  sessionId?: string;
  displayName?: string;
  isAuthenticated?: boolean;
  attributes?: FrontendObservabilityAttributes;
};

export type FrontendObservabilityAppIdentity = {
  name: string;
  environment: string;
  release: string;
};

export type FrontendObservabilityIngestConfig = {
  endpoint?: string;
  transport?: string;
  dataset?: string;
  attributes?: FrontendObservabilityAttributes;
};

export type FrontendObservabilityConfig = {
  app: FrontendObservabilityAppIdentity;
  enabled?: boolean;
  ingest?: FrontendObservabilityIngestConfig;
  initialUserContext?: FrontendObservabilityUserContext | null;
  emit?: FrontendObservabilityEmitter;
  now?: () => Date;
  createId?: () => string;
};

export type FrontendObservabilityMetadata = {
  appName: string;
  environment: string;
  release: string;
  enabled: boolean;
  ingestEndpoint?: string;
  ingestTransport?: string;
  ingestDataset?: string;
  resourceAttributes?: FrontendObservabilityAttributes;
};

export type FrontendObservabilityPageViewInput = {
  path: string;
  title?: string;
  name?: string;
  referrer?: string;
  routeTemplate?: string;
  attributes?: FrontendObservabilityAttributes;
};

export type FrontendObservabilityErrorInput = {
  error: unknown;
  message?: string;
  route?: string;
  routeTemplate?: string;
  attributes?: FrontendObservabilityAttributes;
};

export type FrontendObservabilityCapturedError = {
  name: string;
  message: string;
  stack?: string;
  route?: string;
  routeTemplate?: string;
  attributes?: FrontendObservabilityAttributes;
};

export type FrontendObservabilityWebVitalMetric = {
  name: string;
  value: number;
  delta?: number;
  id?: string;
  rating?: FrontendObservabilityMetricRating;
  navigationType?: string;
  attributes?: FrontendObservabilityAttributes;
};

export type FrontendObservabilityRequestContextInput = {
  route?: string;
  routeTemplate?: string;
  operation?: string;
  correlationId?: string;
};

export type FrontendObservabilityRequestContext = {
  correlationId: string;
  headers: Record<string, string>;
};

export type FrontendObservabilityEventBase = {
  type: FrontendObservabilityEventType;
  timestamp: string;
  metadata: FrontendObservabilityMetadata;
  userContext: FrontendObservabilityUserContext | null;
};

export type FrontendObservabilityPageViewEvent =
  FrontendObservabilityEventBase & {
    type: "page_view";
    page: FrontendObservabilityPageViewInput;
  };

export type FrontendObservabilityClientErrorEvent =
  FrontendObservabilityEventBase & {
    type: "client_error";
    error: FrontendObservabilityCapturedError;
  };

export type FrontendObservabilityWebVitalEvent =
  FrontendObservabilityEventBase & {
    type: "web_vital";
    metric: FrontendObservabilityWebVitalMetric;
  };

export type FrontendObservabilityEvent =
  | FrontendObservabilityPageViewEvent
  | FrontendObservabilityClientErrorEvent
  | FrontendObservabilityWebVitalEvent;

type FrontendObservabilityPendingEvent =
  | {
      type: "page_view";
      page: FrontendObservabilityPageViewInput;
    }
  | {
      type: "client_error";
      error: FrontendObservabilityCapturedError;
    }
  | {
      type: "web_vital";
      metric: FrontendObservabilityWebVitalMetric;
    };

export type FrontendObservabilityEmitter = (
  event: FrontendObservabilityEvent,
) => void;

export type NormalizedFrontendObservabilityConfig = {
  app: FrontendObservabilityAppIdentity;
  enabled: boolean;
  ingest?: FrontendObservabilityIngestConfig;
  initialUserContext: FrontendObservabilityUserContext | null;
  emit?: FrontendObservabilityEmitter;
  now: () => Date;
  createId: () => string;
};

export type FrontendObservabilityRuntime = {
  readonly isEnabled: boolean;
  getMetadata(): FrontendObservabilityMetadata;
  getUserContext(): FrontendObservabilityUserContext | null;
  setUserContext(userContext: FrontendObservabilityUserContext | null): void;
  clearUserContext(): void;
  trackPageView(pageView: FrontendObservabilityPageViewInput): void;
  captureError(
    input: FrontendObservabilityErrorInput,
  ): FrontendObservabilityCapturedError;
  reportWebVital(metric: FrontendObservabilityWebVitalMetric): void;
  createRequestContext(
    input?: FrontendObservabilityRequestContextInput,
  ): FrontendObservabilityRequestContext;
};

function trimRequired(value: string, fieldName: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error(
      `Frontend observability requires a non-empty ${fieldName}.`,
    );
  }

  return trimmed;
}

function trimOptional(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeAttributes(
  attributes: FrontendObservabilityAttributes | undefined,
) {
  if (!attributes) {
    return undefined;
  }

  const normalizedEntries = Object.entries(attributes)
    .map(([key, value]) => [key.trim(), value.trim()] as const)
    .filter(([key, value]) => key.length > 0 && value.length > 0);

  if (normalizedEntries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(normalizedEntries);
}

function normalizeUserContext(
  userContext: FrontendObservabilityUserContext | null | undefined,
) {
  if (!userContext) {
    return null;
  }

  const normalized: FrontendObservabilityUserContext = {
    kind: userContext.kind,
    userId: trimOptional(userContext.userId),
    sessionId: trimOptional(userContext.sessionId),
    displayName: trimOptional(userContext.displayName),
    isAuthenticated: userContext.isAuthenticated,
    attributes: normalizeAttributes(userContext.attributes),
  };

  return Object.values(normalized).some((value) => value !== undefined)
    ? normalized
    : null;
}

function normalizeIngest(
  ingest: FrontendObservabilityIngestConfig | undefined,
): FrontendObservabilityIngestConfig | undefined {
  if (!ingest) {
    return undefined;
  }

  for (const key of Object.keys(ingest as Record<string, unknown>)) {
    if (FORBIDDEN_INGEST_KEYS.has(key)) {
      throw new Error(
        `Frontend observability ingest config must not include browser-held secrets like "${key}".`,
      );
    }
  }

  const normalized: FrontendObservabilityIngestConfig = {
    endpoint: trimOptional(ingest.endpoint),
    transport: trimOptional(ingest.transport),
    dataset: trimOptional(ingest.dataset),
    attributes: normalizeAttributes(ingest.attributes),
  };

  return Object.values(normalized).some((value) => value !== undefined)
    ? normalized
    : undefined;
}

function createDefaultId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `fo-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeError(
  input: FrontendObservabilityErrorInput,
): FrontendObservabilityCapturedError {
  const { error } = input;

  if (error instanceof Error) {
    return {
      name: error.name,
      message: trimOptional(input.message) ?? error.message,
      stack: error.stack,
      route: trimOptional(input.route),
      routeTemplate: trimOptional(input.routeTemplate),
      attributes: normalizeAttributes(input.attributes),
    };
  }

  return {
    name: "UnknownError",
    message:
      trimOptional(input.message) ??
      (typeof error === "string" ? error : "Unknown frontend error"),
    route: trimOptional(input.route),
    routeTemplate: trimOptional(input.routeTemplate),
    attributes: normalizeAttributes(input.attributes),
  };
}

export function normalizeFrontendObservabilityConfig(
  config: FrontendObservabilityConfig,
): NormalizedFrontendObservabilityConfig {
  return {
    app: {
      name: trimRequired(config.app.name, "app.name"),
      environment: trimRequired(config.app.environment, "app.environment"),
      release: trimRequired(config.app.release, "app.release"),
    },
    enabled: config.enabled ?? false,
    ingest: normalizeIngest(config.ingest),
    initialUserContext: normalizeUserContext(config.initialUserContext),
    emit: config.emit,
    now: config.now ?? (() => new Date()),
    createId: config.createId ?? createDefaultId,
  };
}

class DefaultFrontendObservabilityRuntime
  implements FrontendObservabilityRuntime
{
  private readonly metadata: FrontendObservabilityMetadata;
  private readonly emit?: FrontendObservabilityEmitter;
  private readonly now: () => Date;
  private readonly createId: () => string;
  private readonly resourceAttributes?: FrontendObservabilityAttributes;
  private userContext: FrontendObservabilityUserContext | null;
  private readonly faroClient;

  readonly isEnabled: boolean;

  constructor(config: NormalizedFrontendObservabilityConfig) {
    this.metadata = {
      appName: config.app.name,
      environment: config.app.environment,
      release: config.app.release,
      enabled: config.enabled,
      ingestEndpoint: config.ingest?.endpoint,
      ingestTransport: config.ingest?.transport,
      ingestDataset: config.ingest?.dataset,
      resourceAttributes: normalizeAttributes(config.ingest?.attributes),
    };
    this.emit = config.emit;
    this.now = config.now;
    this.createId = config.createId;
    this.resourceAttributes = this.metadata.resourceAttributes;
    this.userContext = config.initialUserContext;
    this.isEnabled = config.enabled;
    this.faroClient = config.enabled
      ? createFaroClient(
          {
            app: config.app,
            ingest: config.ingest,
            resourceAttributes: this.resourceAttributes,
          },
          this.userContext,
        )
      : null;
  }

  getMetadata() {
    return {
      ...this.metadata,
      resourceAttributes: normalizeAttributes(this.metadata.resourceAttributes),
    };
  }

  getUserContext() {
    return this.userContext
      ? {
          ...this.userContext,
          attributes: normalizeAttributes(this.userContext.attributes),
        }
      : null;
  }

  setUserContext(userContext: FrontendObservabilityUserContext | null) {
    this.userContext = normalizeUserContext(userContext);
    this.faroClient?.setUserContext(this.userContext);
  }

  clearUserContext() {
    this.userContext = null;
    this.faroClient?.setUserContext(null);
  }

  trackPageView(pageView: FrontendObservabilityPageViewInput) {
    const normalizedPageView: FrontendObservabilityPageViewInput = {
      path: trimRequired(pageView.path, "pageView.path"),
      title: trimOptional(pageView.title),
      name: trimOptional(pageView.name),
      referrer: trimOptional(pageView.referrer),
      routeTemplate: trimOptional(pageView.routeTemplate),
      attributes: normalizeAttributes(pageView.attributes),
    };

    this.emitEvent({
      type: "page_view",
      page: normalizedPageView,
    });

    this.faroClient?.trackPageView(normalizedPageView, this.now().getTime());
  }

  captureError(input: FrontendObservabilityErrorInput) {
    const normalizedError = normalizeError(input);

    this.emitEvent({
      type: "client_error",
      error: normalizedError,
    });

    this.faroClient?.captureError(normalizedError, this.now().getTime());

    return normalizedError;
  }

  reportWebVital(metric: FrontendObservabilityWebVitalMetric) {
    const normalizedMetric = {
      ...metric,
      name: trimRequired(metric.name, "metric.name"),
      rating: metric.rating ?? "unknown",
      attributes: normalizeAttributes(metric.attributes),
    };

    this.emitEvent({
      type: "web_vital",
      metric: normalizedMetric,
    });

    this.faroClient?.reportWebVital(normalizedMetric, this.now().getTime());
  }

  createRequestContext(input: FrontendObservabilityRequestContextInput = {}) {
    const correlationId = trimOptional(input.correlationId) ?? this.createId();
    const headers: Record<string, string> = {
      [FRONTEND_OBSERVABILITY_HEADER_NAMES.correlationId]: correlationId,
      [FRONTEND_OBSERVABILITY_HEADER_NAMES.app]: this.metadata.appName,
      [FRONTEND_OBSERVABILITY_HEADER_NAMES.environment]:
        this.metadata.environment,
      [FRONTEND_OBSERVABILITY_HEADER_NAMES.release]: this.metadata.release,
    };

    const route = trimOptional(input.route);
    if (route) {
      headers[FRONTEND_OBSERVABILITY_HEADER_NAMES.route] = route;
    }

    const routeTemplate = trimOptional(input.routeTemplate);
    if (routeTemplate) {
      headers[FRONTEND_OBSERVABILITY_HEADER_NAMES.routeTemplate] =
        routeTemplate;
    }

    const operation = trimOptional(input.operation);
    if (operation) {
      headers[FRONTEND_OBSERVABILITY_HEADER_NAMES.operation] = operation;
    }

    return { correlationId, headers };
  }

  private emitEvent(event: FrontendObservabilityPendingEvent) {
    if (!this.isEnabled || !this.emit) {
      return;
    }

    this.emit({
      ...event,
      metadata: this.getMetadata(),
      timestamp: this.now().toISOString(),
      userContext: this.getUserContext(),
    } as FrontendObservabilityEvent);
  }
}

export function createFrontendObservability(
  config: FrontendObservabilityConfig,
): FrontendObservabilityRuntime {
  return new DefaultFrontendObservabilityRuntime(
    normalizeFrontendObservabilityConfig(config),
  );
}
