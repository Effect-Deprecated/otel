import * as T from "@effect-ts/core/Effect"
import { pipe } from "@effect-ts/core/Function"

import { ConsoleSimpleTracing, withSpan } from "./tracer"

///

const program = pipe(
  T.succeedWith(() => {
    console.log("Hey!!!")
    throw new Error("jesus")
  }),
  T.delay(200),
  withSpan("my beautiful span")
)

pipe(program, T.provideSomeLayer(ConsoleSimpleTracing), T.runFiber)
