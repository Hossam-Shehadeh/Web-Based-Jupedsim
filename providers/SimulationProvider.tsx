"use client"

import { SimulationProvider as SimulationContextProvider } from "@/components/SimulationContext"
import type { ReactNode } from "react"

export function SimulationProvider({ children }: { children: ReactNode }) {
  return <SimulationContextProvider>{children}</SimulationContextProvider>
}
