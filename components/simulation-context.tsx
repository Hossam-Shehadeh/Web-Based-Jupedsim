"use client"

import { useEffect } from "react"
import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"
import { isInsideWalkableArea } from "../utils/simulationUtils"
// Update the imports to use the communication manager
import communicationManager from "../utils/communication-manager"

export type ElementType =
  | "STREET_LINE"
  | "FREE_LINE"
  | "START_POINT"
  | "SOURCE_RECTANGLE"
  | "OBSTACLE"
  | "EXIT_POINT"
  | "WAYPOINT"

export type GeometryType = "STREET_LINE" | "FREE_LINE"

export type Point = {
  x: number
  y: number
}

export type Element = {
  id: string
  type: ElementType
  points: Point[]
  properties?: {
    agentCount?: number
    connections?: string[]
    [key: string]: any
  }
}

export type SimulationModel = {
  id: string
  name: "CollisionFreeSpeedModel" | "CollisionFreeSpeedModel" | "GeneralizedCentrifugalForceModel" | "SocialForceModel"
  description?: string
}

export type Agent = {
  id: string
  position: Point
  radius: number
  velocity?: Point
}

export type SimulationFrame = {
  time: number
  agents: Agent[]
}

type AlertType = "warning" | "info" | "success" | "error"

type SimulationContextType = {
  elements: Element[]
  selectedTool: ElementType | "SELECT" | "DELETE" | null
  selectedElement: Element | null
  isDrawing: boolean
  simulationModels: SimulationModel[]
  selectedModel: SimulationModel | null
  geometryType: GeometryType
  setGeometryType: (type: GeometryType) => void
  setSelectedTool: (tool: ElementType | "SELECT" | "DELETE" | null) => void
  addElement: (element: Omit<Element, "id">) => Element
  updateElement: (id: string, updates: Partial<Element>) => void
  deleteElement: (id: string) => void
  selectElement: (element: Element | null) => void
  setIsDrawing: (isDrawing: boolean) => void
  setSelectedModel: (model: SimulationModel) => void
  connectWaypoints: (sourceId: string, targetId: string) => void
  isSimulationRunning: boolean
  startSimulation: () => void
  stopSimulation: () => void
  deleteSimulation: () => void
  simulationSpeed: number
  setSimulationSpeed: (speed: number) => void
  runSimulation: () => Promise<void>
  agents: Agent[]
  setAgents: React.Dispatch<React.SetStateAction<Agent[]>>
  error: string | null
  setError: (error: string | null) => void
  currentFrame: number
  setCurrentFrame: React.Dispatch<React.SetStateAction<number>>
  simulationTime: number
  setSimulationTime: (time: number) => void
  isPlaying: boolean
  setIsPlaying: (isPlaying: boolean) => void
  simulationFrames: SimulationFrame[]
  isLoading: boolean
  validateDrawing: (point: Point, type: ElementType) => boolean
  backendAvailable: boolean
  alertMessage: string | null
  setAlertMessage: (message: string | null) => void
  showAlert: (message: string, type?: AlertType) => void
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined)

export const useSimulation = () => {
  const context = useContext(SimulationContext)
  if (!context) {
    throw new Error("useSimulation must be used within a SimulationProvider")
  }
  return context
}

