import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from "web-vitals";

import type {
  FrontendObservabilityMetricRating,
  FrontendObservabilityRuntime,
  FrontendObservabilityWebVitalMetric,
} from "./runtime";

export type FrontendObservabilityWebVitalsOptions = {
  reportAllChanges?: boolean;
};

function mapMetric(metric: Metric): FrontendObservabilityWebVitalMetric {
  return {
    name: metric.name,
    value: metric.value,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
    rating:
      (metric.rating as FrontendObservabilityMetricRating | undefined) ??
      "unknown",
    attributes: {
      entries: `${metric.entries.length}`,
    },
  };
}

export function startWebVitalsTracking(
  runtime: FrontendObservabilityRuntime,
  options: FrontendObservabilityWebVitalsOptions = {},
) {
  const report = (metric: Metric) => runtime.reportWebVital(mapMetric(metric));

  onCLS(report, options);
  onFCP(report, options);
  onINP(report, options);
  onLCP(report, options);
  onTTFB(report, options);

  return () => undefined;
}
