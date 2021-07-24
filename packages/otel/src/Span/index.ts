// tracing: off

import * as T from "@effect-ts/core/Effect"
import { pretty } from "@effect-ts/core/Effect/Cause"
import { pipe } from "@effect-ts/core/Function"
import type { Has } from "@effect-ts/core/Has"
import { tag } from "@effect-ts/core/Has"
import * as O from "@effect-ts/core/Option"
import type * as OTApi from "@opentelemetry/api"
import { context, trace } from "@opentelemetry/api"

import type { Tracer } from "../Tracer"
import { withTracer } from "../Tracer"

export const SpanSymbol = Symbol()
export type SpanSymbol = typeof SpanSymbol

export class SpanImpl {
  readonly [SpanSymbol] = SpanSymbol
  constructor(readonly span: OTApi.Span) {}
}

export interface Span extends SpanImpl {}

export const Span = tag<Span>()

export function withSpan(name: string, options?: OTApi.SpanOptions) {
  return <R, E, A>(
    effect: T.Effect<R & Has<Span>, E, A>
  ): T.Effect<R & Has<Tracer>, E, A> => {
    const createSpan = withTracer((tracer) =>
      T.access((r: unknown) => {
        const maybeSpan = Span.readOption(r)
        if (options?.root !== true && O.isSome(maybeSpan)) {
          const ctx = trace.setSpan(context.active(), maybeSpan.value.span)
          return tracer.startSpan(name, options, ctx)
        }
        return tracer.startSpan(name, { ...options, root: true })
      })
    )

    return T.bracketExit_(
      createSpan,
      (s) => pipe(effect, T.provideService(Span)(new SpanImpl(s))),
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

export function addAttribute(name: string, value: OTApi.SpanAttributeValue) {
  return T.accessServiceM(Span)((_) =>
    T.succeedWith(() => {
      _.span.setAttribute(name, value)
    })
  )
}

export function addEvent(
  name: string,
  attributesOrStartTime?: OTApi.SpanAttributes | OTApi.TimeInput,
  startTime?: OTApi.TimeInput
) {
  return T.accessServiceM(Span)((_) =>
    T.succeedWith(() => {
      _.span.addEvent(name, attributesOrStartTime, startTime)
    })
  )
}
