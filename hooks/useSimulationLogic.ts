"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useSimulation } from "../components/SimulationContext"
import type { Agent, Point, Element } from "../types/simulationTypes"
import {
  isInsideWalkableArea,
  findNearestExitPoint,
  checkCollision,
  isPointNearObstacle,
  distanceToLineSegment,
  distance,
  doLineSegmentsIntersect,
} from "../utils/simulationUtils"
import { findPathAStar, shouldRecalculatePath } from "../utils/pathfinding"

export function useSimulationLogic() {
  const { elements, simulationSpeed, isSimulationRunning, stopSimulation } = useSimulation()

  const [agents, setAgents] = useState<Agent[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [simulationTime, setSimulationTime] = useState(0)

  // Store agent paths for consistent movement
  const agentPathsRef = useRef<Map<string, Point[]>>(new Map())
  // Store agent targets
  const agentTargetsRef = useRef<Map<string, Point>>(new Map())
  // Store agent states
  const agentStatesRef = useRef<Map<string, "moving" | "waiting" | "arrived">>(new Map())
  // Store last path recalculation time
  const lastPathRecalcRef = useRef<Map<string, number>>(new Map())

  // Initialize agents with improved pathfinding
  const initializeAgents = useCallback(() => {
    const newAgents: Agent[] = []
    const newAgentPaths = new Map<string, Point[]>()
    const newAgentTargets = new Map<string, Point>()
    const newAgentStates = new Map<string, "moving" | "waiting" | "arrived">()
    const newLastPathRecalc = new Map<string, number>()

    let agentId = 0

    // Process START_POINT elements
    elements.forEach((element) => {
      if (element.type === "START_POINT") {
        // Check if the position is valid
        if (element.points.length > 0 && isInsideWalkableArea(element.points[0], elements)) {
          const id = `agent_${agentId++}`

          // Find target using waypoint navigation if possible
          const target = findBestTargetUsingWaypoints(element.points[0], elements)

          // Use A* pathfinding with waypoint consideration
          const path = findPathWithWaypoints(element.points[0], target, elements, 40)

          newAgents.push({
            id,
            position: { ...element.points[0] },
            target,
            speed: simulationSpeed,
            radius: 0.15 + Math.random() * 0.1, // Reduced from 0.2 to 0.15
          })

          // Store the path and target
          newAgentPaths.set(id, path)
          newAgentTargets.set(id, target)
          newAgentStates.set(id, path.length > 1 ? "moving" : "waiting")
          newLastPathRecalc.set(id, simulationTime)
        }
      }
    })

    // Process SOURCE_RECTANGLE elements
    elements.forEach((element) => {
      if (element.type === "SOURCE_RECTANGLE") {
        const agentCount = element.properties?.agentCount || 10
        for (let i = 0; i < agentCount; i++) {
          // Try multiple times to find a valid position
          let validPosition = false
          let position = { x: 0, y: 0 }
          let attempts = 0

          while (!validPosition && attempts < 15) {
            position = {
              x: element.points[0].x + Math.random() * (element.points[1].x - element.points[0].x),
              y: element.points[0].y + Math.random() * (element.points[1].y - element.points[0].y),
            }

            // Check if position is valid (inside walkable area and not too close to obstacles)
            validPosition = isInsideWalkableArea(position, elements) && !isPointNearObstacle(position, elements, 40)
            attempts++
          }

          // If we couldn't find a valid position, skip this agent
          if (!validPosition) continue

          const id = `agent_${agentId++}`

          // Find target using waypoint navigation if possible
          const target = findBestTargetUsingWaypoints(position, elements)

          // Use A* pathfinding with waypoint consideration
          const path = findPathWithWaypoints(position, target, elements, 40)

          newAgents.push({
            id,
            position,
            target,
            speed: simulationSpeed,
            radius: 0.15 + Math.random() * 0.1, // Reduced from 0.2 to 0.15
          })

          // Store the path and target
          newAgentPaths.set(id, path)
          newAgentTargets.set(id, target)
          newAgentStates.set(id, path.length > 1 ? "moving" : "waiting")
          newLastPathRecalc.set(id, simulationTime)
        }
      }
    })

    setAgents(newAgents)
    agentPathsRef.current = newAgentPaths
    agentTargetsRef.current = newAgentTargets
    agentStatesRef.current = newAgentStates
    lastPathRecalcRef.current = newLastPathRecalc
  }, [elements, simulationSpeed, simulationTime])

  // Add a function to find the best target using waypoints
  const findBestTargetUsingWaypoints = (position: Point, elements: Element[]): Point => {
    // First check if there are waypoints to use
    const waypoints = elements.filter((el) => el.type === "WAYPOINT")
    const exitPoints = elements.filter((el) => el.type === "EXIT_POINT")

    // If no exit points, return a default target
    if (exitPoints.length === 0) {
      return { x: 400, y: 300 }
    }

    // If no waypoints, just find the nearest exit
    if (waypoints.length === 0) {
      return findNearestExitPoint(position, elements)
    }

    // Find the nearest waypoint to the agent
    let nearestWaypoint = null
    let minDistance = Number.POSITIVE_INFINITY

    for (const waypoint of waypoints) {
      if (waypoint.points.length === 0) continue

      const dist = distance(position, waypoint.points[0])
      if (dist < minDistance && !isPathBlocked(position, waypoint.points[0], elements)) {
        minDistance = dist
        nearestWaypoint = waypoint
      }
    }

    // If no accessible waypoint found, use the nearest exit
    if (!nearestWaypoint) {
      return findNearestExitPoint(position, elements)
    }

    // Find the best exit through the waypoint network
    const exitTarget = findBestExitThroughWaypoints(nearestWaypoint, elements)

    return exitTarget
  }

  // Add a function to find the best exit through waypoints
  const findBestExitThroughWaypoints = (startWaypoint: Element, elements: Element[]): Point => {
    const exitPoints = elements.filter((el) => el.type === "EXIT_POINT")

    // If no exit points, return a default target
    if (exitPoints.length === 0) {
      return { x: 400, y: 300 }
    }

    // Find the best path to an exit through the waypoint network
    let bestExit = exitPoints[0]
    let shortestPath = Number.POSITIVE_INFINITY

    for (const exit of exitPoints) {
      if (exit.points.length < 2) continue

      const exitCenter = {
        x: (exit.points[0].x + exit.points[1].x) / 2,
        y: (exit.points[0].y + exit.points[1].y) / 2,
      }

      // Find the shortest path to this exit
      const pathLength = estimatePathLengthThroughWaypoints(startWaypoint, exitCenter, elements)

      if (pathLength < shortestPath) {
        shortestPath = pathLength
        bestExit = exit
      }
    }

    // Return the center of the best exit
    return {
      x: (bestExit.points[0].x + bestExit.points[1].x) / 2,
      y: (bestExit.points[0].y + bestExit.points[1].y) / 2,
    }
  }

  // Add a function to estimate path length through waypoints
  const estimatePathLengthThroughWaypoints = (startWaypoint: Element, target: Point, elements: Element[]): number => {
    // Simple implementation: just check direct distance plus a penalty for obstacles
    const directDist = distance(startWaypoint.points[0], target)

    // Check if direct path is blocked
    if (isPathBlocked(startWaypoint.points[0], target, elements)) {
      return directDist * 2 // Apply penalty for blocked path
    }

    return directDist
  }

  // Add a function to check if a path is blocked by obstacles
  const isPathBlocked = (start: Point, end: Point, elements: Element[]): boolean => {
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

  // Add a function to check if two line segments intersect
  // const doLineSegmentsIntersect = (a: Point, b: Point, c: Point, d: Point): boolean => {
  //   // Calculate direction vectors
  //   // const r = { x: b.x - a.x, y: b.y - a.y }
  //   // const s = { x: d.x - c.x, y: d.y - c.y }

  //   // // Calculate determinant
  //   // const det = r.x * s.y - r.y * s.x

  //   // // Lines are parallel if determinant is zero
  //   // if (Math.abs(det) < 1e-10) return false

  //   // // Calculate parameters
  //   // const t = ((c.x - a.x) * s.y - (c.y - a.y) * s.x) / det
  //   // const u = ((c.x - a.x) * r.y - (c.y - a.y) * r.x) / det

  //   // // Check if intersection is within both line segments
  //   // return t >= 0 && t <= 1 && u >= 0 && u <= 1
  //   return false
  // }

  // Add a function to find a path with waypoint consideration
  const findPathWithWaypoints = useCallback(
    (start: Point, end: Point, elements: Element[], safetyMargin: number): Point[] => {
      // First try to find a path using waypoints
      const waypoints = elements.filter((el) => el.type === "WAYPOINT")

      // If there are no waypoints, use A* pathfinding
      if (waypoints.length === 0) {
        return findPathAStar(start, end, elements, safetyMargin)
      }

      // Find the nearest waypoint to the start position
      let nearestStartWaypoint: Element | null = null
      let minStartDist = Number.POSITIVE_INFINITY

      for (const waypoint of waypoints) {
        if (waypoint.points.length === 0) continue

        const dist = distance(start, waypoint.points[0])
        const pathClear = !pathIntersectsObstacle(start, waypoint.points[0], elements)

        if (pathClear && dist < minStartDist) {
          minStartDist = dist
          nearestStartWaypoint = waypoint
        }
      }

      // Find the nearest waypoint to the end position
      let nearestEndWaypoint: Element | null = null
      let minEndDist = Number.POSITIVE_INFINITY

      for (const waypoint of waypoints) {
        if (waypoint.points.length === 0) continue

        const dist = distance(end, waypoint.points[0])
        const pathClear = !pathIntersectsObstacle(waypoint.points[0], end, elements)

        if (pathClear && dist < minEndDist) {
          minEndDist = dist
          nearestEndWaypoint = waypoint
        }
      }

      // If we found valid waypoints near start and end
      if (nearestStartWaypoint && nearestEndWaypoint) {
        // If they're the same waypoint, just go directly through it
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
        const connections = getWaypointConnections(elements)
        const waypointPath = findWaypointGraphPath(
          nearestStartWaypoint.id,
          nearestEndWaypoint.id,
          connections,
          elements,
        )

        if (waypointPath && waypointPath.length > 0) {
          // Convert waypoint IDs to points and generate a smooth path
          const pathPoints: Point[] = [start]

          // Add path to first waypoint
          const firstWaypoint = waypoints.find((w) => w.id === waypointPath[0])
          if (firstWaypoint && firstWaypoint.points.length > 0) {
            pathPoints.push(firstWaypoint.points[0])
          }

          // Add paths between waypoints
          for (let i = 0; i < waypointPath.length - 1; i++) {
            const currentWaypoint = waypoints.find((w) => w.id === waypointPath[i])
            const nextWaypoint = waypoints.find((w) => w.id === waypointPath[i + 1])

            if (
              currentWaypoint &&
              nextWaypoint &&
              currentWaypoint.points.length > 0 &&
              nextWaypoint.points.length > 0
            ) {
              pathPoints.push(nextWaypoint.points[0])
            }
          }

          // Add path from last waypoint to end
          pathPoints.push(end)

          return pathPoints
        }
      }

      // If waypoint path not found, fall back to A* pathfinding
      return findPathAStar(start, end, elements, safetyMargin)
    },
    [],
  )

  // TODO: Implement getWaypointPath function
  const getWaypointPath = (start: Point, end: Point, elements: Element[]): Point[] | null => {
    // Placeholder implementation: return null for now
    return null
  }

  // Update agents with improved obstacle avoidance
  const updateAgents = useCallback(() => {
    // If simulation speed is zero, don't update agent positions
    if (simulationSpeed <= 0) {
      return
    }

    setAgents((prevAgents) => {
      return prevAgents
        .map((agent) => {
          // Get the agent's path and state
          const path = agentPathsRef.current.get(agent.id)
          const state = agentStatesRef.current.get(agent.id) || "waiting"
          const target = agentTargetsRef.current.get(agent.id)

          // If agent has arrived at destination, remove it
          if (state === "arrived") {
            return null
          }

          // If agent is waiting, check if we should recalculate path
          if (state === "waiting") {
            const lastRecalc = lastPathRecalcRef.current.get(agent.id) || 0

            // Only recalculate every 1 second to avoid performance issues
            if (simulationTime - lastRecalc > 1 && target) {
              // Try to find a path using waypoints first
              const newPath = findPathWithWaypoints(agent.position, target, elements, 40)
              agentPathsRef.current.set(agent.id, newPath)
              lastPathRecalcRef.current.set(agent.id, simulationTime)

              // If we found a path, start moving
              if (newPath.length > 1) {
                agentStatesRef.current.set(agent.id, "moving")
              }
            }

            // If still waiting, don't move
            if (agentStatesRef.current.get(agent.id) === "waiting") {
              return agent
            }
          }

          // Check if we need to recalculate the path due to environment changes
          if (target && shouldRecalculatePath({ position: agent.position, path }, target, elements, 40)) {
            const lastRecalc = lastPathRecalcRef.current.get(agent.id) || 0

            // Only recalculate every 1 second to avoid performance issues
            if (simulationTime - lastRecalc > 1) {
              // Try to find a path using waypoints first
              const newPath = findPathWithWaypoints(agent.position, target, elements, 40)
              agentPathsRef.current.set(agent.id, newPath)
              lastPathRecalcRef.current.set(agent.id, simulationTime)

              // Update state based on new path
              agentStatesRef.current.set(agent.id, newPath.length > 1 ? "moving" : "waiting")
            }
          }

          // Get the updated path and state
          const updatedPath = agentPathsRef.current.get(agent.id)
          const updatedState = agentStatesRef.current.get(agent.id)

          // If no path or waiting, don't move
          if (!updatedPath || updatedPath.length <= 1 || updatedState === "waiting") {
            return agent
          }

          // If agent speed is 0, don't move it
          if (simulationSpeed <= 0) {
            // If speed is 0, don't update position
            return agent
          }

          // Find the next point in the path
          let nextPointIndex = 1

          // Skip points that we've already passed
          while (
            nextPointIndex < updatedPath.length - 1 &&
            distance(agent.position, updatedPath[nextPointIndex]) < agent.speed
          ) {
            nextPointIndex++
          }

          const nextPoint = updatedPath[nextPointIndex]

          // If we've reached the last point, mark as arrived
          if (nextPointIndex === updatedPath.length - 1 && distance(agent.position, nextPoint) < agent.speed) {
            agentStatesRef.current.set(agent.id, "arrived")
            return null
          }

          // Calculate direction and distance to next point
          const dx = nextPoint.x - agent.position.x
          const dy = nextPoint.y - agent.position.y
          const distToNext = Math.sqrt(dx * dx + dy * dy)

          // If we're very close to the next point, move directly to it
          if (distToNext < agent.speed) {
            // Check if the next position is safe
            if (!checkCollision(nextPoint, agent.radius, elements, prevAgents)) {
              // Remove this point from the path if it's not the last one
              if (nextPointIndex < updatedPath.length - 1) {
                agentPathsRef.current.set(agent.id, updatedPath.slice(nextPointIndex))
              }

              return {
                ...agent,
                position: nextPoint,
              }
            } else {
              // If next position has collision, stay in place and recalculate path
              agentStatesRef.current.set(agent.id, "waiting")
              return agent
            }
          }

          // Calculate normalized direction
          const normalizedDx = dx / distToNext
          const normalizedDy = dy / distToNext

          // Apply smooth movement with acceleration/deceleration
          const speedFactor = Math.min(1, distToNext / (agent.radius * 10))
          const moveSpeed = agent.speed * speedFactor

          // Calculate new position
          const newPosition = {
            x: agent.position.x + normalizedDx * moveSpeed,
            y: agent.position.y + normalizedDy * moveSpeed,
          }

          // Check for collisions with obstacles and other agents
          if (checkCollision(newPosition, agent.radius, elements, prevAgents)) {
            // Try to find an alternative direction
            const alternativeDirections = [
              { dx: normalizedDy, dy: -normalizedDx }, // 90 degrees right
              { dx: -normalizedDy, dy: normalizedDx }, // 90 degrees left
              { dx: normalizedDx * 0.7 + normalizedDy * 0.7, dy: normalizedDy * 0.7 - normalizedDx * 0.7 }, // 45 degrees right
              { dx: normalizedDx * 0.7 - normalizedDy * 0.7, dy: normalizedDy * 0.7 + normalizedDx * 0.7 }, // 45 degrees left
            ]

            // Try each alternative direction
            for (const dir of alternativeDirections) {
              const altPosition = {
                x: agent.position.x + dir.dx * moveSpeed,
                y: agent.position.y + dir.dy * moveSpeed,
              }

              if (
                !checkCollision(altPosition, agent.radius, elements, prevAgents) &&
                isInsideWalkableArea(altPosition, elements)
              ) {
                return {
                  ...agent,
                  position: altPosition,
                }
              }
            }

            // If no alternative direction works, try to move away from obstacles
            const obstacles = elements.filter((el) => el.type === "OBSTACLE")
            let nearestObstacleDist = Number.POSITIVE_INFINITY
            let nearestObstaclePoint = { x: 0, y: 0 }

            for (const obstacle of obstacles) {
              for (let i = 0; i < obstacle.points.length - 1; i++) {
                const dist = distanceToLineSegment(newPosition, obstacle.points[i], obstacle.points[i + 1])

                if (dist < nearestObstacleDist) {
                  nearestObstacleDist = dist

                  // Calculate the nearest point on the obstacle
                  const p1 = obstacle.points[i]
                  const p2 = obstacle.points[i + 1]

                  const A = newPosition.x - p1.x
                  const B = newPosition.y - p1.y
                  const C = p2.x - p1.x
                  const D = p2.y - p1.y

                  const dot = A * C + B * D
                  const lenSq = C * C + D * D
                  let param = -1

                  if (lenSq !== 0) param = dot / lenSq

                  if (param < 0) {
                    nearestObstaclePoint = { x: p1.x, y: p1.y }
                  } else if (param > 1) {
                    nearestObstaclePoint = { x: p2.x, y: p2.y }
                  } else {
                    nearestObstaclePoint = {
                      x: p1.x + param * C,
                      y: p1.y + param * D,
                    }
                  }
                }
              }
            }

            // If we're near an obstacle, move away from it
            if (nearestObstacleDist < agent.radius + 40) {
              // Calculate repulsion vector
              const repulsionX = agent.position.x - nearestObstaclePoint.x
              const repulsionY = agent.position.y - nearestObstaclePoint.y

              // Normalize repulsion vector
              const repulsionDist = Math.sqrt(repulsionX * repulsionX + repulsionY * repulsionY)

              if (repulsionDist > 0) {
                const normalizedRepulsionX = repulsionX / repulsionDist
                const normalizedRepulsionY = repulsionY / repulsionDist

                // Calculate repulsion strength (stronger when closer)
                const repulsionStrength = Math.max(0, 1 - nearestObstacleDist / (agent.radius + 40))

                // Try moving away from the obstacle
                const avoidancePosition = {
                  x: agent.position.x + normalizedRepulsionX * agent.speed * repulsionStrength * 3,
                  y: agent.position.y + normalizedRepulsionY * agent.speed * repulsionStrength * 3,
                }

                // Check if the avoidance position is valid
                if (
                  !checkCollision(avoidancePosition, agent.radius, elements, prevAgents) &&
                  isInsideWalkableArea(avoidancePosition, elements)
                ) {
                  return {
                    ...agent,
                    position: avoidancePosition,
                  }
                }
              }
            }

            // If we can't move, stay in place and recalculate path
            agentStatesRef.current.set(agent.id, "waiting")
            return agent
          }

          // If the new position is valid, move to it
          return {
            ...agent,
            position: newPosition,
          }
        })
        .filter((agent): agent is Agent => agent !== null)
    })
  }, [elements, simulationSpeed, simulationTime, findPathWithWaypoints])

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev)
  }, [])

  const initializeSimulation = useCallback(() => {
    setAgents([])
    agentPathsRef.current = new Map()
    agentTargetsRef.current = new Map()
    agentStatesRef.current = new Map()
    lastPathRecalcRef.current = new Map()
    setSimulationTime(0)
  }, [])

  const runSimulation = useCallback(() => {
    if (isSimulationRunning) {
      stopSimulation()
      initializeSimulation()
    } else {
      initializeAgents()
      setIsPlaying(true)
      setSimulationTime(0)
    }
  }, [isSimulationRunning, stopSimulation, initializeAgents, initializeSimulation])

  useEffect(() => {
    let intervalId: NodeJS.Timeout

    if (isPlaying && isSimulationRunning) {
      intervalId = setInterval(() => {
        updateAgents()
        setSimulationTime((prevTime) => prevTime + 0.1) // Update every 100ms
      }, 100)
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [isPlaying, isSimulationRunning, updateAgents])

  return {
    agents,
    isPlaying,
    simulationTime,
    updateAgents,
    togglePlay,
    runSimulation,
    setSimulationTime,
  }
}

// Helper function to check if a path intersects an obstacle
const pathIntersectsObstacle = (start: Point, end: Point, elements: Element[]): boolean => {
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

// Helper function to get waypoint connections
const getWaypointConnections = (elements: Element[]): { [key: string]: string[] } => {
  const connections: { [key: string]: string[] } = {}
  const waypoints = elements.filter((el) => el.type === "WAYPOINT")

  for (const waypoint of waypoints) {
    connections[waypoint.id] = waypoint.properties?.connections || []
  }

  return connections
}

// Helper function to find a path through the waypoint graph
const findWaypointGraphPath = (
  startId: string,
  endId: string,
  connections: { [key: string]: string[] },
  elements: Element[],
): string[] | null => {
  const queue: { id: string; path: string[] }[] = [{ id: startId, path: [startId] }]
  const visited = new Set<string>()

  while (queue.length > 0) {
    const { id, path } = queue.shift()!

    if (id === endId) {
      return path
    }

    visited.add(id)

    for (const neighbor of connections[id] || []) {
      if (!visited.has(neighbor) && isWaypointAccessible(id, neighbor, elements)) {
        queue.push({ id: neighbor, path: [...path, neighbor] })
      }
    }
  }

  return null
}

// Helper function to check if a waypoint is accessible from another waypoint
const isWaypointAccessible = (waypoint1Id: string, waypoint2Id: string, elements: Element[]): boolean => {
  const waypoint1 = elements.find((el) => el.id === waypoint1Id)
  const waypoint2 = elements.find((el) => el.id === waypoint2Id)

  if (!waypoint1 || !waypoint2 || waypoint1.points.length === 0 || waypoint2.points.length === 0) {
    return false
  }

  return !pathIntersectsObstacle(waypoint1.points[0], waypoint2.points[0], elements)
}
