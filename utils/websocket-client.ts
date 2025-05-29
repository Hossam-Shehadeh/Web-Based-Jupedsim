/**
 * WebSocket client for communication with the backend
 */

// Types for WebSocket messages
export type WebSocketMessage = {
  type: string
  payload: any
}

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

export type SimulationModel = {
  id: string
  name: string
  description: string
}

// WebSocket client class
export class WebSocketClient {
  private socket: WebSocket | null = null
  private messageQueue: WebSocketMessage[] = []
  private isConnecting = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectTimeout: NodeJS.Timeout | null = null
  private eventListeners: { [key: string]: ((data: any) => void)[] } = {}
  private url: string

  constructor(url?: string) {
    this.url = url || this.getWebSocketUrl()
  }

  // Convert HTTP URL to WebSocket URL
  private getWebSocketUrl(): string {
    // Check if we're in a browser environment
    if (typeof window === "undefined") {
      return "ws://localhost:3000/api/ws"
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    const host = window.location.host
    return `${protocol}//${host}/api/ws`
  }

  // Connect to the WebSocket server
  public connect(): Promise<void> {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return Promise.resolve()
    }

    if (this.isConnecting) {
      return new Promise((resolve) => {
        const checkConnection = setInterval(() => {
          if (this.socket?.readyState === WebSocket.OPEN) {
            clearInterval(checkConnection)
            resolve()
          }
        }, 100)
      })
    }

    this.isConnecting = true

    return new Promise((resolve, reject) => {
      try {
        console.log(`Attempting to connect to WebSocket at: ${this.url}`)
        this.socket = new WebSocket(this.url)

        this.socket.onopen = () => {
          console.log("WebSocket connection established")
          this.isConnecting = false
          this.reconnectAttempts = 0

          // Send any queued messages
          while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift()
            if (message) this.sendMessage(message)
          }

          resolve()
        }

        this.socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as WebSocketMessage
            this.handleMessage(message)
          } catch (error) {
            console.error("Error parsing WebSocket message:", error)
          }
        }

        this.socket.onerror = (error) => {
          console.error("WebSocket error:", error)
          this.isConnecting = false

          // Fall back to HTTP for health checks and other operations
          console.log("Falling back to HTTP requests due to WebSocket error")

          // Don't reject the promise, as we'll fall back to HTTP
          resolve()
        }

        this.socket.onclose = (event) => {
          console.log(`WebSocket connection closed: ${event.code} ${event.reason}`)
          this.socket = null
          this.isConnecting = false

          // Attempt to reconnect if not closed cleanly
          if (event.code !== 1000 && event.code !== 1001) {
            this.attemptReconnect()
          }
        }

        // Add a timeout for the connection attempt
        setTimeout(() => {
          if (this.socket?.readyState !== WebSocket.OPEN) {
            console.log("WebSocket connection attempt timed out")
            this.isConnecting = false

            // Don't reject, we'll fall back to HTTP
            resolve()
          }
        }, 5000)
      } catch (error) {
        console.error("Error creating WebSocket:", error)
        this.isConnecting = false

        // Don't reject, we'll fall back to HTTP
        resolve()
      }
    })
  }

  // Attempt to reconnect with exponential backoff
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log("Maximum reconnect attempts reached")
      return
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
    console.log(`Attempting to reconnect in ${delay}ms...`)

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++
      this.connect().catch(() => {
        // Connection failed, will try again
      })
    }, delay)
  }

  // Close the WebSocket connection
  public disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    if (this.socket) {
      this.socket.close(1000, "Client disconnected")
      this.socket = null
    }
  }

  // Send a message to the server
  public sendMessage(message: WebSocketMessage): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this.messageQueue.push(message)
      this.connect().catch(console.error)
      return
    }

    this.socket.send(JSON.stringify(message))
  }

  // Handle incoming messages
  private handleMessage(message: WebSocketMessage): void {
    const listeners = this.eventListeners[message.type] || []
    listeners.forEach((listener) => listener(message.payload))
  }

  // Add event listener for specific message types
  public on(type: string, callback: (data: any) => void): void {
    if (!this.eventListeners[type]) {
      this.eventListeners[type] = []
    }
    this.eventListeners[type].push(callback)
  }

  // Remove event listener
  public off(type: string, callback: (data: any) => void): void {
    if (!this.eventListeners[type]) return
    this.eventListeners[type] = this.eventListeners[type].filter((cb) => cb !== callback)
  }

  // Check backend health
  public async checkHealth(): Promise<HealthCheckResponse> {
    // If WebSocket is not connected, fall back to HTTP
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.log("WebSocket not connected, falling back to HTTP for health check")
      return this.checkHealthHttp()
    }

    return new Promise((resolve, reject) => {
      const messageId = `health-${Date.now()}`

      const handleResponse = (data: HealthCheckResponse) => {
        this.off(messageId, handleResponse)
        resolve(data)
      }

      this.on(messageId, handleResponse)

      // Set timeout for health check
      const timeout = setTimeout(() => {
        this.off(messageId, handleResponse)
        console.log("WebSocket health check timed out, falling back to HTTP")
        this.checkHealthHttp().then(resolve).catch(reject)
      }, 5000)

      this.sendMessage({
        type: "health-check",
        payload: { messageId },
      })

      // Clear timeout when response is received
      this.on(messageId, () => clearTimeout(timeout))
    })
  }

  // Add HTTP fallback for health check
  private async checkHealthHttp(): Promise<HealthCheckResponse> {
    try {
      const response = await fetch("/api/health", {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      })

      if (!response.ok) {
        return {
          status: "error",
          jupedsim_available: false,
        }
      }

      return await response.json()
    } catch (error) {
      console.error("HTTP health check failed:", error)
      return {
        status: "error",
        jupedsim_available: false,
      }
    }
  }

  // Get simulation models
  public async getModels(): Promise<ModelsResponse> {
    // If WebSocket is not connected, fall back to HTTP
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.log("WebSocket not connected, falling back to HTTP for models")
      return this.getModelsHttp()
    }

    return new Promise((resolve, reject) => {
      const messageId = `models-${Date.now()}`

      const handleResponse = (data: ModelsResponse) => {
        this.off(messageId, handleResponse)
        resolve(data)
      }

      this.on(messageId, handleResponse)

      // Set timeout for models request
      const timeout = setTimeout(() => {
        this.off(messageId, handleResponse)
        console.log("WebSocket models request timed out, falling back to HTTP")
        this.getModelsHttp().then(resolve).catch(reject)
      }, 5000)

      this.sendMessage({
        type: "get-models",
        payload: { messageId },
      })

      // Clear timeout when response is received
      this.on(messageId, () => clearTimeout(timeout))
    })
  }

  // Add HTTP fallback for models
  private async getModelsHttp(): Promise<ModelsResponse> {
    try {
      const response = await fetch("/api/models", {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      })

      if (!response.ok) {
        return {
          models: this.getDefaultModels(),
        }
      }

      return await response.json()
    } catch (error) {
      console.error("HTTP models request failed:", error)
      return {
        models: this.getDefaultModels(),
      }
    }
  }

  // Run simulation
  public async runSimulation(simulationData: any): Promise<SimulationResponse> {
    // If WebSocket is not connected, fall back to HTTP
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.log("WebSocket not connected, falling back to HTTP for simulation")
      return this.runSimulationHttp(simulationData)
    }

    return new Promise((resolve, reject) => {
      const messageId = `simulation-${Date.now()}`

      const handleResponse = (data: SimulationResponse) => {
        this.off(messageId, handleResponse)
        resolve(data)
      }

      this.on(messageId, handleResponse)

      // Set timeout for simulation request (longer timeout for simulations)
      const timeout = setTimeout(() => {
        this.off(messageId, handleResponse)
        console.log("WebSocket simulation request timed out, falling back to HTTP")
        this.runSimulationHttp(simulationData).then(resolve).catch(reject)
      }, 30000)

      this.sendMessage({
        type: "run-simulation",
        payload: {
          messageId,
          ...simulationData,
        },
      })

      // Clear timeout when response is received
      this.on(messageId, () => clearTimeout(timeout))
    })
  }

  // Add HTTP fallback for simulation
  private async runSimulationHttp(simulationData: any): Promise<SimulationResponse> {
    try {
      const response = await fetch("/api/simulate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(simulationData),
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("HTTP simulation request failed:", error)
      throw error
    }
  }

  // Helper method to get default models
  private getDefaultModels(): SimulationModel[] {
    return [
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
    ]
  }
}

// Create a singleton instance
export const websocketClient = new WebSocketClient()

// Export default instance
export default websocketClient
