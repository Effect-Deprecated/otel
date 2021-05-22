/* eslint-disable */
const grpc = require("grpc")
const { NodeTracerProvider } = require("@opentelemetry/node")
const { registerInstrumentations } = require("@opentelemetry/instrumentation")
const { SimpleSpanProcessor } = require("@opentelemetry/tracing")
const { CollectorTraceExporter } = require("@opentelemetry/exporter-collector-grpc")
const opentelemetry = require("@opentelemetry/api")

const metadata = new grpc.Metadata()
metadata.set("x-honeycomb-team", "59bd780d9f223110684d4161227ec1fc")
metadata.set("x-honeycomb-dataset", "test-1")

const provider = new NodeTracerProvider()
provider.addSpanProcessor(
  new SimpleSpanProcessor(
    new CollectorTraceExporter({
      serviceName: "node-otlp",
      url: "api.honeycomb.io:443",
      credentials: grpc.credentials.createSsl(),
      metadata
    })
  )
)
provider.register()

registerInstrumentations({
  tracerProvider: provider
})

async function main() {
  const tracer = opentelemetry.trace.getTracer("example-basic-tracer-node")

  const span = tracer.startSpan("main")
  span.span.setAttribute("some", "ok")

  span.end()
}

main().catch((e) => console.log(e))
{}