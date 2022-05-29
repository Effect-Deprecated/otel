import type { ExporterConfig } from "@opentelemetry/exporter-jaeger"
import { JaegerExporter } from "@opentelemetry/exporter-jaeger"

/**
 * @tsplus type effect/otel-exporter-jaeger/JaegerTracingSpanExporterConfig
 */
export interface JaegerTracingSpanExporterConfig extends ExporterConfig {}

/**
 * @tsplus type effect/otel-exporter-jaeger/JaegerTracingSpanExporterConfig.Ops
 */
export interface JaegerTracingSpanExporterConfigOps {
  readonly Tag: Service.Tag<JaegerTracingSpanExporterConfig>
}
export const JaegerTracingSpanExporterConfig: JaegerTracingSpanExporterConfigOps = {
  Tag: Service.Tag<JaegerTracingSpanExporterConfig>()
}

/**
 * @tsplus static effect/otel-exporter-jaeger/JaegerTracingSpanExporterConfig.Ops Live
 */
export function LiveJaegerTracingSpanExporterConfig(
  config: ExporterConfig
): Layer<unknown, never, Service.Has<JaegerTracingSpanExporterConfig>> {
  return Effect.succeed(config).toLayer(JaegerTracingSpanExporterConfig.Tag)
}

/**
 * @tsplus type effect/otel-exporter-jaeger/JaegerTracingSpanExporter.Ops
 */
export interface JaegerTracingSpanExporterOps {}
export const JaegerTracingSpanExporter: JaegerTracingSpanExporterOps = {}

/**
 * @tsplus static effect/otel-exporter-jaeger/JaegerTracingSpanExporter.Ops make
 */
export const makeJaegerTracingSpanExporter = Effect.service(JaegerTracingSpanExporterConfig.Tag).flatMap((config) =>
  Effect.succeed(new JaegerExporter(config))
    .acquireRelease((exporter) =>
      // NOTE Unfortunately this workaround/"hack" is currently needed since
      // Otel doesn't yet provide a graceful way to shutdown. Related issue:
      // https://github.com/open-telemetry/opentelemetry-js/issues/987
      Effect.sleep((2).seconds)
        .zipRight(Effect.promise(exporter.shutdown()))
        .zipRight(Effect.async<unknown, never, void>((resume) => {
          exporter["_sender"]["_client"].once("close", () => {
            resume(Effect.unit)
          })
        }))
    )
)
