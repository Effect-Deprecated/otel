import * as T from "@effect-ts/core/Effect"
import * as L from "@effect-ts/core/Effect/Layer"
import { pipe } from "@effect-ts/core/Function"
import type { Has } from "@effect-ts/core/Has"
import * as FS from "@effect-ts/node/FileSystem"
import * as OT from "@effect-ts/otel"
import type * as OTApi from "@opentelemetry/api"

export const makeTracedFS = T.gen(function* (_) {
  const fsService = yield* _(FS.FS)
  const otelTracer = yield* _(OT.Tracer)

  function withSpan(
    name: string,
    options?: OTApi.SpanOptions | undefined
  ): <R, E, A>(effect: T.Effect<R & Has<OT.Span>, E, A>) => T.Effect<R, E, A> {
    return (effect) =>
      pipe(
        OT.withSpan(name, options)(effect),
        T.provideServiceM(OT.Tracer)(
          T.accessM((env) => {
            const alreadyPresent = OT.Tracer.readOption(env)
            return alreadyPresent._tag === "Some"
              ? T.succeed(alreadyPresent.value)
              : T.succeed(otelTracer)
          })
        )
      )
  }

  const patchedFS: FS.FS = {
    serviceId: fsService.serviceId,
    access: (path, mode) =>
      withSpan("access", { attributes: { path: path.toString(), mode } })(
        fsService.access(path, mode)
      ),
    fileExists: (path) =>
      withSpan("node.fs.fileExists", { attributes: { path: path.toString() } })(
        fsService.fileExists(path)
      ),
    readFile: (path, flag) =>
      withSpan("node.fs.readFile", { attributes: { path: path.toString(), flag } })(
        fsService.readFile(path, flag)
      ),
    rm: (path, options) =>
      withSpan("node.fs.rm", {
        attributes: { path: path.toString(), options: JSON.stringify(options) }
      })(fsService.rm(path, options)),
    writeFile: (path, data, flag) =>
      withSpan("node.fs.writeFile", {
        attributes: { path: path.toString(), flag: JSON.stringify(flag) }
      })(fsService.writeFile(path, data, flag)),
    stat: (path) =>
      withSpan("node.fs.stat", { attributes: { path: path.toString() } })(
        fsService.stat(path)
      )
  }

  return patchedFS
})

export const TracedFS = L.fromEffect(FS.FS)(makeTracedFS).setKey(
  Symbol.for("effect-ts/node-otel/TracedFS")
)
export const LiveTracedFS = FS.LiveFS[">>>"](TracedFS)
