import { cleanTracesAfter, TestSpanRepository, TestTracing } from "@effect/otel/test/TestTracing"

const main = Effect.tuplePar(
  Span.addEvent("Doing A").delay((100).millis).withSpan("A"),
  Span.addEvent("Doing B")
    .zipRight(Span.addAttribute("some-attr", "some val"))
    .delay((100).millis)
    .withSpan("B")
)
  .zipRight(Span.addEvent("Doing C").delay((100).millis).withSpan("C"))
  .zipRight(Span.addEvent("Doing D").delay((100).millis).withSpan("D"))
  .withSpan("RootSpan")

describe.concurrent("OpenTelemetry", () => {
  it("traces a program", async () => {
    const program = Do(($) => {
      $(main.fork())
      $(Effect.sleep((120).millis))
      const r1 = $(TestSpanRepository.getSpans)
      $(Effect.sleep((120).millis))
      const r2 = $(TestSpanRepository.getSpans)
      $(Effect.sleep((120).millis))
      const r3 = $(TestSpanRepository.getSpans)
      return { r1, r2, r3 }
    })
      .awaitAllChildren()
      .apply(cleanTracesAfter)
      .provideLayer(TestTracing)

    const { r1, r2, r3 } = await program.unsafeRunPromise()

    assert.strictEqual(r1.size, 2)
    assert.strictEqual(r2.size, 3)
    assert.strictEqual(r3.size, 5)
  })
})
