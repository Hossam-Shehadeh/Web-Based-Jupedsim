import SimulationLayout from "@/components/layout/SimulationLayout"
import { SimulationProvider } from "@/providers/SimulationProvider"

export default function SimulationPage() {
  return (
    <SimulationProvider>
      <SimulationLayout />
    </SimulationProvider>
  )
}
