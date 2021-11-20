// ets_tracing: off

import type { Service } from "@effect-ts/core/Has"
import { tag } from "@effect-ts/core/Has"
import type { BasicTracerProvider } from "@opentelemetry/sdk-trace-base"

//
// ets_tracing Provider
//

export const TracerProviderServiceId = Symbol()

export interface TracerProvider extends Service<typeof TracerProviderServiceId> {
  readonly tracerProvider: BasicTracerProvider
}

export const TracerProvider = tag<TracerProvider>(TracerProviderServiceId)
