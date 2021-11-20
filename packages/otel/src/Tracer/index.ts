// ets_tracing: off

import * as T from "@effect-ts/core/Effect"
import * as L from "@effect-ts/core/Effect/Layer"
import * as M from "@effect-ts/core/Effect/Managed"
import { identity } from "@effect-ts/core/Function"
import type { Has, Service } from "@effect-ts/core/Has"
import { tag } from "@effect-ts/core/Has"
import type * as OTTracing from "@opentelemetry/sdk-trace-base"

import { TracerProvider } from "../TracerProvider"

export const TracerServiceId = Symbol()

export interface Tracer extends Service<typeof TracerServiceId> {
  readonly tracer: OTTracing.Tracer
}

export type HasTracer = Has<Tracer>

export const Tracer = tag<Tracer>(TracerServiceId)

export const makeTracer = (name: string) =>
  M.gen(function* (_) {
    const { tracerProvider } = yield* _(TracerProvider)

    const tracer = yield* _(T.succeedWith(() => tracerProvider.getTracer(name)))

    // TODO PR
    return identity<Tracer>({
      [TracerServiceId]: TracerServiceId,
      tracer
    })
  })

export const LiveTracer = L.fromManaged(Tracer)(makeTracer("@effect-ts/otel/Tracer"))

export const { tracer: withTracer } = T.deriveAccessM(Tracer)(["tracer"])
