import { pipe } from "@effect-ts/core"
import * as T from "@effect-ts/core/Effect"
import * as FS from "@effect-ts/node/FileSystem"

import { LiveTracedFS } from "../src"
import { provideJaegerTracing } from "./jaeger"

const program = pipe(
  FS.fileExists("/workspace/node-otel/demo/index.ts"),
  T.chain(() => FS.fileExists("/workspace/node-otel/demo/index.ts"))
)

const main = pipe(
  program,
  T.provideSomeLayer(LiveTracedFS),
  provideJaegerTracing("demo")
)

it("should trace", async () => {
  await T.runPromise(main)
})
