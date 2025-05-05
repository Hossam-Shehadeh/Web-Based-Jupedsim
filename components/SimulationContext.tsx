"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect } from "react"

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
  showAlert: (message: string, type?: AlertType) => showAlertType
}

type showAlertType = (message: string, type?: AlertType) => void

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
    { id: "1", name: "CollisionFreeSpeedModel" as const },
    { id: "2", name: "CollisionFreeSpeedModelV2" as "CollisionFreeSpeedModel" },
    { id: "3", name: "GeneralizedCentrifugalForceModel" as "CollisionFreeSpeedModel" },
    { id: "4", name: "SocialForceModel" as "CollisionFreeSpeedModel" },
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

  // Fix the stopSimulation function to properly reset all simulation state
  const stopSimulation = useCallback(() => {
    setIsSimulationRunning(false)
    setIsPlaying(false)
    setCurrentFrame(0)
    setAgents([])
    setSimulationFrames([])
    // Don't reset elements or other design state
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

  // Improve the runSimulation function to handle errors better
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

        // Find obstacles
        const obstacles = elements.filter((el) => el.type === "OBSTACLE")
        console.log("Found obstacles:", obstacles.length)

        // Find walkable areas
        const walkableAreas = elements.filter((el) => el.type === "STREET_LINE" || el.type === "FREE_LINE")
        console.log("Found walkable areas:", walkableAreas.length)

        // Find waypoints
        const waypoints = elements.filter((el) => el.type === "WAYPOINT")
        console.log("Found waypoints:", waypoints.length)

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
            // Check if we should use waypoints for path generation
            if (waypoints.length > 0) {
              // Find path using waypoints
              const path = findPathUsingWaypoints(agent.position, nearestExit, elements)
              if (path && path.length > 1) {
                agentPaths[agent.id] = path
                return
              }
            }

            // If no waypoint path found or no waypoints exist, use obstacle avoidance
            const path = generatePathWithObstacleAvoidance(
              agent.position,
              nearestExit,
              obstacles,
              walkableAreas,
              100, // Number of points in the path
            )

            agentPaths[agent.id] = path
          }
        })

        // Create simulation frames based on the model
        const totalFrames = 200 // More frames for smoother animation
        const modelName = selectedModel?.name || "CollisionFreeSpeedModel"

        for (let frameIdx = 0; frameIdx < totalFrames; frameIdx++) {
          const frameAgents: Agent[] = []
          const time = frameIdx * 0.1 // 0.1 seconds per frame

          // If simulation speed is zero, don't move agents
          if (simulationSpeed <= 0) {
            // Just copy the initial positions for all frames
            if (frameIdx === 0) {
              mockAgents.forEach((agent) => {
                frameAgents.push({
                  ...agent,
                  velocity: { x: 0, y: 0 },
                })
              })
            } else {
              // Copy agents from the first frame for all subsequent frames
              frameAgents.push(...mockFrames[0].agents)
            }
          } else {
            mockAgents.forEach((agent) => {
              const path = agentPaths[agent.id]
              if (!path) return

              // Calculate progress along the path based on the model
              let pathProgress: number
              let speedFactor = 1.0

              // Different models have different movement patterns
              switch (modelName) {
                case "CollisionFreeSpeedModel":
                  // Linear movement with slight acceleration
                  pathProgress = Math.min((frameIdx / totalFrames) * 1.2, 1)
                  break

                case "CollisionFreeSpeedModelV2":
                  // Smoother acceleration and deceleration
                  pathProgress = Math.min(0.5 * (1 - Math.cos((Math.PI * frameIdx) / totalFrames)), 1)
                  break

                case "GeneralizedCentrifugalForceModel":
                  // More variable speed with social forces
                  const phase = frameIdx / totalFrames
                  speedFactor = 1.0 + 0.2 * Math.sin(phase * 10) // Oscillating speed
                  pathProgress = Math.min(phase * speedFactor, 1)
                  break

                case "SocialForceModel":
                  // Social forces model with more interaction between agents
                  pathProgress = Math.min((frameIdx / totalFrames) * (1 + 0.1 * Math.sin(frameIdx * 0.2)), 1)
                  break

                default:
                  pathProgress = Math.min(frameIdx / totalFrames, 1)
              }

              // Get position along the path
              const pathIndex = Math.min(Math.floor(pathProgress * path.length), path.length - 1)
              const currentPos = path[pathIndex]

              // Calculate velocity vector if not at the end of the path
              let velocity: Point | undefined
              if (pathIndex < path.length - 1) {
                const nextPos = path[pathIndex + 1]
                velocity = {
                  x: (nextPos.x - currentPos.x) / 0.1, // 0.1 seconds per frame
                  y: (nextPos.y - currentPos.y) / 0.1,
                }
              }

              // Add agent to the frame
              frameAgents.push({
                ...agent,
                position: currentPos,
                velocity,
              })
            })
          }

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

  // Add a function to find paths using waypoints
  function findPathUsingWaypoints(start: Point, end: Point, elements: Element[]): Point[] | null {
    // Get all waypoints
    const waypoints = elements.filter((el) => el.type === "WAYPOINT")
    if (waypoints.length === 0) return null

    // Find nearest waypoints to start and end
    let nearestStartWaypoint = null
    let nearestEndWaypoint = null
    let minStartDist = Number.POSITIVE_INFINITY
    let minEndDist = Number.POSITIVE_INFINITY

    for (const waypoint of waypoints) {
      if (waypoint.points.length === 0) continue

      const startDist = distance(start, waypoint.points[0])
      const endDist = distance(end, waypoint.points[0])

      // Check if path to/from waypoint is clear of obstacles
      const startClear = !isPathBlocked(start, waypoint.points[0], elements)
      const endClear = !isPathBlocked(waypoint.points[0], end, elements)

      if (startClear && startDist < minStartDist) {
        minStartDist = startDist
        nearestStartWaypoint = waypoint
      }

      if (endClear && endDist < minEndDist) {
        minEndDist = endDist
        nearestEndWaypoint = waypoint
      }
    }

    // If we found valid waypoints near start and end
    if (nearestStartWaypoint && nearestEndWaypoint) {
      // If they're the same waypoint, just go directly
      if (nearestStartWaypoint.id === nearestEndWaypoint.id) {
        return [start, nearestStartWaypoint.points[0], end]
      }

      // Check if there's a direct connection between the waypoints
      const hasDirectConnection = nearestStartWaypoint.properties?.connections?.includes(nearestEndWaypoint.id)

      if (hasDirectConnection) {
        // Use the direct connection
        return [start, nearestStartWaypoint.points[0], nearestEndWaypoint.points[0], end]
      }

      // Try to find a path through the waypoint graph
      const waypointPath = findWaypointGraphPath(nearestStartWaypoint, nearestEndWaypoint, elements)

      if (waypointPath && waypointPath.length > 0) {
        // Convert waypoints to points
        const pathPoints = [start]

        // Add all waypoints in the path
        for (const waypoint of waypointPath) {
          pathPoints.push(waypoint.points[0])
        }

        // Add the end point
        pathPoints.push(end)

        return pathPoints
      }
    }

    return null
  }

  // Find a path through the waypoint graph
  function findWaypointGraphPath(startWaypoint: Element, endWaypoint: Element, elements: Element[]): Element[] | null {
    // If start and end are the same, return immediately
    if (startWaypoint.id === endWaypoint.id) return [startWaypoint]

    // Get all waypoints
    const waypoints = elements.filter((el) => el.type === "WAYPOINT")

    // Build a connection map
    const connections = new Map<string, string[]>()
    for (const waypoint of waypoints) {
      if (waypoint.properties?.connections) {
        connections.set(waypoint.id, waypoint.properties.connections)
      } else {
        connections.set(waypoint.id, [])
      }
    }

    // Queue for BFS
    const queue = [{ waypoint: startWaypoint, path: [startWaypoint] }]
    // Set to track visited waypoints
    const visited = new Set<string>([startWaypoint.id])

    while (queue.length > 0) {
      const { waypoint, path } = queue.shift()!

      // Get connections for this waypoint
      const neighborIds = connections.get(waypoint.id) || []

      for (const neighborId of neighborIds) {
        // If we've found the end, return the path
        if (neighborId === endWaypoint.id) {
          return [...path, endWaypoint]
        }

        // If we haven't visited this waypoint yet
        if (!visited.has(neighborId)) {
          const neighborWaypoint = waypoints.find((w) => w.id === neighborId)
          if (!neighborWaypoint) continue

          visited.add(neighborId)

          // Check if the connection is valid (no obstacles)
          if (waypoint.points.length > 0 && neighborWaypoint.points.length > 0) {
            // Check if path between waypoints is clear
            const pathClear = !isPathBlocked(waypoint.points[0], neighborWaypoint.points[0], elements)

            if (pathClear) {
              queue.push({
                waypoint: neighborWaypoint,
                path: [...path, neighborWaypoint],
              })
            }
          }
        }
      }
    }

    // If we've exhausted all possibilities without finding a path
    return null
  }

  // Check if a path is blocked by obstacles
  function isPathBlocked(start: Point, end: Point, elements: Element[]): boolean {
    const obstacles = elements.filter((el) => el.type === "OBSTACLE")

    for (const obstacle of obstacles) {
      for (let i = 0; i < obstacle.points.length - 1; i++) {
        if (doLineSegmentsIntersect(start, end, obstacle.points[i], obstacle.points[i + 1])) {
          return true
        }
      }
    }

    return false
  }

  // Add a function to calculate distance between two points
  function distance(p1: Point, p2: Point): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
  }

  // Add this helper function for path generation with obstacle avoidance
  function generatePathWithObstacleAvoidance(
    start: Point,
    end: Point,
    obstacles: Element[],
    walkableAreas: Element[],
    numPoints: number,
  ): Point[] {
    // Check if direct path is clear
    const directPath = isPathClear(start, end, obstacles)

    // Add some randomness to path generation (30% chance of taking indirect path even if direct is clear)
    const forceIndirect = Math.random() < 0.3

    if (directPath && !forceIndirect) {
      // If direct path is clear, generate a slightly randomized direct path
      return generateSmoothPath(start, end, numPoints)
    }

    // If direct path is not clear or we're forcing indirect, find a path around obstacles
    // First, try to find midpoints that avoid obstacles
    const midpoints: Point[] = []

    // Calculate direct vector
    const dx = end.x - start.x
    const dy = end.y - start.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    // Try perpendicular directions to find a way around obstacles
    const perpendicularX = -dy / distance
    const perpendicularY = dx / distance

    // Try different detour distances with more variation
    const detourDistances = [0.3, 0.5, 0.7, 0.9, 1.1].map((factor) => distance * factor)
    let foundDetour = false

    // Add some randomness to the order of detour attempts
    if (Math.random() < 0.5) {
      detourDistances.reverse()
    }

    for (const detourDist of detourDistances) {
      // Try both sides with random preference
      const signs = Math.random() < 0.5 ? [-1, 1] : [1, -1]

      for (const sign of signs) {
        // Add some randomness to the detour point
        const randomOffset = {
          x: (Math.random() - 0.5) * distance * 0.2,
          y: (Math.random() - 0.5) * distance * 0.2,
        }

        const detourPoint = {
          x: start.x + dx * 0.5 + sign * perpendicularX * detourDist + randomOffset.x,
          y: start.y + dy * 0.5 + sign * perpendicularY * detourDist + randomOffset.y,
        }

        // Check if detour point is valid (inside walkable area and not in obstacle)
        if (isPointInWalkableArea(detourPoint, walkableAreas) && !isPointInObstacle(detourPoint, obstacles)) {
          // Check if paths to and from detour are clear
          if (isPathClear(start, detourPoint, obstacles) && isPathClear(detourPoint, end, obstacles)) {
            midpoints.push(detourPoint)
            foundDetour = true
            break
          }
        }
      }

      if (foundDetour) break
    }

    // If no good detour found, try random points
    if (midpoints.length === 0) {
      // Try more random points with more variation
      for (let i = 0; i < 30; i++) {
        const randomPoint = {
          x: start.x + dx * (Math.random() * 0.8 + 0.1) + (Math.random() - 0.5) * distance * 1.2,
          y: start.y + dy * (Math.random() * 0.8 + 0.1) + (Math.random() - 0.5) * distance * 1.2,
        }

        if (isPointInWalkableArea(randomPoint, walkableAreas) && !isPointInObstacle(randomPoint, obstacles)) {
          midpoints.push(randomPoint)

          // 40% chance to add a second random midpoint for more interesting paths
          if (Math.random() < 0.4) {
            const secondRandomPoint = {
              x:
                randomPoint.x +
                (end.x - randomPoint.x) * (Math.random() * 0.6 + 0.2) +
                (Math.random() - 0.5) * distance * 0.5,
              y:
                randomPoint.y +
                (end.y - randomPoint.y) * (Math.random() * 0.6 + 0.2) +
                (Math.random() - 0.5) * distance * 0.5,
            }

            if (
              isPointInWalkableArea(secondRandomPoint, walkableAreas) &&
              !isPointInObstacle(secondRandomPoint, obstacles)
            ) {
              midpoints.push(secondRandomPoint)
            }
          }

          break
        }
      }
    }

    // Generate path through midpoints
    const path: Point[] = [start]

    // Add paths through each midpoint
    let currentPoint = start
    const pointsPerSegment = Math.floor(numPoints / (midpoints.length + 1))

    for (const midpoint of midpoints) {
      const segmentPath = generateSmoothPath(currentPoint, midpoint, pointsPerSegment)
      path.push(...segmentPath.slice(1)) // Skip first point to avoid duplicates
      currentPoint = midpoint
    }

    // Add final segment to end
    const finalSegment = generateSmoothPath(currentPoint, end, numPoints - path.length + 1)
    path.push(...finalSegment.slice(1)) // Skip first point to avoid duplicates

    return path
  }

  // Helper function to generate a smooth path between two points
  function generateSmoothPath(start: Point, end: Point, numPoints: number): Point[] {
    const path: Point[] = []

    // Add some randomness to path generation
    const useWavyPath = Math.random() < 0.4
    const waveMagnitude = Math.random() * 0.15 + 0.05 // 5-20% of the distance
    const waveFrequency = Math.random() * 3 + 2 // 2-5 waves along the path

    for (let i = 0; i < numPoints; i++) {
      const t = i / (numPoints - 1)
      const randomFactor = 0.08 * (1 - t) * (1 - t) // More randomness at the start, less at the end

      let xOffset = 0
      let yOffset = 0

      // Calculate direct vector for wavy path
      if (useWavyPath) {
        const dx = end.x - start.x
        const dy = end.y - start.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        // Calculate perpendicular direction for the wave
        const perpX = -dy / distance
        const perpY = dx / distance

        // Create a sine wave along the path
        const waveOffset = Math.sin(t * Math.PI * waveFrequency) * waveMagnitude * distance
        xOffset = perpX * waveOffset
        yOffset = perpY * waveOffset
      }

      path.push({
        x: start.x + t * (end.x - start.x) + xOffset + (Math.random() - 0.5) * randomFactor * Math.abs(end.x - start.x),
        y: start.y + t * (end.y - start.y) + yOffset + (Math.random() - 0.5) * randomFactor * Math.abs(end.y - start.y),
      })
    }

    return path
  }

  // Check if a path between two points is clear of obstacles
  function isPathClear(start: Point, end: Point, obstacles: Element[]): boolean {
    for (const obstacle of obstacles) {
      if (obstacle.points.length < 2) continue

      // Check each segment of the obstacle
      for (let i = 0; i < obstacle.points.length - 1; i++) {
        if (doLineSegmentsIntersect(start, end, obstacle.points[i], obstacle.points[i + 1])) {
          return false
        }
      }

      // For closed obstacles, check the last segment
      if (obstacle.points.length > 2) {
        if (doLineSegmentsIntersect(start, end, obstacle.points[obstacle.points.length - 1], obstacle.points[0])) {
          return false
        }
      }
    }

    return true
  }

  // Check if two line segments intersect
  function doLineSegmentsIntersect(a: Point, b: Point, c: Point, d: Point): boolean {
    // Calculate direction vectors
    const r = { x: b.x - a.x, y: b.y - a.y }
    const s = { x: d.x - c.x, y: d.y - c.y }

    // Calculate determinant
    const det = r.x * s.y - r.y * s.x

    // Lines are parallel if determinant is zero
    if (Math.abs(det) < 1e-10) return false

    // Calculate parameters
    const t = ((c.x - a.x) * s.y - (c.y - a.y) * s.x) / det
    const u = ((c.x - a.x) * r.y - (c.y - a.y) * r.x) / det

    // Check if intersection is within both line segments
    return t >= 0 && t <= 1 && u >= 0 && u <= 1
  }

  // Check if a point is inside a walkable area
  function isPointInWalkableArea(point: Point, walkableAreas: Element[]): boolean {
    if (walkableAreas.length === 0) return true // If no walkable areas, allow anywhere

    for (const area of walkableAreas) {
      if (area.points.length < 3) continue // Need at least 3 points for a polygon

      if (isPointInPolygon(point, area.points)) {
        return true
      }
    }

    return false
  }

  // Check if a point is inside an obstacle
  function isPointInObstacle(point: Point, obstacles: Element[]): boolean {
    for (const obstacle of obstacles) {
      if (obstacle.points.length < 3) {
        // For line obstacles, check distance to line
        if (obstacle.points.length === 2) {
          const dist = distanceToLineSegment(point, obstacle.points[0], obstacle.points[1])
          if (dist < 20) {
            // 20px safety margin
            return true
          }
        }
        continue
      }

      if (isPointInPolygon(point, obstacle.points)) {
        return true
      }
    }

    return false
  }

  // Check if a point is inside a polygon
  function isPointInPolygon(point: Point, polygon: Point[]): boolean {
    let inside = false
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x
      const yi = polygon[i].y
      const xj = polygon[j].x
      const yj = polygon[j].y

      const intersect = yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi

      if (intersect) inside = !inside
    }

    return inside
  }

  // Calculate distance from point to line segment
  function distanceToLineSegment(point: Point, lineStart: Point, lineEnd: Point): number {
    const A = point.x - lineStart.x
    const B = point.y - lineStart.y
    const C = lineEnd.x - lineStart.x
    const D = lineEnd.y - lineStart.y

    const dot = A * C + B * D
    const lenSq = C * C + D * D
    let param = -1

    if (lenSq !== 0) param = dot / lenSq

    let xx, yy

    if (param < 0) {
      xx = lineStart.x
      yy = lineStart.y
    } else if (param > 1) {
      xx = lineEnd.x
      yy = lineEnd.y
    } else {
      xx = lineStart.x + param * C
      yy = lineStart.y + param * D
    }

    const dx = point.x - xx
    const dy = point.y - yy

    return Math.sqrt(dx * dx + dy * dy)
  }

  const validateDrawing = useCallback((point: Point, type: ElementType): boolean => {
    return true
  }, [])

  useEffect(() => {
    setBackendAvailable(true)
  }, [])

  // Add this to the useEffect that handles animation frames
  useEffect(() => {
    if (isSimulationRunning && isPlaying && simulationFrames.length > 0) {
      console.log("Animation loop started with", simulationFrames.length, "frames and", agents.length, "agents")

      // Set initial agents if not already set
      if (agents.length === 0 && simulationFrames[0]?.agents.length > 0) {
        console.log("Setting initial agents from frame 0")
        setAgents(simulationFrames[0].agents)
      }

      const frameInterval = setInterval(() => {
        setCurrentFrame((prevFrame) => {
          const nextFrame = prevFrame + 1
          if (nextFrame >= simulationFrames.length) {
            // When we reach the end, stop playing but keep the simulation running
            setIsPlaying(false)
            return prevFrame
          }

          // Update agents with the new frame data
          console.log(`Updating to frame ${nextFrame} with ${simulationFrames[nextFrame].agents.length} agents`)
          setAgents(simulationFrames[nextFrame].agents)
          return nextFrame
        })
      }, 100) // Update every 100ms for smooth animation

      return () => clearInterval(frameInterval)
    }
  }, [isSimulationRunning, isPlaying, simulationFrames, setAgents, setCurrentFrame, agents.length])

  // Create a useEffect to ensure we always have agents when simulation is running
  useEffect(() => {
    if (isSimulationRunning && agents.length === 0 && !isLoading) {
      console.log("No agents found in running simulation, creating fallback agents")

      // Create fallback agents
      const fallbackAgents = Array.from({ length: 10 }, (_, i) => ({
        id: `fallback-agent-${i}`,
        position: {
          x: 100 + Math.random() * 300,
          y: 100 + Math.random() * 300,
        },
        radius: 15,
        velocity: {
          x: (Math.random() - 0.5) * 2,
          y: (Math.random() - 0.5) * 2,
        },
      }))

      setAgents(fallbackAgents)

      // Create simple frames if none exist
      if (simulationFrames.length === 0) {
        const fallbackFrames = Array.from({ length: 100 }, (_, i) => ({
          time: i * 0.1,
          agents: fallbackAgents.map((agent) => ({
            ...agent,
            position: {
              x: agent.position.x + agent.velocity!.x * i,
              y: agent.position.y + agent.velocity!.y * i,
            },
          })),
        }))

        setSimulationFrames(fallbackFrames)
      }
    }
  }, [isSimulationRunning, agents.length, isLoading, simulationFrames.length])

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

export type { GeometryType, Element, Point }
