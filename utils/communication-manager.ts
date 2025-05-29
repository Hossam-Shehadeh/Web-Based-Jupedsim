/**
 * Communication manager that handles both WebSocket and HTTP communication
 * Provides a unified interface for backend communication with automatic fallback
 */

import websocketClient from "./websocket-client"
import { apiGet, apiPost } from "./http-client"

// Types
export type HealthCheckResponse = {
  status: string
  jupedsim_available: boolean
}

export type ModelsResponse = {
  models: any[]
}

export type SimulationResponse = {
  frames: any[]
  metadata: any
}

// Communication manager class
class CommunicationManager {
  private useWebSocket = true

  constructor() {
    // Try to initialize WebSocket connection
    this.initializeWebSocket()
  }

  // Initialize WebSocket connection
  private async initializeWebSocket(): Promise<void> {
    try {
      await websocketClient.connect()
      this.useWebSocket = true
      console.log("Using WebSocket for backend communication")
    } catch (error) {
      this.useWebSocket = false
      console.warn("WebSocket connection failed, falling back to HTTP:", error)
    }
  }

  // Check backend health
  public async checkHealth(): Promise<HealthCheckResponse> {
    try {
      if (this.useWebSocket) {
        return await websocketClient.checkHealth()
      } else {
        return await apiGet<HealthCheckResponse>("/api/health", {}, 5000)
      }
    } catch (error) {
      console.error("Health check failed:", error)
      return {
        status: "error",
        jupedsim_available: false,
      }
    }
  }

  // Get simulation models
  public async getModels(): Promise<ModelsResponse> {
    try {
      if (this.useWebSocket) {
        return await websocketClient.getModels()
      } else {
        return await apiGet<ModelsResponse>("/api/models", {}, 5000)
      }
    } catch (error) {
      console.error("Failed to get models:", error)
      // Return default models
      return {
        models: [
          {
            id: "1",
            name: "CollisionFreeSpeedModel",
            description: "A speed model that avoids collisions between agents",
          },
          {
            id: "2",
            name: "CollisionFreeSpeedModelV2",
            description: "An improved version of the Collision Free Speed Model",
          },
          {
            id: "3",
            name: "GeneralizedCentrifugalForceModel",
            description: "A force-based model that simulates repulsive forces between agents",
          },
          {
            id: "4",
            name: "SocialForceModel",
            description: "A model based on social forces between pedestrians",
          },
        ],
      }
    }
  }

  // Run simulation
  public async runSimulation(simulationData: any): Promise<SimulationResponse> {
    try {
      if (this.useWebSocket) {
        return await websocketClient.runSimulation(simulationData)
      } else {
        return await apiPost<SimulationResponse>("/api/simulate", simulationData, {}, 30000)
      }
    } catch (error) {
      console.error("Failed to run simulation:", error)
      throw error
    }
  }
}

// Create a singleton instance
export const communicationManager = new CommunicationManager()

// Export default instance
export default communicationManager
