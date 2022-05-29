/**
 * @tsplus type effect/otel-exporter-jaeger/JaegerTracingSimpleProcessor.Ops
 */
export interface JaegerTracingSimpleProcessorOps {}
export const JaegerTracingSimpleProcessor: JaegerTracingSimpleProcessorOps = {}

/**
 * @tsplus static effect/otel-exporter-jaeger/JaegerTracingSimpleProcessor.Ops Live
 */
export const LiveJaegerTracingSimpleProcessor = SimpleProcessor.make(JaegerTracingSpanExporter.make)
