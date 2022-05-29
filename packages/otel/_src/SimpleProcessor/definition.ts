import type { SpanExporter, SpanProcessor } from "@opentelemetry/sdk-trace-base"
import { ConsoleSpanExporter, SimpleSpanProcessor } from "@opentelemetry/sdk-trace-base"

/**
 * @tsplus type effect/otel/SimpleProcessor
 */
export interface SimpleProcessor {
  readonly spanExporter: SpanExporter
  readonly spanProcessor: SpanProcessor
}

/**
 * @tsplus type effect/otel/SimpleProcessor.Ops
 */
export interface SimpleProcessorOps {
  readonly Tag: Service.Tag<SimpleProcessor>
}
export const SimpleProcessor: SimpleProcessorOps = {
  Tag: Service.Tag<SimpleProcessor>()
}

/**
 * @tsplus static effect/otel/SimpleProcessor.Ops make
 */
export function make<R, E, A extends SpanExporter>(exporter: Effect<R & Service.Has<Scope>, E, A>) {
  return Layer.scoped(SimpleProcessor.Tag)(
    Do(($) => {
      const tracerProvider = $(Effect.service(TracerProvider.Tag))
      const spanExporter = $(exporter)
      const spanProcessor = $(Effect.succeed(new SimpleSpanProcessor(spanExporter)))
      $(Effect.succeed(tracerProvider.addSpanProcessor(spanProcessor)))
      return {
        spanExporter,
        spanProcessor
      }
    })
  )
}

/**
 * @tsplus static effect/otel/SimpleProcessor.Ops LiveSimpleConsole
 */
export const LiveSimpleConsole = SimpleProcessor.make(Effect.succeed(new ConsoleSpanExporter()))
