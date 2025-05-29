"use client"

import { useEffect } from "react"
import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"

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
  name:
    | "CollisionFreeSpeedModel"
    | "CollisionFreeSpeedModelV2"
    | "GeneralizedCentrifugalForceModel"
    | "SocialForceModel"
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
  selectedTool: ElementType | "SELECT" | "DELETE" | "MOVE" | null
  selectedElement: Element | null
  isDrawing: boolean
  simulationModels: SimulationModel[]
  selectedModel: SimulationModel | null
  geometryType: GeometryType
  setGeometryType: (type: GeometryType) => void
  setSelectedTool: (tool: ElementType | "SELECT" | "DELETE" | "MOVE" | null) => void
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
  orderedWaypoints: string[]
  setOrderedWaypoints: (waypoints: string[]) => void
  addToOrderedWaypoints: (waypointId: string) => void
  removeFromOrderedWaypoints: (waypointId: string) => void
  reorderWaypoints: (startIndex: number, endIndex: number) => void
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
  const [selectedTool, setSelectedTool] = useState<ElementType | "SELECT" | "DELETE" | "MOVE" | null>(null)
  const [selectedElement, setSelectedElement] = useState<Element | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [geometryType, setGeometryType] = useState<GeometryType>("STREET_LINE")
  const [simulationModels, setSimulationModels] = useState<SimulationModel[]>([
    { id: "1", name: "CollisionFreeSpeedModel" },
    { id: "2", name: "CollisionFreeSpeedModelV2" },
    { id: "3", name: "GeneralizedCentrifugalForceModel" },
    { id: "4", name: "SocialForceModel" },
  ])
  const [selectedModel, setSelectedModel] = useState<SimulationModel | null>(simulationModels[0])
  const [isSimulationRunning, setIsSimulationRunning] = useState(false)
  const [simulationSpeed, setSimulationSpeed] = useState(1.0)
  const [agents, setAgents] = useState<Agent[]>([])
  const [error, setError] = useState<string | null>(null)
  const [currentFrame, setCurrentFrame] = useState(0)
  const [simulationTime, setSimulationTime] = useState(10)
  const [isPlaying, setIsPlaying] = useState(false)
  const [simulationFrames, setSimulationFrames] = useState<SimulationFrame[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [backendAvailable, setBackendAvailable] = useState(false)
  const [alertMessage, setAlertMessage] = useState<string | null>(null)
  const [orderedWaypoints, setOrderedWaypoints] = useState<string[]>([])

  const showAlert = useCallback((message: string, type: AlertType = "warning") => {
    setAlertMessage(`${type}:${message}`)
  }, [])

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
    setAgents([])
    setSimulationFrames([])
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

  const runSimulation = useCallback(async () => {
    // If simulation is already running, stop it
    if (isSimulationRunning) {
      stopSimulation()
      return
    }

    // Validate that we have the necessary elements
    const hasWalkableAreas = elements.some((el) => el.type === "STREET_LINE" || el.type === "FREE_LINE")
    const hasStartPoints = elements.some((el) => el.type === "START_POINT" || el.type === "SOURCE_RECTANGLE")
    const hasExitPoints = elements.some((el) => el.type === "EXIT_POINT")

    if (!hasWalkableAreas) {
      setError("Please define walkable areas using Street Lines or Free Lines")
      return
    }

    if (!hasStartPoints) {
      setError("Please add at least one start point or source rectangle")
      return
    }

    if (!hasExitPoints) {
      setError("Please add at least one exit point")
      return
    }

    setIsLoading(true)
    setError(null)
    console.log("Starting simulation...")

    try {
      // Generate mock simulation data after a short delay
      setTimeout(() => {
        setIsLoading(false)

        // Generate mock agents
        const mockAgents: Agent[] = []
        const mockFrames: SimulationFrame[] = []

        // Find start points to generate agents from
        const startPoints = elements.filter((el) => el.type === "START_POINT")
        console.log("Found start points:", startPoints.length)

        // Find source rectangles to generate agents from
        const sourceRects = elements.filter((el) => el.type === "SOURCE_RECTANGLE")
        console.log("Found source rectangles:", sourceRects.length)

        // Find exit points
        const exitPoints = elements.filter((el) => el.type === "EXIT_POINT")
        console.log("Found exit points:", exitPoints.length)

        // Create agents from start points
        let agentId = 0
        for (const startPoint of startPoints) {
          if (startPoint.points.length > 0) {
            // Vary agent sizes slightly
            const radius = 5 + Math.random() * 2 // Between 5-7

            mockAgents.push({
              id: `agent-${agentId++}`,
              position: { ...startPoint.points[0] },
              radius: radius,
            })
          }
        }

        // Create agents from source rectangles
        for (const source of sourceRects) {
          if (source.points.length >= 2) {
            const agentCount = source.properties?.agentCount || 10
            console.log(`Creating ${agentCount} agents from source rectangle`)
            const x1 = Math.min(source.points[0].x, source.points[1].x)
            const y1 = Math.min(source.points[0].y, source.points[1].y)
            const width = Math.abs(source.points[1].x - source.points[0].x)
            const height = Math.abs(source.points[1].y - source.points[0].y)

            for (let i = 0; i < agentCount; i++) {
              // Vary agent sizes slightly
              const radius = 5 + Math.random() * 2 // Between 5-7

              mockAgents.push({
                id: `agent-${agentId++}`,
                position: {
                  x: x1 + Math.random() * width,
                  y: y1 + Math.random() * height,
                },
                radius: radius,
              })
            }
          }
        }

        // If no agents were created from start points or sources, create default agents
        if (mockAgents.length === 0) {
          console.log("No agents created from start points or sources, creating default agents")
          // Create 10 default agents at random positions
          for (let i = 0; i < 10; i++) {
            mockAgents.push({
              id: `agent-${i}`,
              position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
              radius: 6, // Make agents smaller (changed from 10 to 6)
            })
          }
        }

        console.log(`Created ${mockAgents.length} agents`)

        // Find paths for each agent to the nearest exit
        const agentPaths: Record<string, Point[]> = {}

        mockAgents.forEach((agent) => {
          // Find the nearest exit
          let nearestExit: Point | null = null
          let minDistance = Number.POSITIVE_INFINITY

          exitPoints.forEach((exit) => {
            if (exit.points.length >= 2) {
              // Use the center of the exit
              const exitCenter = {
                x: (exit.points[0].x + exit.points[1].x) / 2,
                y: (exit.points[0].y + exit.points[1].y) / 2,
              }

              const dist = Math.sqrt(
                Math.pow(agent.position.x - exitCenter.x, 2) + Math.pow(agent.position.y - exitCenter.y, 2),
              )

              if (dist < minDistance) {
                minDistance = dist
                nearestExit = exitCenter
              }
            }
          })

          // If no exit found, use a default position
          if (!nearestExit && exitPoints.length === 0) {
            nearestExit = { x: 400, y: 300 }
          }

          if (nearestExit) {
            // Generate a simple path from agent to exit
            const path: Point[] = []
            const steps = 100
            for (let i = 0; i <= steps; i++) {
              const t = i / steps
              path.push({
                x: agent.position.x + (nearestExit.x - agent.position.x) * t,
                y: agent.position.y + (nearestExit.y - agent.position.y) * t,
              })
            }
            agentPaths[agent.id] = path
          }
        })

        // Create simulation frames based on the model
        const totalFrames = 200 // More frames for smoother animation
        const modelName = selectedModel?.name || "CollisionFreeSpeedModel"

        for (let frameIdx = 0; frameIdx < totalFrames; frameIdx++) {
          const frameAgents: Agent[] = []
          const time = frameIdx * 0.1 // 0.1 seconds per frame

          mockAgents.forEach((agent) => {
            const path = agentPaths[agent.id]
            if (!path) return

            // Calculate progress along the path based on the model
            let pathProgress: number
            let speedFactor = simulationSpeed // Use simulation speed as a factor

            // If simulation speed is 0, don't move
            if (simulationSpeed <= 0) {
              pathProgress = 0
            } else {
              // Different models have different movement patterns
              switch (modelName) {
                case "CollisionFreeSpeedModel":
                  // Linear movement with slight acceleration
                  pathProgress = Math.min((frameIdx / totalFrames) * 1.2 * speedFactor, 1)
                  break

                case "CollisionFreeSpeedModelV2":
                  // Smoother acceleration and deceleration
                  pathProgress = Math.min(0.5 * (1 - Math.cos((Math.PI * frameIdx) / totalFrames)) * speedFactor, 1)
                  break

                case "GeneralizedCentrifugalForceModel":
                  // More variable speed with social forces
                  const phase = frameIdx / totalFrames
                  speedFactor = speedFactor * (1.0 + 0.2 * Math.sin(phase * 10)) // Oscillating speed
                  pathProgress = Math.min(phase * speedFactor, 1)
                  break

                case "SocialForceModel":
                  // Social forces model with more interaction between agents
                  pathProgress = Math.min(
                    (frameIdx / totalFrames) * (1 + 0.1 * Math.sin(frameIdx * 0.2)) * speedFactor,
                    1,
                  )
                  break

                default:
                  pathProgress = Math.min((frameIdx / totalFrames) * speedFactor, 1)
              }
            }

            // Get position along the path
            const pathIndex = Math.min(Math.floor(pathProgress * path.length), path.length - 1)
            const currentPos = path[pathIndex]

            // Calculate velocity vector if not at the end of the path
            let velocity: Point | undefined
            if (pathIndex < path.length - 1 && simulationSpeed > 0) {
              const nextPos = path[pathIndex + 1]
              velocity = {
                x: (nextPos.x - currentPos.x) / 0.1, // 0.1 seconds per frame
                y: (nextPos.y - currentPos.y) / 0.1,
              }
            } else {
              velocity = { x: 0, y: 0 } // No velocity when speed is 0
            }

            // Add agent to the frame
            frameAgents.push({
              ...agent,
              position: currentPos,
              velocity,
            })
          })

          // Add the frame
          mockFrames.push({
            time,
            agents: frameAgents,
          })
        }

        console.log(`Created ${mockFrames.length} simulation frames`)

        // Important: Set these in the correct order
        setSimulationFrames(mockFrames)

        // Only set agents if we have frames
        if (mockFrames.length > 0) {
          setAgents(mockFrames[0].agents)
        }

        // Start the simulation after setting the agents and frames
        setIsSimulationRunning(true)
        setIsPlaying(true)
        setCurrentFrame(0)

        console.log("Simulation started with", mockAgents.length, "agents")
      }, 2000)
    } catch (error) {
      setIsLoading(false)
      setError(`Simulation error: ${error instanceof Error ? error.message : String(error)}`)
      console.error("Simulation error:", error)
    }
  }, [elements, selectedModel, stopSimulation, simulationSpeed])

  const validateDrawing = useCallback((point: Point, type: ElementType): boolean => {
    return true
  }, [])

  useEffect(() => {
    setBackendAvailable(true)
  }, [])

  const addToOrderedWaypoints = useCallback((waypointId: string) => {
    setOrderedWaypoints((prev) => {
      if (prev.includes(waypointId)) return prev
      return [...prev, waypointId]
    })
  }, [])

  const removeFromOrderedWaypoints = useCallback((waypointId: string) => {
    setOrderedWaypoints((prev) => prev.filter((id) => id !== waypointId))
  }, [])

  const reorderWaypoints = useCallback((startIndex: number, endIndex: number) => {
    setOrderedWaypoints((prev) => {
      const result = Array.from(prev)
      const [removed] = result.splice(startIndex, 1)
      result.splice(endIndex, 0, removed)
      return result
    })
  }, [])

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
    orderedWaypoints,
    setOrderedWaypoints,
    addToOrderedWaypoints,
    removeFromOrderedWaypoints,
    reorderWaypoints,
  }

  return <SimulationContext.Provider value={contextValue}>{children}</SimulationContext.Provider>
}

export { SimulationContext }
