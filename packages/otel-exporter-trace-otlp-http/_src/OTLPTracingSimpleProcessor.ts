/**
 * @tsplus type effect/otel-exporter-trace-otlp-http/OTLPTracingSimpleProcessor.Ops
 */
export interface OTLPTracingSimpleProcessorOps {}
export const OTLPTracingSimpleProcessor: OTLPTracingSimpleProcessorOps = {}

/**
 * @tsplus static effect/otel-exporter-trace-otlp-http/OTLPTracingSimpleProcessor.Ops Live
 */
export const LiveOTLPTracingSimpleProcessor = SimpleProcessor.make(OTLPTracingSpanExporter.make)
