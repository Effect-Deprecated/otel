import * as T from "@effect-ts/core/Effect"
import { pretty } from "@effect-ts/core/Effect/Cause"
import * as L from "@effect-ts/core/Effect/Layer"
import * as M from "@effect-ts/core/Effect/Managed"
import { identity, pipe } from "@effect-ts/core/Function"
import type { Has } from "@effect-ts/core/Has"
import { tag } from "@effect-ts/core/Has"
import * as O from "@effect-ts/core/Option"
import type {
  Span,
  SpanAttributes,
  SpanAttributeValue,
  TimeInput
} from "@opentelemetry/api"
import { context, setSpan } from "@opentelemetry/api"
import { NodeTracerProvider } from "@opentelemetry/node"
import type { BasicTracerProvider, SpanExporter, Tracer } from "@opentelemetry/tracing"
import { ConsoleSpanExporter, SimpleSpanProcessor } from "@opentelemetry/tracing"

//
// Span Processor
//

export const makeSimpleTracingSpanProcessor = M.gen(function* (_) {
  const { spanExporter } = yield* _(TracingSpanExporter)

  const spanProcessor = yield* _(
    T.succeedWith(() => new SimpleSpanProcessor(spanExporter))
  )

  const { tracerProvider } = yield* _(TracingProvider)

  yield* _(T.succeedWith(() => tracerProvider.addSpanProcessor(spanProcessor)))

  return {}
})

export function SimpleTracingSpanProcessor() {
  return L.fresh(L.fromRawManaged(makeSimpleTracingSpanProcessor))
}

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
  const spanExporter = yield* _(T.succeedWith(() => new ConsoleSpanExporter()))

  return identity<TracingSpanExporter>({
    [TracingSpanExporterSymbol]: TracingSpanExporterSymbol,
    spanExporter
  })
})

export const ConsoleTracingSpanExporter = L.fromManaged(TracingSpanExporter)(
  makeConsoleTracingSpanExporter
).setKey(Symbol())

export const ConsoleSimpleProcessor = ConsoleTracingSpanExporter[">>>"](
  SimpleTracingSpanProcessor()
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
  const tracerProvider = yield* _(T.succeedWith(() => new NodeTracerProvider()))

  yield* _(T.succeedWith(() => tracerProvider.register()))

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

export const CurrentSpanSymbol = Symbol()
export type CurrentSpanSymbol = typeof CurrentSpanSymbol

export class CurrentSpanImpl {
  readonly [CurrentSpanSymbol] = CurrentSpanSymbol
  constructor(readonly span: Span) {}
}

export interface CurrentSpan extends CurrentSpanImpl {}

export const CurrentSpan = tag<CurrentSpan>()

export function withSpan(name: string) {
  return <R, E, A>(
    effect: T.Effect<R & Has<CurrentSpan>, E, A>
  ): T.Effect<R & Has<OtelTracer>, E, A> => {
    const createSpan = withTracer((tracer) =>
      T.access((r: unknown) => {
        const maybeSpan = CurrentSpan.readOption(r)
        if (O.isSome(maybeSpan)) {
          const ctx = setSpan(context.active(), maybeSpan.value.span)
          return tracer.startSpan(name, {}, ctx)
        }
        return tracer.startSpan(name, { root: true })
      })
    )

    return T.bracketExit_(
      createSpan,
      (s) => pipe(effect, T.provideService(CurrentSpan)(new CurrentSpanImpl(s))),
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

export function addAttribute(name: string, value: SpanAttributeValue) {
  return T.accessServiceM(CurrentSpan)((_) =>
    T.succeedWith(() => _.span.setAttribute(name, value))
  )
}

export function addEvent(
  name: string,
  attributesOrStartTime?: SpanAttributes | TimeInput,
  startTime?: TimeInput
) {
  return T.accessServiceM(CurrentSpan)((_) =>
    T.succeedWith(() => _.span.addEvent(name, attributesOrStartTime, startTime))
  )
}
