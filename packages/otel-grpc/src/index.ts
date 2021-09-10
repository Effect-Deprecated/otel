// ets_tracing: off

import * as T from "@effect-ts/core/Effect"
import * as L from "@effect-ts/core/Effect/Layer"
import * as M from "@effect-ts/core/Effect/Managed"
import { pipe } from "@effect-ts/core/Function"
import { tag } from "@effect-ts/core/Has"
import { SimpleProcessor } from "@effect-ts/otel"
import { CollectorTraceExporter } from "@opentelemetry/exporter-collector-grpc"
import type { CollectorExporterConfigNode } from "@opentelemetry/exporter-collector-grpc/build/src/types"

export const GrpcTracingExporterConfigSymbol = Symbol()

export class GrpcTracingExporterConfig {
  readonly [GrpcTracingExporterConfigSymbol] = GrpcTracingExporterConfigSymbol
  constructor(readonly config: CollectorExporterConfigNode) {}
}

export const GrpcTracingExporterConfigTag = tag<GrpcTracingExporterConfig>()

export function grpcConfig(config: CollectorExporterConfigNode) {
  return L.fromEffect(GrpcTracingExporterConfigTag)(
    T.succeedWith(() => new GrpcTracingExporterConfig(config))
  ).setKey(GrpcTracingExporterConfigTag.key)
}

export function grpcConfigM<R, E>(config: T.Effect<R, E, CollectorExporterConfigNode>) {
  return L.fromEffect(GrpcTracingExporterConfigTag)(
    T.map_(config, (_) => new GrpcTracingExporterConfig(_))
  ).setKey(GrpcTracingExporterConfigTag.key)
}

export const makeGRPCTracingSpanExporter = M.gen(function* (_) {
  const { config } = yield* _(GrpcTracingExporterConfigTag)

  const spanExporter = yield* _(
    pipe(
      T.succeedWith(() => new CollectorTraceExporter(config)),
      // NOTE Unfortunately this workaround/"hack" is currently needed since Otel doesn't yet provide a graceful
      // way to shutdown.
      //
      // Related issue: https://github.com/open-telemetry/opentelemetry-js/issues/987
      M.make((p) =>
        T.gen(function* (_) {
          while (1) {
            yield* _(T.sleep(0))
            const promises = p["_sendingPromises"] as any[]
            if (promises.length > 0) {
              yield* _(T.result(T.promise(() => Promise.all(promises))))
            } else {
              break
            }
          }
        })
      )
    )
  )

  return spanExporter
})

export const GRPCSimple = tag<SimpleProcessor<CollectorTraceExporter>>()

export const LiveGRPCSimple = SimpleProcessor(GRPCSimple, makeGRPCTracingSpanExporter)
