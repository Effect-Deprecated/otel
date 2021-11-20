// ets_tracing: off

import { pipe } from "@effect-ts/core"
import * as T from "@effect-ts/core/Effect"
import * as L from "@effect-ts/core/Effect/Layer"
import * as M from "@effect-ts/core/Effect/Managed"
import { identity } from "@effect-ts/core/Function"
import type { Service } from "@effect-ts/core/Has"
import { tag } from "@effect-ts/core/Has"
import * as O from "@effect-ts/core/Option"
import * as OT from "@effect-ts/otel"
import type { NodeTracerConfig } from "@opentelemetry/sdk-trace-node"
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node"

const NodeTracerProviderConfigServiceId = Symbol()

export interface NodeTracerProviderConfig
  extends Service<typeof NodeTracerProviderConfigServiceId> {
  readonly config: NodeTracerConfig
}

export const NodeTracerProviderConfig = tag<NodeTracerProviderConfig>(
  NodeTracerProviderConfigServiceId
)

export const LiveNodeTracerProviderConfig = (config: NodeTracerConfig) =>
  L.fromValue(NodeTracerProviderConfig)({ config })

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
    serviceId: OT.TracerProviderServiceId,
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
