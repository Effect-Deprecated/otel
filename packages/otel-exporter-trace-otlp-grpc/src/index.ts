// ets_tracing: off

import * as T from "@effect-ts/core/Effect"
import * as L from "@effect-ts/core/Effect/Layer"
import * as M from "@effect-ts/core/Effect/Managed"
import { pipe } from "@effect-ts/core/Function"
import { BaseService, tag } from "@effect-ts/core/Has"
import { SimpleProcessor } from "@effect-ts/otel"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc"
import type { OTLPExporterConfigNode } from "@opentelemetry/exporter-trace-otlp-grpc/build/src/types"

export const OTLPTraceExporterConfigServiceId = Symbol()

export class OTLPTraceExporterConfig extends BaseService(
  OTLPTraceExporterConfigServiceId
) {
  constructor(readonly config: OTLPExporterConfigNode) {
    super()
  }
}

export const OTLPTraceExporterConfigTag = tag<OTLPTraceExporterConfig>(
  OTLPTraceExporterConfigServiceId
)

export const makeOTLPTraceExporterConfigLayer = (config: OTLPExporterConfigNode) =>
  L.fromEffect(OTLPTraceExporterConfigTag)(
    T.succeedWith(() => new OTLPTraceExporterConfig(config))
  ).setKey(OTLPTraceExporterConfigTag.key)

export const makeOTLPTraceExporterConfigLayerM = <R, E>(
  config: T.Effect<R, E, OTLPExporterConfigNode>
) =>
  L.fromEffect(OTLPTraceExporterConfigTag)(
    T.map_(config, (_) => new OTLPTraceExporterConfig(_))
  ).setKey(OTLPTraceExporterConfigTag.key)

export const makeTracingSpanExporter = M.gen(function* (_) {
  const { config } = yield* _(OTLPTraceExporterConfigTag)

  const spanExporter = yield* _(
    pipe(
      T.succeedWith(() => new OTLPTraceExporter(config)),
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

export const LiveSimpleProcessor = SimpleProcessor(makeTracingSpanExporter)
