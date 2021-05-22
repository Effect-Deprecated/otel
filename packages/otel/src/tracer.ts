import * as T from "@effect-ts/core/Effect"
import { pretty } from "@effect-ts/core/Effect/Cause"
import * as L from "@effect-ts/core/Effect/Layer"
import * as M from "@effect-ts/core/Effect/Managed"
import { identity, pipe } from "@effect-ts/core/Function"
import { tag } from "@effect-ts/core/Has"
import { NodeTracerProvider } from "@opentelemetry/node"
import type {
  BasicTracerProvider,
  SpanExporter,
  SpanProcessor,
  Tracer
} from "@opentelemetry/tracing"
import { ConsoleSpanExporter, SimpleSpanProcessor } from "@opentelemetry/tracing"

//
// Span Exporter
//

export const TracingSpanExporterSymbol = Symbol()
export type TracingSpanExporterSymbol = typeof TracingSpanExporterSymbol

export interface TracingSpanExporter {
  readonly [TracingSpanExporterSymbol]: TracingSpanExporterSymbol
  readonly spanExporter: SpanExporter
}

export const TracingSpanExporter = tag<TracingSpanExporter>()

export const makeConsoleTracingSpanExporter = M.gen(function* (_) {
  const spanExporter = yield* _(
    pipe(
      T.succeedWith(() => new ConsoleSpanExporter()),
      M.makeExit((p) => T.promise(() => p.shutdown()))
    )
  )

  return identity<TracingSpanExporter>({
    [TracingSpanExporterSymbol]: TracingSpanExporterSymbol,
    spanExporter
  })
})

export const ConsoleTracingSpanExporter = L.fromManaged(TracingSpanExporter)(
  makeConsoleTracingSpanExporter
)

//
// Span Processor
//

export const TracingSpanProcessorSymbol = Symbol()
export type TracingSpanProcessorSymbol = typeof TracingSpanProcessorSymbol

export interface TracingSpanProcessor {
  readonly [TracingSpanProcessorSymbol]: TracingSpanProcessorSymbol
  readonly spanProcessor: SpanProcessor
}

export const TracingSpanProcessor = tag<TracingSpanProcessor>()

export const makeSimpleTracingSpanProcessor = M.gen(function* (_) {
  const { spanExporter } = yield* _(TracingSpanExporter)

  const spanProcessor = yield* _(
    pipe(
      T.succeedWith(() => new SimpleSpanProcessor(spanExporter)),
      M.makeExit((p) => T.promise(() => p.shutdown()))
    )
  )

  return identity<TracingSpanProcessor>({
    [TracingSpanProcessorSymbol]: TracingSpanProcessorSymbol,
    spanProcessor
  })
})

export const SimpleTracingSpanProcessor = L.fromManaged(TracingSpanProcessor)(
  makeSimpleTracingSpanProcessor
)

//
// Tracing Provider
//

export const TracingProviderSymbol = Symbol()
export type TracingProviderSymbol = typeof TracingProviderSymbol

export interface TracingProvider {
  readonly [TracingProviderSymbol]: TracingProviderSymbol
  readonly tracerProvider: BasicTracerProvider
}

export const TracingProvider = tag<TracingProvider>()

export const makeNodeTracingProvider = M.gen(function* (_) {
  const { spanProcessor } = yield* _(TracingSpanProcessor)

  const tracerProvider = yield* _(
    pipe(
      T.succeedWith(() => new NodeTracerProvider()),
      M.make((p) => T.promise(() => p.shutdown()))
    )
  )

  yield* _(T.succeedWith(() => tracerProvider.register()))

  yield* _(T.succeedWith(() => tracerProvider.addSpanProcessor(spanProcessor)))

  return identity<TracingProvider>({
    [TracingProviderSymbol]: TracingProviderSymbol,
    tracerProvider
  })
})

export const NodeTracingProvider = L.fromManaged(TracingProvider)(
  makeNodeTracingProvider
)

//
// Otel Tracer
//

export const OtelTracerSymbol = Symbol()
export type OtelTracerSymbol = typeof OtelTracerSymbol

export interface OtelTracer {
  readonly [OtelTracerSymbol]: OtelTracerSymbol
  readonly tracer: Tracer
}

export const OtelTracer = tag<OtelTracer>()

export const makeOtelTracer = (name: string) =>
  M.gen(function* (_) {
    const { tracerProvider } = yield* _(TracingProvider)

    const tracer = yield* _(T.succeedWith(() => tracerProvider.getTracer(name)))

    return identity<OtelTracer>({
      [OtelTracerSymbol]: OtelTracerSymbol,
      tracer
    })
  })

export const LiveOtelTracer = L.fromManaged(OtelTracer)(
  makeOtelTracer("@effect-ts/otel/Tracer")
)

export const { tracer: withTracer } = T.deriveAccessM(OtelTracer)(["tracer"])

export function withSpan(name: string) {
  return <R, E, A>(effect: T.Effect<R, E, A>) => {
    const createSpan = withTracer((tracer) =>
      T.succeedWith(() => tracer.startSpan(name))
    )

    return T.bracketExit_(
      createSpan,
      (s) => effect,
      (s, e) =>
        T.succeedWith(() => {
          if (e._tag === "Failure") {
            s.setAttribute("error.type", "Fiber Failure")
            s.setAttribute("error.message", "An Effect Has A Failure")
            s.setAttribute("error.stack", pretty(e.cause))
          }
          s.end()
        })
    )
  }
}

export const ConsoleSimpleTracing = pipe(
  NodeTracingProvider,
  L.using(SimpleTracingSpanProcessor),
  L.using(ConsoleTracingSpanExporter)
)[">>>"](LiveOtelTracer)
