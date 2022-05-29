import type { Tracer as OTTracer } from "@opentelemetry/sdk-trace-base"

/**
 * @tsplus type effect/otel/Tracer
 */
export interface Tracer extends OTTracer {}

/**
 * @tsplus type effect/otel/Tracer.Ops
 */
export interface TracerOps {
  readonly Tag: Service.Tag<Tracer>
}
export const Tracer: TracerOps = {
  Tag: Service.Tag<Tracer>()
}

/**
 * @tsplus static effect/otel/Tracer.Ops make
 */
export function make(name: string): Effect<Service.Has<TracerProvider>, never, Tracer> {
  return Do(($) => {
    const tracerProvider = $(Effect.service(TracerProvider.Tag))
    return $(Effect.succeed(tracerProvider.getTracer(name)))
  })
}

/**
 * @tsplus static effect/otel/Tracer.Ops Live
 */
export const LiveTracer = Tracer.make("@effect/otel/Tracer").toLayer(Tracer.Tag)
