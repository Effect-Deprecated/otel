// tracing: off

import { tag } from "@effect-ts/core/Has"
import type { BasicTracerProvider } from "@opentelemetry/tracing"

//
// Tracing Provider
//

export const TracerProviderSymbol = Symbol()
export type TracerProviderSymbol = typeof TracerProviderSymbol

export interface TracerProvider {
  readonly [TracerProviderSymbol]: TracerProviderSymbol
  readonly tracerProvider: BasicTracerProvider
}

export const TracerProvider = tag<TracerProvider>()