export const SimulationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [elements, setElements] = useState<Element[]>([])
  const [selectedTool, setSelectedTool] = useState<ElementType | "SELECT" | "DELETE" | null>(null)
  const [selectedElement, setSelectedElement] = useState<Element | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [geometryType, setGeometryType] = useState<GeometryType>("STREET_LINE")
  const [simulationModels, setSimulationModels] = useState<SimulationModel[]>([
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
  ])
  const [selectedModel, setSelectedModel] = useState<SimulationModel | null>(simulationModels[0])
  const [isSimulationRunning, setIsSimulationRunning] = useState(false)
  const [simulationSpeed, setSimulationSpeed] = useState(1.4)
  const [agents, setAgents] = useState<Agent[]>([])
  const [error, setError] = useState<string | null>(null)
  const [currentFrame, setCurrentFrame] = useState(0)
  const [simulationTime, setSimulationTime] = useState(10)
  const [isPlaying, setIsPlaying] = useState(false)
  const [simulationFrames, setSimulationFrames] = useState<SimulationFrame[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [backendAvailable, setBackendAvailable] = useState(false)
  // Add a new state for alert messages
  const [alertMessage, setAlertMessage] = useState<string | null>(null)

  // Show alert with type
  const showAlert = useCallback((message: string, type: AlertType = "warning") => {
    setAlertMessage(`${type}:${message}`)
  }, [])

  // Initialize WebSocket connection
  useEffect(() => {
    // No need to explicitly connect, the communication manager handles this
    // Just set up periodic health checks
    const checkBackendAvailability = async () => {
      try {
        const healthData = await communicationManager.checkHealth()

        if (healthData.status === "ok") {
          setBackendAvailable(true)
          console.log("Backend is available", healthData)
        } else {
          setBackendAvailable(false)
          console.warn("Backend returned an error status", healthData)
        }
      } catch (error) {
        setBackendAvailable(false)
        console.warn("Backend is not available:", error)
      }
    }

    checkBackendAvailability()

    // Set up periodic health checks
    const intervalId = setInterval(checkBackendAvailability, 30000) // Check every 30 seconds
    return () => clearInterval(intervalId)
  }, [])

  // Check if backend is available using WebSocket
  const checkBackendAvailability = async () => {
    try {
      // Try to use WebSocket for health check with fallback to HTTP
      const healthData = await communicationManager.checkHealth()

      if (healthData.status === "ok") {
        setBackendAvailable(true)
        console.log("Backend is available", healthData)
      } else {
        setBackendAvailable(false)
        console.warn("Backend returned an error status", healthData)
      }
    } catch (error) {
      setBackendAvailable(false)
      console.warn("Backend is not available:", error)
    }
  }

  // Check if backend is available using WebSocket
  useEffect(() => {
    const checkBackendAvailabilityWrapper = async () => {
      await checkBackendAvailability()
    }

    checkBackendAvailabilityWrapper()

    // Set up periodic health checks
    const intervalId = setInterval(checkBackendAvailabilityWrapper, 30000) // Check every 30 seconds
    return () => clearInterval(intervalId)
  }, [])

  // Fetch model information from the backend when available
  useEffect(() => {
    const fetchModels = async () => {
      if (!backendAvailable) {
        console.log("Backend not available, using default models")
        return
      }

      try {
        setIsLoading(true)

        try {
          const modelsData = await communicationManager.getModels()

          if (modelsData.models && Array.isArray(modelsData.models)) {
            setSimulationModels(modelsData.models)
            if (modelsData.models.length > 0) {
              setSelectedModel(modelsData.models[0])
            }
            console.log("Fetched models from backend:", modelsData.models)
          } else {
            console.warn("Invalid models data format:", modelsData)
            showAlert("Received invalid model data. Using default models.", "warning")
          }
        } catch (error) {
          console.warn("Failed to fetch model information:", error)
          showAlert("Failed to connect to backend. Using default models.", "warning")
        } finally {
          setIsLoading(false)
        }
      } catch (error) {
        console.warn("Failed to fetch model information:", error)
        showAlert("Failed to connect to backend. Using default models.", "warning")
        setIsLoading(false)
      }
    }

    fetchModels()
  }, [backendAvailable, showAlert])

  const addElement = useCallback((element: Omit<Element, "id">) => {
    const newElement = {
      ...element,
      id: Math.random().toString(36).substring(2, 9),
    }
    setElements((prev) => [...prev, newElement])
    return newElement
  }, [])

  const updateElement = useCallback((id: string, updates: Partial<Element>) => {
    setElements((prev) => prev.map((element) => (element.id === id ? { ...element, ...updates } : element)))
  }, [])

  const deleteElement = useCallback((id: string) => {
    setElements((prev) => prev.filter((element) => element.id !== id))
    setElements((prev) =>
      prev.map((element) => {
        if (element.properties?.connections?.includes(id)) {
          return {
            ...element,
            properties: {
              ...element.properties,
              connections: element.properties.connections.filter((connId) => connId !== id),
            },
          }
        }
        return element
      }),
    )
  }, [])

  const selectElement = useCallback((element: Element | null) => {
    setSelectedElement(element)
  }, [])

  const connectWaypoints = useCallback((sourceId: string, targetId: string) => {
    setElements((prev) =>
      prev.map((element) => {
        if (element.id === sourceId) {
          const connections = element.properties?.connections || []
          if (!connections.includes(targetId)) {
            return {
              ...element,
              properties: {
                ...element.properties,
                connections: [...connections, targetId],
              },
            }
          }
        }
        return element
      }),
    )
  }, [])

  const startSimulation = useCallback(() => {
    setIsSimulationRunning(true)
    setIsPlaying(true)
  }, [])

  const stopSimulation = useCallback(() => {
    setIsSimulationRunning(false)
    setIsPlaying(false)
    setCurrentFrame(0)
  }, [])

  const deleteSimulation = useCallback(() => {
    setIsSimulationRunning(false)
    setIsPlaying(false)
    setElements([])
    setAgents([])
    setCurrentFrame(0)
    setSimulationTime(10)
    setSimulationFrames([])
  }, [])

  // Enhance the mock data generation to create more realistic simulations
  const generateMockSimulationData = useCallback(() => {
    const frames: SimulationFrame[] = []
    const totalFrames = 100
    const timeStep = 0.1

    // Find start points and source rectangles
    const startPoints = elements.filter((el) => el.type === "START_POINT")
    const sourceRects = elements.filter((el) => el.type === "SOURCE_RECTANGLE")

    // Find exit points to use as targets
    const exitPoints = elements.filter((el) => el.type === "EXIT_POINT")
    const targetPositions =
      exitPoints.length > 0
        ? exitPoints.map((exit) => {
            // For exit points, use the midpoint of the line
            if (exit.points.length >= 2) {
              return {
                x: (exit.points[0].x + exit.points[1].x) / 2,
                y: (exit.points[0].y + exit.points[1].y) / 2,
              }
            }
            return exit.points[0]
          })
        : [{ x: 400, y: 300 }]

    // Create initial agents
    const initialAgents: Agent[] = []

    // Add agents from start points
    startPoints.forEach((startPoint, index) => {
      // Check if the start point is in a valid position
      if (
        isInsideWalkableArea(startPoint.points[0], elements) &&
        !isPointNearObstacle(startPoint.points[0], elements, 30)
      ) {
        initialAgents.push({
          id: `agent-start-${index}`,
          position: { ...startPoint.points[0] },
          radius: 5 + Math.random() * 3,
          velocity: { x: 0, y: 0 },
        })
      }
    })

    // Add agents from source rectangles
    sourceRects.forEach((source, sourceIndex) => {
      if (source.points.length >= 2) {
        const x1 = Math.min(source.points[0].x, source.points[1].x)
        const y1 = Math.min(source.points[0].y, source.points[1].y)
        const width = Math.abs(source.points[1].x - source.points[0].x)
        const height = Math.abs(source.points[1].y - source.points[0].y)

        const agentCount = source.properties?.agentCount || 10

        for (let i = 0; i < agentCount; i++) {
          // Try to find a valid position within the source rectangle
          let validPosition = false
          let position = { x: 0, y: 0 }
          let attempts = 0

          while (!validPosition && attempts < 15) {
            position = {
              x: x1 + Math.random() * width,
              y: y1 + Math.random() * height,
            }

            // Check if position is valid (inside walkable area and not too close to obstacles)
            validPosition = isInsideWalkableArea(position, elements) && !isPointNearObstacle(position, elements, 30)
            attempts++
          }

          // If we couldn't find a valid position, skip this agent
          if (!validPosition) continue

          initialAgents.push({
            id: `agent-source-${sourceIndex}-${i}`,
            position,
            radius: 5 + Math.random() * 3,
            velocity: { x: 0, y: 0 },
          })
        }
      }
    })

    // If no agents were created, add some default ones
    if (initialAgents.length === 0) {
      for (let i = 0; i < 10; i++) {
        const position = {
          x: 100 + Math.random() * 200,
          y: 100 + Math.random() * 200,
        }

        // Only add if position is valid
        if (isInsideWalkableArea(position, elements)) {
          initialAgents.push({
            id: `agent-default-${i}`,
            position,
            radius: 5 + Math.random() * 3,
            velocity: { x: 0, y: 0 },
          })
        }
      }
    }

    // Generate agent paths with obstacle avoidance and waypoint navigation
    const agentPaths: { [id: string]: Point[] } = {}

    initialAgents.forEach((agent) => {
      // Assign a random target
      const target = targetPositions[Math.floor(Math.random() * targetPositions.length)]

      // Use our improved findPath function from simulationUtils
      // This will use waypoints if available and handle obstacle avoidance
      const pathPoints = Math.ceil(totalFrames * 0.7) // Use fewer points than frames for smoother movement
      agentPaths[agent.id] = findPath(agent.position, target, elements, pathPoints)
    })

    // Generate frames with moving agents
    let currentAgents = [...initialAgents]

    for (let i = 0; i < totalFrames; i++) {
      const time = i * timeStep
      const frameAgents = []

      for (const agent of currentAgents) {
        const path = agentPaths[agent.id]
        if (!path) continue

        // Calculate progress through the path
        const pathProgress = Math.min(i / totalFrames, 1)
        const pathIndex = Math.min(Math.floor(pathProgress * path.length), path.length - 1)

        // Get current position from path
        const currentPos = path[pathIndex]

        // Calculate velocity if not the last point
        let velocity = { x: 0, y: 0 }
        if (pathIndex < path.length - 1) {
          const nextPos = path[pathIndex + 1]
          velocity = {
            x: (nextPos.x - currentPos.x) / timeStep,
            y: (nextPos.y - currentPos.y) / timeStep,
          }
        }

        frameAgents.push({
          ...agent,
          position: currentPos,
          velocity,
        })
      }

      frames.push({ time, agents: frameAgents })

      // Filter out agents that have reached their destination
      currentAgents = frameAgents.filter((agent) => {
        const path = agentPaths[agent.id]
        const pathIndex = Math.floor((i / totalFrames) * path.length)
        return pathIndex < path.length - 1
      })

      // If all agents have reached their destinations, stop generating frames
      if (currentAgents.length === 0) {
        break
      }
    }

    return frames
  }, [elements])

  // Helper function to generate a path with randomness
  const generatePath = (start: Point, end: Point, steps: number): Point[] => {
    const path: Point[] = []
    const dx = (end.x - start.x) / steps
    const dy = (end.y - start.y) / steps

    const current = { ...start }
    for (let i = 0; i <= steps; i++) {
      path.push({ x: current.x, y: current.y })
      current.x += dx + (Math.random() - 0.5) * 10 // Add some randomness
      current.y += dy + (Math.random() - 0.5) * 10 // Add some randomness
    }
    return path
  }

  // Run the simulation using WebSocket
  const runSimulation = useCallback(async () => {
    if (isSimulationRunning) {
      stopSimulation()
      return
    }

    try {
      setError(null)
      setIsLoading(true)

      // Check if we have necessary elements
      const hasStartPoints = elements.some((el) => el.type === "START_POINT" || el.type === "SOURCE_RECTANGLE")
      const hasExitPoints = elements.some((el) => el.type === "EXIT_POINT")
      const hasWalkableAreas = elements.some((el) => el.type === "STREET_LINE" || el.type === "FREE_LINE")

      if (!hasWalkableAreas) {
        setError("Please define walkable areas using Street Lines or Free Lines")
        setIsLoading(false)
        return
      }

      if (!hasStartPoints) {
        setError("Please add at least one start point or source")
        setIsLoading(false)
        return
      }

      if (!hasExitPoints) {
        setError("Please add at least one exit point")
        setIsLoading(false)
        return
      }

      // If backend is not available or we're in demo mode, use mock data
      if (!backendAvailable) {
        console.log("Backend not available, using mock simulation data")
        showAlert("Backend not available. Running in demo mode.", "info")
        const mockFrames = generateMockSimulationData()
        setSimulationFrames(mockFrames)

        if (mockFrames.length > 0) {
          setAgents(mockFrames[0].agents)
        }

        startSimulation()
        setCurrentFrame(0)
        setIsLoading(false)
        return
      }

      // Prepare the simulation data
      const simulationData = {
        elements,
        simulationSpeed,
        selectedModel: selectedModel?.name,
        simulationTime,
        timeStep: 0.05, // 50ms time step
      }

      console.log("Sending simulation request")

      try {
        // Run simulation via communication manager
        const data = await communicationManager.runSimulation(simulationData)

        console.log("Received simulation data:", data)

        // Check if we got mock data
        if (data.warning && data.isMockData) {
          showAlert("Backend connection failed. Running in demo mode.", "warning")
        }

        // Process the simulation data
        if (data.frames && Array.isArray(data.frames)) {
          setSimulationFrames(data.frames)

          // Set the first frame's agents
          if (data.frames.length > 0) {
            setAgents(data.frames[0].agents)
          }

          // Start the simulation
          startSimulation()
          setCurrentFrame(0)
          showAlert("Simulation started successfully", "success")
        } else {
          throw new Error("Invalid simulation data format")
        }
      } catch (error) {
        console.error("Error running simulation:", error)
        showAlert(
          `Communication error: ${error instanceof Error ? error.message : String(error)}. Running in demo mode.`,
          "warning",
        )

        // Fallback to demo mode
        const mockFrames = generateMockSimulationData()
        setSimulationFrames(mockFrames)

        if (mockFrames.length > 0) {
          setAgents(mockFrames[0].agents)
        }

        startSimulation()
        setCurrentFrame(0)
      }

      setIsLoading(false)
    } catch (error) {
      console.error("Error running simulation:", error)
      setIsSimulationRunning(false)
      setIsLoading(false)
      setError(`An error occurred: ${error instanceof Error ? error.message : String(error)}`)
    }
  }, [
    isSimulationRunning,
    elements,
    stopSimulation,
    startSimulation,
    selectedModel,
    simulationSpeed,
    simulationTime,
    backendAvailable,
    generateMockSimulationData,
    showAlert,
  ])

  const validateDrawing = useCallback(
    (point: Point, type: ElementType): boolean => {
      // For walkable areas (STREET_LINE, FREE_LINE), always allow drawing
      if (type === "STREET_LINE" || type === "FREE_LINE") {
        return true
      }

      // For other elements, check if they're within walkable areas
      // If no walkable areas exist yet, allow drawing anywhere
      const walkableElements = elements.filter((el) => el.type === "STREET_LINE" || el.type === "FREE_LINE")
      if (walkableElements.length === 0) {
        return true
      }

      // For EXIT_POINT, allow drawing anywhere
      if (type === "EXIT_POINT") {
        return true
      }

      // For other elements, check if they're within walkable areas
      return isInsideWalkableArea(point, elements)
    },
    [elements],
  )

  const contextValue: SimulationContextType = {
    elements,
    selectedTool,
    selectedElement,
    isDrawing,
    simulationModels,
    selectedModel,
    geometryType,
    setGeometryType,
    setSelectedTool,
    addElement,
    updateElement,
    deleteElement,
    selectElement,
    setIsDrawing,
    setSelectedModel,
    connectWaypoints,
    isSimulationRunning,
    startSimulation,
    stopSimulation,
    deleteSimulation,
    simulationSpeed,
    setSimulationSpeed,
    runSimulation,
    agents,
    setAgents,
    error,
    setError,
    currentFrame,
    setCurrentFrame,
    simulationTime,
    setSimulationTime,
    isPlaying,
    setIsPlaying,
    simulationFrames,
    isLoading,
    validateDrawing,
    backendAvailable,
    alertMessage,
    setAlertMessage,
    showAlert,
  }

  return <SimulationContext.Provider value={contextValue}>{children}</SimulationContext.Provider>
}

