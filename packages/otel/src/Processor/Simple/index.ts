// ets_tracing: off

import * as T from "@effect-ts/core/Effect"
import * as L from "@effect-ts/core/Effect/Layer"
import * as M from "@effect-ts/core/Effect/Managed"
import { identity } from "@effect-ts/core/Function"
import type { Tag } from "@effect-ts/core/Has"
import { tag } from "@effect-ts/core/Has"
import type { SpanExporter } from "@opentelemetry/tracing"
import { ConsoleSpanExporter, SimpleSpanProcessor } from "@opentelemetry/tracing"

import { TracerProvider } from "../../TracerProvider"

//
// Span Processor
//

export const SimpleProcessorSymbol = Symbol()
export type SimpleProcessorSymbol = typeof SimpleProcessorSymbol

export interface SimpleProcessor<A extends SpanExporter> {
  readonly [SimpleProcessorSymbol]: SimpleProcessorSymbol
  readonly spanExporter: A
  readonly spanProcessor: SimpleSpanProcessor
}

export const makeSimpleProcessor = <R, E, A extends SpanExporter>(
  exporter: M.Managed<R, E, A>
) =>
  M.gen(function* (_) {
    const { tracerProvider } = yield* _(TracerProvider)

    const spanExporter = yield* _(exporter)

    const spanProcessor = yield* _(
      T.succeedWith(() => new SimpleSpanProcessor(spanExporter))
    )

    yield* _(T.succeedWith(() => tracerProvider.addSpanProcessor(spanProcessor)))

    return identity<SimpleProcessor<A>>({
      [SimpleProcessorSymbol]: SimpleProcessorSymbol,
      spanExporter,
      spanProcessor
    })
  })

export function SimpleProcessor<R, E, A extends SpanExporter>(
  tag: Tag<SimpleProcessor<A>>,
  exporter: M.Managed<R, E, A>
) {
  return L.fromManaged(tag)(makeSimpleProcessor(exporter))
}

export const ConsoleSimpleTag = tag<SimpleProcessor<ConsoleSpanExporter>>()

export const LiveConsoleSimple = SimpleProcessor(
  ConsoleSimpleTag,
  M.succeedWith(() => new ConsoleSpanExporter())
)
