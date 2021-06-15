// tracing: off

import * as T from "@effect-ts/core/Effect"
import * as L from "@effect-ts/core/Effect/Layer"
import * as M from "@effect-ts/core/Effect/Managed"
import { identity } from "@effect-ts/core/Function"
import { tag } from "@effect-ts/core/Has"
import type * as OTTracing from "@opentelemetry/tracing"

import { TracerProvider } from "../TracerProvider"

export const TracerSymbol = Symbol()
export type TracerSymbol = typeof TracerSymbol

export interface Tracer {
  readonly [TracerSymbol]: TracerSymbol
  readonly tracer: OTTracing.Tracer
}

export const Tracer = tag<Tracer>()

export const makeTracer = (name: string) =>
  M.gen(function* (_) {
    const { tracerProvider } = yield* _(TracerProvider)

    const tracer = yield* _(T.succeedWith(() => tracerProvider.getTracer(name)))

    return identity<Tracer>({
      [TracerSymbol]: TracerSymbol,
      tracer
    })
  })

export const LiveTracer = L.fromManaged(Tracer)(makeTracer("@effect-ts/otel/Tracer"))

export const { tracer: withTracer } = T.deriveAccessM(Tracer)(["tracer"])