import type {
  Attributes,
  AttributeValue,
  Span as OTSpan,
  SpanOptions as OTSpanOptions,
  TimeInput
} from "@opentelemetry/api"
import { context, SpanStatusCode, trace } from "@opentelemetry/api"

/**
 * @tsplus type effect/otel/Span
 */
export interface Span extends OTSpan {}

/**
 * @tsplus type effect/otel/Span.Ops
 */
export interface SpanOps {
  readonly $: SpanAspects
  readonly Tag: Service.Tag<Span>
}
export const Span: SpanOps = {
  $: {},
  Tag: Service.Tag<Span>()
}

/**
 * @tsplus type effect/otel/Span.Aspects
 */
export interface SpanAspects {}

/**
 * @tsplus fluent ets/Effect withSpan
 */
export function withSpan_<R, E, A>(
  self: Effect<R & Service.Has<Span>, E, A>,
  name: string,
  options?: OTSpanOptions
): Effect<R & Service.Has<Tracer>, E, A> {
  const createSpan = Effect.serviceWithEffect(Tracer.Tag)((tracer) =>
    Effect.environmentWith((env: Service.Env<R>) => {
      const maybeSpan = env.getOption(Span.Tag)
      if (options != null && options.root != null && !options.root && maybeSpan.isSome()) {
        const ctx = trace.setSpan(context.active(), maybeSpan.value)
        return tracer.startSpan(name, options, ctx)
      }
      return tracer.startSpan(name, { ...options, root: true })
    })
  )
  // TODO(Max/Johannes): remove after provide functions are fixed
  // @ts-expect-error
  return createSpan.acquireUseReleaseExit(
    (span) => self.provideService(Span.Tag)(span),
    (span, exit) =>
      Effect.succeed(() => {
        if (exit.isFailure()) {
          span.setAttribute("error.type", "Fiber failure")
          span.setAttribute("error.message", "An effect has a failure")
          // TODO(Max/Johannes): implement after Cause rendering is complete
          // span.setAttribute("error.stack", "An effect has a failure")
          span.setStatus({ code: SpanStatusCode.ERROR })
        } else {
          span.setStatus({ code: SpanStatusCode.OK })
        }
        span.end()
      })
  )
}

/**
 * @tsplus static ets/Effect/Aspects withSpan
 */
export const withSpan = Pipeable(withSpan_)

/**
 * @tsplus static effect/otel/Span.Ops addAttribute
 */
export function addAttribute(key: string, value: AttributeValue): Effect<Service.Has<Span>, never, void> {
  return Effect.serviceWithEffect(Span.Tag)((span) =>
    Effect.succeed(() => {
      span.setAttribute(key, value)
    })
  )
}

/**
 * @tsplus static effect/otel/Span.Ops addEvent
 */
export function addEvent(
  key: string,
  attributesOrStartTime?: Attributes | TimeInput,
  startTime?: TimeInput
): Effect<Service.Has<Span>, never, void> {
  return Effect.serviceWithEffect(Span.Tag)((span) =>
    Effect.succeed(() => {
      span.addEvent(key, attributesOrStartTime, startTime)
    })
  )
}
