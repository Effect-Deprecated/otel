import * as T from "@effect-ts/core/Effect"
import { pipe } from "@effect-ts/core/Function"
import * as R from "@effect-ts/node/Runtime"
import { credentials, Metadata } from "@grpc/grpc-js"

import { grpcConfigM, GRPCSimpleProcessor } from "./grpc"
import { jaegerConfigM, JaegerSimpleProcessor } from "./jaeger"
import {
  addAttribute,
  addEvent,
  ConsoleSimpleProcessor,
  LiveOtelTracer,
  NodeTracingProvider,
  withSpan
} from "./tracer"

///

const program = withSpan(`SPSPSPSPSPSP`)(
  pipe(
    T.tuplePar(
      pipe(addEvent("Doing A"), T.delay(200), withSpan("A")),
      pipe(
        T.gen(function* (_) {
          yield* _(addEvent("Doing B"))
          yield* _(addAttribute("some-attr", "some val"))
        }),
        T.delay(200),
        withSpan("B")
      )
    ),
    T.zipRight(pipe(addEvent("Doing C"), T.delay(200), withSpan("C"))),
    T.zipRight(pipe(addEvent("Doing D"), T.delay(200), withSpan("D")))
  )
)

const GrpcTracing = grpcConfigM(
  T.succeedWith(() => {
    const metadata = new Metadata()
    metadata.set("x-honeycomb-team", "59bd780d9f223110684d4161227ec1fc")
    metadata.set("x-honeycomb-dataset", "effect")

    return {
      serviceName: "nod-otlp-effect",
      url: "api.honeycomb.io:443",
      credentials: credentials.createSsl(),
      metadata
    }
  })
)[">>>"](GRPCSimpleProcessor)

export const JaegerTracing = jaegerConfigM(
  T.succeedWith(() => ({
    serviceName: "my-service",
    host: "localhost",
    port: 6832
  }))
)[">>>"](JaegerSimpleProcessor)

export const TracingAllInOne = NodeTracingProvider[">+>"](
  GrpcTracing["+++"](ConsoleSimpleProcessor)["+++"](JaegerTracing)
)[">>>"](LiveOtelTracer)

pipe(program, T.provideSomeLayer(TracingAllInOne), R.runMain)
