// ets_tracing: off

import * as T from "@effect-ts/core/Effect"
import * as L from "@effect-ts/core/Effect/Layer"
import * as M from "@effect-ts/core/Effect/Managed"
import { pipe } from "@effect-ts/core/Function"
import { tag } from "@effect-ts/core/Has"
import { SimpleProcessor } from "@effect-ts/otel"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc"
import type { OTLPGRPCExporterConfigNode } from "@opentelemetry/otlp-grpc-exporter-base"

export const OTLPTraceExporterConfigSymbol = Symbol()

export class OTLPTraceExporterConfig {
  readonly [OTLPTraceExporterConfigSymbol] = OTLPTraceExporterConfigSymbol
  constructor(readonly config: OTLPGRPCExporterConfigNode) {}
}

export const OTLPTraceExporterConfigTag = tag<OTLPTraceExporterConfig>(
  OTLPTraceExporterConfigSymbol
)

export const makeOTLPTraceExporterConfigLayer = (config: OTLPGRPCExporterConfigNode) =>
  L.fromEffect(OTLPTraceExporterConfigTag)(
    T.succeedWith(() => new OTLPTraceExporterConfig(config))
  ).setKey(OTLPTraceExporterConfigTag.key)

export const makeOTLPTraceExporterConfigLayerM = <R, E>(
  config: T.Effect<R, E, OTLPGRPCExporterConfigNode>
) =>
  L.fromEffect(OTLPTraceExporterConfigTag)(
    T.map_(config, (_) => new OTLPTraceExporterConfig(_))
  ).setKey(OTLPTraceExporterConfigTag.key)

export const makeTracingSpanExporter = M.gen(function* (_) {
  const { config } = yield* _(OTLPTraceExporterConfigTag)

  const spanExporter = yield* _(
    pipe(
      T.succeedWith(() => new OTLPTraceExporter(config)),
      M.make((p) => T.promise(() => p.shutdown()))
    )
  )

  return spanExporter
})

export const LiveSimpleProcessor = SimpleProcessor(makeTracingSpanExporter)
