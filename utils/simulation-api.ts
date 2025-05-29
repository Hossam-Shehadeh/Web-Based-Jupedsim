import { apiGet, apiPost } from "./api"
import type { Element, SimulationModel, SimulationFrame, SocialForceParameters } from "../types/simulationTypes"

/**
 * API response types
 */
interface HealthResponse {
  status: string
  jupedsim_available: boolean
  version: string
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
 * Check if the backend is available and JuPedSim is installed
 */
export async function checkBackendHealth(): Promise<{
  available: boolean
  jupedsimAvailable: boolean
  version?: string
}> {
  try {
    const data = await apiGet<HealthResponse>("/api/health", {}, 5000)
    return {
      available: data.status === "ok",
      jupedsimAvailable: data.jupedsim_available,
      version: data.version,
    }
  } catch (error) {
    console.warn("Backend health check failed:", error)
    return { available: false, jupedsimAvailable: false }
  }
}

/**
 * Get available simulation models from JuPedSim
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
 * Run a simulation using JuPedSim on the backend
 */
export async function runSimulation(
  elements: Element[],
  modelName: string,
  simulationSpeed: number,
  simulationTime: number,
  socialForceParams: SocialForceParameters,
  timeStep = 0.05,
): Promise<SimulationResponse> {
  try {
    const payload = {
      elements,
      simulationSpeed,
      selectedModel: modelName,
      simulationTime,
      timeStep,
      socialForceParams,
    }

    return await apiPost<SimulationResponse>("/api/simulate", payload, {}, 60000) // 60 second timeout
  } catch (error) {
    console.error("Failed to run simulation:", error)
    throw error
  }
}

/**
 * Get detailed JuPedSim information from the backend
 */
export async function getJuPedSimInfo(): Promise<any> {
  try {
    return await apiGet("/api/jupedsim-info")
  } catch (error) {
    console.error("Failed to get JuPedSim info:", error)
    throw error
  }
}
