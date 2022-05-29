import { ExportResultCode } from "@opentelemetry/core"
import type { ReadableSpan, SpanExporter } from "@opentelemetry/sdk-trace-base"
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node"

export const NodeProvider = Effect.succeed(new NodeTracerProvider()).toLayer(TracerProvider.Tag)

/**
 * @tsplus type effect/otel/test/TestSpanRepository
 */
export interface TestSpanRepository {
  readonly current: AtomicReference<ImmutableArray<ReadableSpan>>
  readonly getSpans: Effect.UIO<ImmutableArray<ReadableSpan>>
  readonly clear: Effect.UIO<void>
}

/**
 * @tsplus type effect/otel/test/TestSpanRepository.Ops
 */
export interface TestSpanRepositoryOps {
  readonly Tag: Service.Tag<TestSpanRepository>
}
export const TestSpanRepository: TestSpanRepositoryOps = {
  Tag: Service.Tag<TestSpanRepository>()
}

/**
 * @tsplus static effect/otel/test/TestSpanRepository.Ops Live
 */
export const LiveTestSpanRepository = Effect.succeed(() => {
  const current = new AtomicReference<ImmutableArray<ReadableSpan>>(ImmutableArray.empty())
  return {
    current,
    getSpans: Effect.succeed(current.get),
    clear: Effect.succeed(current.set(ImmutableArray.empty()))
  }
}).toLayer(TestSpanRepository.Tag)

/**
 * @tsplus static effect/otel/test/TestSpanRepository.Ops getSpans
 */
export const getSpans = Effect.serviceWithEffect(TestSpanRepository.Tag)((repo) => repo.getSpans)

export const TestSimpleProcessor = SimpleProcessor.make(
  Effect.serviceWith(TestSpanRepository.Tag)(({ current }): SpanExporter => ({
    shutdown: () => Promise.resolve(void 0),
    export: (spans, cb) => {
      current.set(current.get.concat(ImmutableArray.from(spans)))
      cb({ code: ExportResultCode.SUCCESS })
    }
  }))
)

export const TestTracing = LiveTestSpanRepository > Tracer.Live < NodeProvider > TestSimpleProcessor

export function cleanTracesAfter<R, E, A>(self: Effect<R, E, A>) {
  return Do(($) => {
    const repo = $(Effect.service(TestSpanRepository.Tag))
    const done = $(self.exit())
    $(repo.clear)
    return $(Effect.done(done))
  })
}