// Helper function to check if a point is near an obstacle
const isPointNearObstacle = (point: Point, elements: Element[], distance: number): boolean => {
  const obstacles = elements.filter((el) => el.type === "OBSTACLE")

  for (const obstacle of obstacles) {
    if (obstacle.points.length >= 2) {
      const x1 = Math.min(obstacle.points[0].x, obstacle.points[1].x)
      const y1 = Math.min(obstacle.points[0].y, obstacle.points[1].y)
      const width = Math.abs(obstacle.points[1].x - obstacle.points[0].x)
      const height = Math.abs(obstacle.points[1].y - obstacle.points[0].y)

      if (
        point.x >= x1 - distance &&
        point.x <= x1 + width + distance &&
        point.y >= y1 - distance &&
        point.y <= y1 + height + distance
      ) {
        return true
      }
    }
  }

  return false
}

// Helper function to find a path with obstacle avoidance
const findPath = (start: Point, end: Point, elements: Element[], steps: number): Point[] => {
  const path: Point[] = []
  let current = { ...start }

  for (let i = 0; i < steps; i++) {
    // Calculate direction vector
    let dx = end.x - current.x
    let dy = end.y - current.y

    // Normalize direction vector
    const magnitude = Math.sqrt(dx * dx + dy * dy)
    if (magnitude === 0) break
    dx /= magnitude
    dy /= magnitude

    // Move a small step
    const stepSize = 5
    let next = {
      x: current.x + dx * stepSize,
      y: current.y + dy * stepSize,
    }

    // Check for obstacles
    if (isPointNearObstacle(next, elements, 5)) {
      // Try to move sideways
      const sideStepSize = 3
      let nextSide = {
        x: current.x - dy * sideStepSize,
        y: current.y + dx * sideStepSize,
      }

      if (!isPointNearObstacle(nextSide, elements, 5)) {
        next = nextSide
      } else {
        nextSide = {
          x: current.x + dy * sideStepSize,
          y: current.y - dx * sideStepSize,
        }

        if (!isPointNearObstacle(nextSide, elements, 5)) {
          next = nextSide
        } else {
          // If we can't move sideways, just stay where we are
          next = current
        }
      }
    }

    path.push(next)
    current = next
  }

  return path
}
