import * as T from "@effect-ts/core/Effect"
import { pipe } from "@effect-ts/core/Function"
import * as J from "@effect-ts/jest/Test"

import * as OT from "../src"
import { cleanTracesAfter, getSpans, TestTracing } from "./TestTracing"

const program = OT.withSpan(`RootSpan`)(
  pipe(
    T.tuplePar(
      pipe(OT.addEvent("Doing A"), T.delay(200), OT.withSpan("A")),
      pipe(
        T.gen(function* (_) {
          yield* _(OT.addEvent("Doing B"))
          yield* _(OT.addAttribute("some-attr", "some val"))
        }),
        T.delay(200),
        OT.withSpan("B")
      )
    ),
    T.zipRight(pipe(OT.addEvent("Doing C"), T.delay(200), OT.withSpan("C"))),
    T.zipRight(pipe(OT.addEvent("Doing D"), T.delay(200), OT.withSpan("D")))
  )
)

describe("OpenTelemetry", () => {
  const { it } = J.runtime((TestEnv) => TestEnv[">+>"](TestTracing))

  it("traces program", () =>
    T.gen(function* (_) {
      yield* _(T.fork(program))

      yield* _(J.adjust(200))
      expect((yield* _(getSpans)).length).equals(2)

      yield* _(J.adjust(200))
      expect((yield* _(getSpans)).length).equals(3)

      yield* _(J.adjust(200))
      expect((yield* _(getSpans)).length).equals(5)
    })
      ["|>"](T.awaitAllChildren)
      ["|>"](cleanTracesAfter))
})
