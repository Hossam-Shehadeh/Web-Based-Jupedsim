import { apiGet, apiPost } from "./api"
import type { Element, SimulationModel, SimulationFrame } from "../components/simulation-context"

/**
 * API response types
 */
interface HealthResponse {
  status: string
  jupedsim_available: boolean
}

interface ModelsResponse {
  models: SimulationModel[]
}

interface SimulationResponse {
  frames: SimulationFrame[]
  metadata: {
    simulationTime: number
    timeStep: number
    modelName: string
    agentCount: number
  }
}

/**
 * Check if the backend is available
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const data = await apiGet<HealthResponse>("/api/health", {}, 5000)
    return data.status === "ok"
  } catch (error) {
    console.warn("Backend health check failed:", error)
    return false
  }
}

/**
 * Get available simulation models
 */
export async function getSimulationModels(): Promise<SimulationModel[]> {
  try {
    const data = await apiGet<ModelsResponse>("/api/models")
    return data.models
  } catch (error) {
    console.error("Failed to fetch simulation models:", error)
    throw error
  }
}

/**
 * Run a simulation
 */
export async function runSimulation(
  elements: Element[],
  modelName: string,
  simulationSpeed: number,
  simulationTime: number,
  timeStep = 0.05,
): Promise<SimulationResponse> {
  try {
    const payload = {
      elements,
      simulationSpeed,
      selectedModel: modelName,
      simulationTime,
      timeStep,
    }

    return await apiPost<SimulationResponse>("/api/simulate", payload, {}, 30000)
  } catch (error) {
    console.error("Failed to run simulation:", error)
    throw error
  }
}
