"use client"

import { useState, useCallback, useEffect } from "react"
import type { Element, Point, SimulationModel, Agent, SimulationFrame, GeometryType } from "@/types"
import { useToast } from "@/hooks/useToast"
import { isInsideWalkableArea } from "@/lib/geometry"

export function useSimulation() {
  const { toast } = useToast()
  const [elements, setElements] = useState<Element[]>([])
  const [selectedTool, setSelectedTool] = useState<string | null>(null)
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

  // Check backend availability
  useEffect(() => {
    const checkBackendAvailability = async () => {
      try {
        const response = await fetch("/api/health", {
          // Add cache: 'no-store' to prevent caching
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          console.warn(`Health check returned status ${response.status}`)
          setBackendAvailable(false)
          return
        }

        const data = await response.json()
        setBackendAvailable(data.status === "ok" && data.jupedsim_available === true)

        if (data.status !== "ok") {
          console.warn("Backend health check failed:", data.message)
        }
      } catch (error) {
        console.error("Error checking backend availability:", error)
        setBackendAvailable(false)
      }
    }

    checkBackendAvailability()
    const intervalId = setInterval(checkBackendAvailability, 30000) // Check every 30 seconds

    return () => clearInterval(intervalId)
  }, [])

  // Fetch models from backend
  useEffect(() => {
    const fetchModels = async () => {
      if (!backendAvailable) return

      try {
        const response = await fetch("/api/models")
        const data = await response.json()

        if (data.models && Array.isArray(data.models)) {
          setSimulationModels(data.models)
          if (data.models.length > 0) {
            setSelectedModel(data.models[0])
          }
        }
      } catch (error) {
        console.error("Error fetching models:", error)
      }
    }

    fetchModels()
  }, [backendAvailable])

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

  const runSimulation = useCallback(async () => {
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
      toast({
        title: "Missing walkable areas",
        description: "Please define walkable areas using Street Lines or Free Lines",
        variant: "destructive",
      })
      return
    }

    if (!hasStartPoints) {
      setError("Please add at least one start point or source rectangle")
      toast({
        title: "Missing start points",
        description: "Please add at least one start point or source rectangle",
        variant: "destructive",
      })
      return
    }

    if (!hasExitPoints) {
      setError("Please add at least one exit point")
      toast({
        title: "Missing exit points",
        description: "Please add at least one exit point",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Prepare the simulation data
      const simulationData = {
        elements,
        simulationSpeed,
        selectedModel: selectedModel?.name,
        simulationTime,
        timeStep: 0.05, // 50ms time step
      }

      // Send the simulation request to the backend
      const response = await fetch("/api/simulation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(simulationData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to run simulation")
      }

      const data = await response.json()

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
        toast({
          title: "Simulation started",
          description: "The simulation has started successfully",
        })
      } else {
        throw new Error("Invalid simulation data format")
      }
    } catch (error) {
      console.error("Error running simulation:", error)
      setError(`An error occurred: ${error instanceof Error ? error.message : String(error)}`)
      toast({
        title: "Simulation error",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [
    isSimulationRunning,
    elements,
    simulationSpeed,
    selectedModel,
    simulationTime,
    stopSimulation,
    startSimulation,
    toast,
  ])

  const showAlert = useCallback(
    (message: string, type: "warning" | "info" | "success" | "error" = "warning") => {
      toast({
        title: type.charAt(0).toUpperCase() + type.slice(1),
        description: message,
        variant: type === "error" ? "destructive" : type === "success" ? "default" : "secondary",
      })
    },
    [toast],
  )

  const validateDrawing = useCallback(
    (point: Point, type: string): boolean => {
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

  return {
    elements,
    selectedTool,
    selectedElement,
    isDrawing,
    geometryType,
    simulationModels,
    selectedModel,
    isSimulationRunning,
    simulationSpeed,
    agents,
    error,
    currentFrame,
    simulationTime,
    isPlaying,
    simulationFrames,
    isLoading,
    backendAvailable,
    addElement,
    updateElement,
    deleteElement,
    selectElement,
    connectWaypoints,
    startSimulation,
    stopSimulation,
    deleteSimulation,
    runSimulation,
    showAlert,
    validateDrawing,
    setSelectedTool,
    setGeometryType,
    setSelectedModel,
    setSimulationSpeed,
    setAgents,
    setError,
    setCurrentFrame,
    setSimulationTime,
    setIsPlaying,
    setIsDrawing,
  }
}
