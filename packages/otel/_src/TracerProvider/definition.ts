import type { BasicTracerProvider } from "@opentelemetry/sdk-trace-base"

/**
 * @tsplus type effect/otel/TracerProvider
 */
export interface TracerProvider extends BasicTracerProvider {}

/**
 * @tsplus type effect/otel/TracerProvider.Ops
 */
export interface TracerProviderOps {
  readonly Tag: Service.Tag<TracerProvider>
}
export const TracerProvider: TracerProviderOps = {
  Tag: Service.Tag<TracerProvider>()
}
