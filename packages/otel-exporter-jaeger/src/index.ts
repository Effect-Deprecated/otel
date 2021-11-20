import * as T from "@effect-ts/core/Effect"
import * as L from "@effect-ts/core/Effect/Layer"
import * as M from "@effect-ts/core/Effect/Managed"
import { pipe } from "@effect-ts/core/Function"
import { BaseService, tag } from "@effect-ts/core/Has"
import { SimpleProcessor } from "@effect-ts/otel"
import type { ExporterConfig } from "@opentelemetry/exporter-jaeger"
import { JaegerExporter } from "@opentelemetry/exporter-jaeger"

export const JaegerTracingExporterConfigServiceId = Symbol()

export class JaegerTracingExporterConfig extends BaseService(
  JaegerTracingExporterConfigServiceId
) {
  constructor(readonly config: ExporterConfig) {
    super()
  }
}

export const JaegerTracingExporterConfigTag = tag<JaegerTracingExporterConfig>(
  JaegerTracingExporterConfigServiceId
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
      M.make((p) =>
        // NOTE Unfortunately this workaround/"hack" is currently needed since Otel doesn't yet provide a graceful
        // way to shutdown.
        //
        // Related issue: https://github.com/open-telemetry/opentelemetry-js/issues/987
        pipe(
          T.sleep(2_000),
          T.zipRight(T.promise(() => p.shutdown())),
          T.zipRight(
            T.effectAsync<unknown, never, void>((cb) => {
              p["_sender"]["_client"].once("close", () => {
                cb(T.unit)
              })
            })
          )
        )
      )
    )
  )

  return spanExporter
})

export const LiveJaegerSimple = SimpleProcessor(makeJaegerTracingSpanExporter)
