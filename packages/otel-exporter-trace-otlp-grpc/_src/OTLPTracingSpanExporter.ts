import type { OTLPExporterConfigNode } from "@opentelemetry/exporter-trace-otlp-grpc"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc"

/**
 * @tsplus type effect/otel-exporter-trace-otlp-grpc/OTLPTracingSpanExporterConfig
 */
export interface OTLPTracingSpanExporterConfig extends OTLPExporterConfigNode {}

/**
 * @tsplus type effect/otel-exporter-trace-otlp-grpc/OTLPTracingSpanExporterConfig.Ops
 */
export interface OTLPTracingSpanExporterConfigOps {
  readonly Tag: Service.Tag<OTLPTracingSpanExporterConfig>
}
export const OTLPTracingSpanExporterConfig: OTLPTracingSpanExporterConfigOps = {
  Tag: Service.Tag<OTLPTracingSpanExporterConfig>()
}

/**
 * @tsplus static effect/otel-exporter-trace-otlp-grpc/OTLPTracingSpanExporterConfig.Ops Live
 */
export function LiveOTLPTracingSpanExporterConfig(config: OTLPExporterConfigNode) {
  return Effect.succeed(config).toLayer(OTLPTracingSpanExporterConfig.Tag)
}

/**
 * @tsplus type effect/otel-exporter-trace-otlp-grpc/OTLPTracingSpanExporter.Ops
 */
export interface OTLPTracingSpanExporterOps {}
export const OTLPTracingSpanExporter: OTLPTracingSpanExporterOps = {}

/**
 * @tsplus static effect/otel-exporter-trace-otlp-grpc/OTLPTracingSpanExporter.Ops make
 */
export const makeOTLPTracingSpanExpoter = Effect.service(OTLPTracingSpanExporterConfig.Tag).flatMap((config) =>
  Effect.succeed(new OTLPTraceExporter(config))
    .acquireRelease((exporter) =>
      // NOTE Unfortunately this workaround/"hack" is currently needed since
      // Otel doesn't yet provide a graceful way to shutdown. Related issue:
      // https://github.com/open-telemetry/opentelemetry-js/issues/987
      Effect.gen(function*($) {
        while (1) {
          yield* $(Effect.sleep((0).millis))
          const promises = exporter["_sendingPromises"] as any[]
          if (promises.length > 0) {
            yield $(Effect.promise(Promise.all(promises)).exit())
          } else {
            break
          }
        }
      })
    )
)
