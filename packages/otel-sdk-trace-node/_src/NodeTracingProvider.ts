import type { NodeTracerConfig } from "@opentelemetry/sdk-trace-node"
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node"

/**
 * @tsplus type effect/otel-sdk-trace-node/NodeTracingProviderConfig
 */
export interface NodeTracingProviderConfig extends NodeTracerConfig {}

/**
 * @tsplus type effect/otel-sdk-trace-node/NodeTracingProviderConfig.Ops
 */
export interface NodeTracingProviderConfigOps {
  readonly Tag: Service.Tag<NodeTracingProviderConfig>
}
export const NodeTracingProviderConfig: NodeTracingProviderConfigOps = {
  Tag: Service.Tag<NodeTracingProviderConfig>()
}

/**
 * @tsplus static effect/otel-sdk-trace-node/NodeTracingProviderConfig.Ops Live
 */
export function LiveNodeTracerProviderConfig(config: NodeTracerConfig) {
  return Effect.succeed(config).toLayer(NodeTracingProviderConfig.Tag)
}

/**
 * @tsplus type effect/otel-sdk-trace-node/NodeTracingProvider
 */
export interface NodeTracingProvider extends NodeTracerProvider {}

/**
 * @tsplus type effect/otel-sdk-trace-node/NodeTracingProvider.Ops
 */
export interface NodeTracingProviderOps {
  readonly Tag: Service.Tag<NodeTracingProvider>
}
export const NodeTracingProvider: NodeTracingProviderOps = {
  Tag: Service.Tag<NodeTracingProvider>()
}

/**
 * @tsplus static effect/otel-sdk-trace-node/NodeTracingProvider.Ops make
 */
export const makeNodeTracingProvider = Do(($) => {
  const env = $(Effect.environment())
  const config = env.getOption(NodeTracingProviderConfig.Tag)
  return $(Effect.succeed(new NodeTracerProvider(config.value)))
})

/**
 * @tsplus static effect/otel-sdk-trace-node/NodeTracingProvider.Ops Live
 */
export function LiveNodeTracingProvider(config?: NodeTracerConfig) {
  const NodeTracingProviderLayer = Layer.fromEffect(NodeTracingProvider.Tag)(NodeTracingProvider.make)
  return config != null ?
    NodeTracingProviderConfig.Live(config) >> NodeTracingProviderLayer :
    NodeTracingProviderLayer
}
