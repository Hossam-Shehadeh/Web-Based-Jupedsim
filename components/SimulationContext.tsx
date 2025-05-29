"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect } from "react"
import type {
  ElementType,
  Element,
  SimulationModel,
  Point,
  Agent,
  SimulationFrame,
  SocialForceParameters,
  RoomGraph,
} from "../types/simulationTypes"

export type GeometryType = "STREET_LINE" | "FREE_LINE"

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
  addToOrderedWaypoints: (waypointId: string) => void
  removeFromOrderedWaypoints: (waypointId: string) => void
  clearOrderedWaypoints: () => void
  socialForceParams: SocialForceParameters
  setSocialForceParams: (params: Partial<SocialForceParameters>) => void
  maxSimulationTime: number
  setMaxSimulationTime: (time: number) => void
  roomGraph: RoomGraph
  updateRoomGraph: () => void
  connectRooms: (roomId: string, doorId: string, targetRoomId: string) => void
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
  const [selectedModel, setSelectedModel] = useState<SimulationModel | null>(simulationModels[3]) // Default to Social Force Model
  const [isSimulationRunning, setIsSimulationRunning] = useState(false)
  const [simulationSpeed, setSimulationSpeed] = useState(1.0)
  const [agents, setAgents] = useState<Agent[]>([])
  const [error, setError] = useState<string | null>(null)
  const [currentFrame, setCurrentFrame] = useState(0)
  const [simulationTime, setSimulationTime] = useState(0)
  const [maxSimulationTime, setMaxSimulationTime] = useState(300) // 5 minutes default max time
  const [isPlaying, setIsPlaying] = useState(false)
  const [simulationFrames, setSimulationFrames] = useState<SimulationFrame[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [backendAvailable, setBackendAvailable] = useState(false)
  const [alertMessage, setAlertMessage] = useState<string | null>(null)
  const [orderedWaypoints, setOrderedWaypoints] = useState<string[]>([])
  const [socialForceParams, setSocialForceParamsState] = useState<SocialForceParameters>({
    desiredSpeed: 1.4, // m/s
    relaxationTime: 0.5, // s
    repulsionStrength: 2.0,
    repulsionRange: 0.4, // m
    attractionStrength: 1.0,
    obstacleRepulsionStrength: 10.0,
    obstacleRepulsionRange: 0.2, // m
    doorAttractionStrength: 3.0,
    doorAttractionRange: 5.0, // m
    randomForce: 0.1,
  })

  // Room graph for navigation
  const [roomGraph, setRoomGraph] = useState<RoomGraph>({
    rooms: new Map(),
    doors: new Map(),
    connections: new Map(),
  })

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
    // Don't connect if source and target are the same
    if (sourceId === targetId) return

    setElements((prev) =>
      prev.map((element) => {
        // Add connection from source to target
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

        // Add connection from target to source (bidirectional)
        if (element.id === targetId) {
          const connections = element.properties?.connections || []
          if (!connections.includes(sourceId)) {
            return {
              ...element,
              properties: {
                ...element.properties,
                connections: [...connections, sourceId],
              },
            }
          }
        }

        return element
      }),
    )
  }, [])

  const connectRooms = useCallback((roomId: string, doorId: string, targetRoomId: string) => {
    // Update the door to connect the two rooms
    updateElement(doorId, {
      properties: {
        roomId: roomId,
        targetRoomId: targetRoomId,
      },
    })

    // Update the room graph
    updateRoomGraph()
  }, [])

  const updateRoomGraph = useCallback(() => {
    const rooms = new Map<string, Element>()
    const doors = new Map<string, Element>()
    const connections = new Map<string, string[]>()

    // First, collect all rooms and doors
    elements.forEach((element) => {
      if (element.type === "ROOM") {
        rooms.set(element.id, element)
        connections.set(element.id, [])
      } else if (element.type === "DOOR") {
        doors.set(element.id, element)
      }
    })

    // Then, build the connections
    doors.forEach((door) => {
      const roomId = door.properties?.roomId
      const targetRoomId = door.properties?.targetRoomId

      if (roomId && targetRoomId) {
        // Add bidirectional connections
        const roomConnections = connections.get(roomId) || []
        if (!roomConnections.includes(targetRoomId)) {
          connections.set(roomId, [...roomConnections, targetRoomId])
        }

        const targetConnections = connections.get(targetRoomId) || []
        if (!targetConnections.includes(roomId)) {
          connections.set(targetRoomId, [...targetConnections, roomId])
        }
      }
    })

    setRoomGraph({ rooms, doors, connections })
  }, [elements])

  // Update room graph when elements change
  useEffect(() => {
    updateRoomGraph()
  }, [elements, updateRoomGraph])

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
    setSimulationTime(0)
  }, [])

  const deleteSimulation = useCallback(() => {
    setIsSimulationRunning(false)
    setIsPlaying(false)
    setElements([])
    setAgents([])
    setCurrentFrame(0)
    setSimulationTime(0)
    setSimulationFrames([])
  }, [])

  const setSocialForceParams = useCallback((params: Partial<SocialForceParameters>) => {
    setSocialForceParamsState((prev) => ({
      ...prev,
      ...params,
    }))
  }, [])

  const runSimulation = useCallback(async () => {
    // If simulation is already running, stop it
    if (isSimulationRunning) {
      stopSimulation()
      return
    }

    // Validate that we have the necessary elements
    const hasRooms = elements.some((el) => el.type === "ROOM")
    const hasDoors = elements.some((el) => el.type === "DOOR")

    if (!hasRooms) {
      setError("Please define at least one room")
      return
    }

    if (!hasDoors) {
      setError("Please define at least one door")
      return
    }

    setIsLoading(true)
    setError(null)
    console.log("Starting simulation...")

    try {
      // Generate mock simulation data after a short delay
      setTimeout(() => {
        setIsLoading(false)
        setSimulationTime(0)

        // Start the simulation
        setIsSimulationRunning(true)
        setIsPlaying(true)
        setCurrentFrame(0)

        console.log("Simulation started")
      }, 1000)
    } catch (error) {
      setIsLoading(false)
      setError(`Simulation error: ${error instanceof Error ? error.message : String(error)}`)
      console.error("Simulation error:", error)
    }
  }, [elements, isSimulationRunning, stopSimulation])

  const validateDrawing = useCallback((point: Point, type: ElementType): boolean => {
    return true
  }, [])

  useEffect(() => {
    setBackendAvailable(true)
  }, [])

  const addToOrderedWaypoints = useCallback((waypointId: string) => {
    setOrderedWaypoints((prev) => {
      // Don't add if already in the list
      if (prev.includes(waypointId)) return prev
      return [...prev, waypointId]
    })
  }, [])

  const removeFromOrderedWaypoints = useCallback((waypointId: string) => {
    setOrderedWaypoints((prev) => prev.filter((id) => id !== waypointId))
  }, [])

  const clearOrderedWaypoints = useCallback(() => {
    setOrderedWaypoints([])
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
    addToOrderedWaypoints,
    removeFromOrderedWaypoints,
    clearOrderedWaypoints,
    socialForceParams,
    setSocialForceParams,
    maxSimulationTime,
    setMaxSimulationTime,
    roomGraph,
    updateRoomGraph,
    connectRooms,
  }

  return <SimulationContext.Provider value={contextValue}>{children}</SimulationContext.Provider>
}

export { SimulationContext }
