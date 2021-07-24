// tracing: off

import { pipe } from "@effect-ts/core"
import * as T from "@effect-ts/core/Effect"
import * as L from "@effect-ts/core/Effect/Layer"
import * as M from "@effect-ts/core/Effect/Managed"
import { identity } from "@effect-ts/core/Function"
import { tag } from "@effect-ts/core/Has"
import * as O from "@effect-ts/core/Option"
import * as OT from "@effect-ts/otel"
import type { NodeTracerConfig } from "@opentelemetry/node"
import { NodeTracerProvider } from "@opentelemetry/node"

export interface NodeTracerProviderConfig {
  readonly config: NodeTracerConfig
}

export const NodeTracerProviderConfig = tag<NodeTracerProviderConfig>()

export const LiveNodeTracerProviderConfig = (config: NodeTracerConfig) =>
  L.pure(NodeTracerProviderConfig)({ config })

export const makeNodeTracingProvider = M.gen(function* (_) {
  const env = yield* _(T.environment())
  const config = pipe(
    NodeTracerProviderConfig.readOption(env),
    O.map((_) => _.config),
    O.toUndefined
  )
  const tracerProvider = yield* _(T.succeedWith(() => new NodeTracerProvider(config)))

  yield* _(T.succeedWith(() => tracerProvider.register()))

  return identity<OT.TracerProvider>({
    [OT.TracerProviderSymbol]: OT.TracerProviderSymbol,
    tracerProvider
  })
})

export const NodeProviderLayer = L.fromManaged(OT.TracerProvider)(
  makeNodeTracingProvider
)

export const NodeProvider = (config?: NodeTracerConfig) =>
  config
    ? NodeProviderLayer["<<<"](LiveNodeTracerProviderConfig(config))
    : NodeProviderLayer
