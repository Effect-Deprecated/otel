// ets_tracing: off

import * as T from "@effect-ts/core/Effect"
import * as L from "@effect-ts/core/Effect/Layer"
import * as M from "@effect-ts/core/Effect/Managed"
import { pipe } from "@effect-ts/core/Function"
import { tag } from "@effect-ts/core/Has"
import { SimpleProcessor } from "@effect-ts/otel"
import type { ExporterConfig } from "@opentelemetry/exporter-jaeger"
import { JaegerExporter } from "@opentelemetry/exporter-jaeger"

export const JaegerTracingExporterConfigSymbol = Symbol()

export class JaegerTracingExporterConfig {
  readonly [JaegerTracingExporterConfigSymbol] = JaegerTracingExporterConfigSymbol
  constructor(readonly config: ExporterConfig) {}
}

export const JaegerTracingExporterConfigTag = tag<JaegerTracingExporterConfig>(
  JaegerTracingExporterConfigSymbol
)

export function jaegerConfig(config: ExporterConfig) {
  return L.fromEffect(JaegerTracingExporterConfigTag)(
    T.succeedWith(() => new JaegerTracingExporterConfig(config))
  ).setKey(JaegerTracingExporterConfigTag.key)
}

export function jaegerConfigM<R, E>(config: T.Effect<R, E, ExporterConfig>) {
  return L.fromEffect(JaegerTracingExporterConfigTag)(
    T.map_(config, (_) => new JaegerTracingExporterConfig(_))
  ).setKey(JaegerTracingExporterConfigTag.key)
}

export const makeJaegerTracingSpanExporter = M.gen(function* (_) {
  const { config } = yield* _(JaegerTracingExporterConfigTag)

  const spanExporter = yield* _(
    pipe(
      T.succeedWith(() => new JaegerExporter(config)),
      M.make((p) => T.promise(() => p.shutdown()))
    )
  )

  return spanExporter
})

export const LiveJaegerSimple = SimpleProcessor(makeJaegerTracingSpanExporter)
