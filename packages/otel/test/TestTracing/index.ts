import * as T from "@effect-ts/core/Effect"
import * as L from "@effect-ts/core/Effect/Layer"
import * as M from "@effect-ts/core/Effect/Managed"
import { identity } from "@effect-ts/core/Function"
import { tag } from "@effect-ts/core/Has"
import { AtomicReference } from "@effect-ts/core/Support/AtomicReference"
import type { _A } from "@effect-ts/core/Utils"
import { ExportResultCode } from "@opentelemetry/core"
import type { ReadableSpan, SpanExporter } from "@opentelemetry/sdk-trace-base"
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node"

import * as OT from "../../src"

export const makeNodeTracingProvider = M.gen(function* (_) {
  const tracerProvider = yield* _(T.succeedWith(() => new NodeTracerProvider()))

  yield* _(T.succeedWith(() => tracerProvider.register()))

  return identity<OT.TracerProvider>({
    serviceId: OT.TracerProviderServiceId,
    tracerProvider
  })
})

export const NodeProvider = L.fromManaged(OT.TracerProvider)(makeNodeTracingProvider)

export const TestSpanRepoServiceId = Symbol()

export const makeTestSpanRepo = T.succeedWith(() => {
  const current = new AtomicReference<readonly ReadableSpan[]>([])

  return {
    serviceId: TestSpanRepoServiceId,
    current,
    getSpans: T.succeedWith(() => current.get),
    clear: T.succeedWith(() => current.set([]))
  } as const
})

export interface TestSpanRepo extends _A<typeof makeTestSpanRepo> {}
export const TestSpanRepo = tag<TestSpanRepo>(TestSpanRepoServiceId)
export const LiveTestSpanRepo = L.fromEffect(TestSpanRepo)(makeTestSpanRepo)

export const TestSimple = OT.SimpleProcessor(
  M.accessService(TestSpanRepo)(
    ({ current }): SpanExporter => ({
      shutdown: () => Promise.resolve(void 0),
      export: (spans, cb) => {
        current.set([...current.get, ...spans])
        cb({ code: ExportResultCode.SUCCESS })
      }
    })
  )
)

export const TestTracing = LiveTestSpanRepo[">+>"](
  OT.LiveTracer["<<<"](NodeProvider[">+>"](TestSimple))
)

export function cleanTracesAfter<R, E, A>(eff: T.Effect<R, E, A>) {
  return T.gen(function* (_) {
    const { clear } = yield* _(TestSpanRepo)
    const done = yield* _(T.result(eff))
    yield* _(clear)
    return yield* _(T.done(done))
  })
}

export const { getSpans } = T.deriveLifted(TestSpanRepo)([], ["getSpans"], [])
