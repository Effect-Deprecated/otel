// tracing: off

import * as T from "@effect-ts/core/Effect"
import * as L from "@effect-ts/core/Effect/Layer"
import * as M from "@effect-ts/core/Effect/Managed"
import { identity } from "@effect-ts/core/Function"
import * as OT from "@effect-ts/otel"
import { NodeTracerProvider } from "@opentelemetry/node"

export const makeNodeTracingProvider = M.gen(function* (_) {
  const tracerProvider = yield* _(T.succeedWith(() => new NodeTracerProvider()))

  yield* _(T.succeedWith(() => tracerProvider.register()))

  return identity<OT.TracerProvider>({
    [OT.TracerProviderSymbol]: OT.TracerProviderSymbol,
    tracerProvider
  })
})

export const NodeProvider = L.fromManaged(OT.TracerProvider)(makeNodeTracingProvider)
