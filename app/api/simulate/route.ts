import { type NextRequest, NextResponse } from "next/server"

// Define the API endpoint for running simulations
export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json()

    // Forward the request to the backend
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000"

    // Add error handling and timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout for simulations

    try {
      const response = await fetch(`${backendUrl}/api/simulate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Check if the response is OK
      if (!response.ok) {
        let errorData
        try {
          errorData = await response.json()
        } catch (e) {
          errorData = { detail: await response.text() }
        }

        console.warn(`Backend simulation failed with status: ${response.status}`, errorData)
        return NextResponse.json(
          {
            error: errorData.detail || "Failed to run simulation",
            status: response.status,
            backendUrl,
          },
          { status: response.status },
        )
      }

      // Return the response from the backend
      const data = await response.json()
      return NextResponse.json(data)
    } catch (fetchError) {
      console.warn(`Backend fetch error: ${fetchError.message}`)

      // Generate mock simulation data as fallback
      const mockFrames = generateMockSimulationFrames(body.elements, body.simulationTime, body.timeStep || 0.05)

      // Return a response with mock data
      return NextResponse.json({
        frames: mockFrames,
        metadata: {
          simulationTime: body.simulationTime,
          timeStep: body.timeStep || 0.05,
          modelName: body.selectedModel,
          agentCount: mockFrames[0]?.agents.length || 0,
          isMockData: true,
        },
        warning: "Using mock data due to backend connection failure",
      })
    }
  } catch (error) {
    console.error("Error in simulation API route:", error)
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

// Update the generateMockSimulationFrames function to only use source rectangles and respect waypoints
function generateMockSimulationFrames(elements: any[], simulationTime: number, timeStep: number) {
  const frames = []
  const numFrames = Math.ceil(simulationTime / timeStep)

  // Only use source rectangles, not start points
  const sources = elements.filter((el) => el.type === "SOURCE_RECTANGLE")

  // Find exit points
  const exitPoints = elements.filter((el) => el.type === "EXIT_POINT")

  // Generate initial agents
  const agents = []
  let agentId = 0

  // Add agents from sources only
  for (const source of sources) {
    if (source.points && source.points.length >= 2) {
      const agentCount = source.properties?.agentCount || 10
      const x1 = Math.min(source.points[0].x, source.points[1].x)
      const y1 = Math.min(source.points[0].y, source.points[1].y)
      const width = Math.abs(source.points[1].x - source.points[0].x)
      const height = Math.abs(source.points[1].y - source.points[0].y)

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
          validPosition = isInsideWalkableArea(position, elements) && !isPointNearObstacle(position, elements, 40)
          attempts++
        }

        // If we couldn't find a valid position, skip this agent
        if (!validPosition) continue

        agents.push({
          id: `agent-${agentId++}`,
          position,
          radius: 5 + Math.random() * 3,
        })
      }
    }
  }

  // If no agents, create some default ones (should not happen with proper sources)
  if (agents.length === 0 && sources.length > 0) {
    const source = sources[0]
    const x1 = Math.min(source.points[0].x, source.points[1].x)
    const y1 = Math.min(source.points[0].y, source.points[1].y)
    const width = Math.abs(source.points[1].x - source.points[0].x)
    const height = Math.abs(source.points[1].y - source.points[0].y)

    for (let i = 0; i < 10; i++) {
      const position = {
        x: x1 + Math.random() * width,
        y: y1 + Math.random() * height,
      }

      // Only add if position is valid
      if (isInsideWalkableArea(position, elements)) {
        agents.push({
          id: `agent-default-${i}`,
          position,
          radius: 5 + Math.random() * 3,
        })
      }
    }
  }

  // Extract target positions from exit points
  const targetPositions = []
  for (const exit of exitPoints) {
    if (exit.points && exit.points.length >= 2) {
      targetPositions.push({
        x: (exit.points[0].x + exit.points[1].x) / 2,
        y: (exit.points[0].y + exit.points[1].y) / 2,
      })
    }
  }

  // If no targets, create a default one
  if (targetPositions.length === 0) {
    targetPositions.push({ x: 400, y: 300 })
  }

  // Generate agent paths with obstacle avoidance and waypoint navigation
  const agentPaths = {}

  for (const agent of agents) {
    // Assign a random target
    const targetIdx = Math.floor(agent.id.charCodeAt(agent.id.length - 1) % targetPositions.length)
    const target = targetPositions[targetIdx]

    // First try to find a path using waypoints
    let path = findPathUsingWaypoints(agent.position, target, elements)

    // If no waypoint path found, use regular pathfinding
    if (!path || path.length < 2) {
      path = findPath(agent.position, target, elements, Math.ceil(numFrames * 0.7))
    }

    agentPaths[agent.id] = path
  }

  // Generate frames
  for (let frameIdx = 0; frameIdx < numFrames; frameIdx++) {
    const time = frameIdx * timeStep
    const frameAgents = []

    for (const agent of agents) {
      const path = agentPaths[agent.id]
      if (!path) continue

      // Calculate progress through the path
      const pathProgress = Math.min(frameIdx / numFrames, 1)
      const pathIndex = Math.min(Math.floor(pathProgress * path.length), path.length - 1)

      // Get current position from path
      const currentPos = path[pathIndex]

      // Calculate velocity if not the last point
      let velocity = null
      if (pathIndex < path.length - 1) {
        const nextPos = path[pathIndex + 1]
        velocity = {
          x: (nextPos.x - currentPos.x) / timeStep,
          y: (nextPos.y - currentPos.y) / timeStep,
        }
      } else {
        velocity = { x: 0, y: 0 }
      }

      frameAgents.push({
        id: agent.id,
        position: currentPos,
        radius: agent.radius,
        velocity,
      })
    }

    frames.push({
      time,
      agents: frameAgents,
    })
  }

  return frames
}

// Add a function to find a path using waypoints
function findPathUsingWaypoints(start: any, end: any, elements: any[]): any[] | null {
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
    const startClear = !pathIntersectsObstacle(start, waypoint.points[0], elements)
    const endClear = !pathIntersectsObstacle(waypoint.points[0], end, elements)

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
function findWaypointGraphPath(startWaypoint: any, endWaypoint: any, elements: any[]): any[] | null {
  // If start and end are the same, return immediately
  if (startWaypoint.id === endWaypoint.id) return [startWaypoint]

  // Get all waypoints
  const waypoints = elements.filter((el) => el.type === "WAYPOINT")

  // Build a connection map
  const connections = new Map()
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
  const visited = new Set([startWaypoint.id])

  while (queue.length > 0) {
    const { waypoint, path } = queue.shift()

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
          const pathClear = !pathIntersectsObstacle(waypoint.points[0], neighborWaypoint.points[0], elements)

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

// Check if a path intersects with any obstacle
function pathIntersectsObstacle(start: any, end: any, elements: any[]): boolean {
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

// Check if two line segments intersect
function doLineSegmentsIntersect(a: any, b: any, c: any, d: any): boolean {
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

// Calculate distance between two points
function distance(p1: any, p2: any): number {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  return Math.sqrt(dx * dx + dy * dy)
}

// Check if a point is inside a polygon defined by an array of points
function isPointInPolygon(point: any, polygon: any[]): boolean {
  if (polygon.length < 3) return false

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

// Check if a point is inside any walkable area
function isInsideWalkableArea(point: any, elements: any[]): boolean {
  // Get all walkable areas (STREET_LINE or FREE_LINE)
  const walkableAreas = elements.filter((el) => el.type === "STREET_LINE" || el.type === "FREE_LINE")

  // If there are no walkable areas, return true (allow drawing anywhere)
  if (walkableAreas.length === 0) return true

  // Check if the point is inside any walkable area
  for (const area of walkableAreas) {
    if (area.points.length < 3) continue // Need at least 3 points to form a polygon
    if (isPointInPolygon(point, area.points)) return true
  }

  return false
}

// Calculate distance from a point to a line segment
function distanceToLineSegment(point: any, lineStart: any, lineEnd: any): number {
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

// Check if a point is near any obstacle
function isPointNearObstacle(point: any, elements: any[], threshold = 40): boolean {
  const obstacles = elements.filter((el) => el.type === "OBSTACLE")

  for (const obstacle of obstacles) {
    for (let i = 0; i < obstacle.points.length - 1; i++) {
      const p1 = obstacle.points[i]
      const p2 = obstacle.points[i + 1]

      // Calculate distance from point to line segment
      const dist = distanceToLineSegment(point, p1, p2)
      if (dist < threshold) {
        return true
      }
    }
  }

  return false
}

// Calculate distance between two points
// function distance(p1: any, p2: any): number {
//   const dx = p2.x - p1.x
//   const dy = p2.y - p1.y
//   return Math.sqrt(dx * dx + dy * dy)
// }

// Check if two line segments intersect
// function doLineSegmentsIntersect(p1: any, p2: any, p3: any, p4: any): boolean {
//   // Calculate the direction vectors
//   const d1x = p2.x - p1.x
//   const d1y = p2.y - p1.y
//   const d2x = p4.x - p3.x
//   const d2y = p4.y - p3.y

//   // Calculate the determinant
//   const det = d1x * d2y - d1y * d2x

//   // If determinant is zero, lines are parallel
//   if (det === 0) return false

//   // Calculate the parameters for the intersection point
//   const dx = p3.x - p1.x
//   const dy = p3.y - p1.y

//   const t1 = (dx * d2y - dy * d2x) / det
//   const t2 = (dx * d1y - dy * d1x) / det

//   // Check if the intersection point is within both line segments
//   return t1 >= 0 && t1 <= 1 && t2 >= 0 && t2 <= 1
// }

// Find a path from start to end avoiding obstacles
function findPath(start: any, end: any, elements: any[], numPoints = 20): any[] {
  const obstacles = elements.filter((el) => el.type === "OBSTACLE")

  // If direct path is clear, use it with some randomness
  let hasObstacle = false
  for (const obstacle of obstacles) {
    for (let i = 0; i < obstacle.points.length - 1; i++) {
      if (doLineSegmentsIntersect(start, end, obstacle.points[i], obstacle.points[i + 1])) {
        hasObstacle = true
        break
      }
    }
    if (hasObstacle) break
  }

  if (!hasObstacle) {
    return generateStraightPath(start, end, numPoints)
  }

  // Try to use waypoints if available
  const waypoints = elements.filter((el) => el.type === "WAYPOINT")
  if (waypoints.length > 0) {
    // Find nearest waypoints to start and end
    let nearestStartWaypoint = null
    let nearestEndWaypoint = null
    let minStartDist = Number.POSITIVE_INFINITY
    let minEndDist = Number.POSITIVE_INFINITY

    for (const waypoint of waypoints) {
      if (waypoint.points.length === 0) continue

      const startDist = distance(start, waypoint.points[0])
      const endDist = distance(end, waypoint.points[0])

      if (startDist < minStartDist) {
        minStartDist = startDist
        nearestStartWaypoint = waypoint
      }

      if (endDist < minEndDist) {
        minEndDist = endDist
        nearestEndWaypoint = waypoint
      }
    }

    // If we found waypoints and they're different, try to use them
    if (nearestStartWaypoint && nearestEndWaypoint && nearestStartWaypoint.id !== nearestEndWaypoint.id) {
      // Check if paths to/from waypoints are clear
      const startToWaypointClear = !pathIntersectsObstacle(start, nearestStartWaypoint.points[0], elements)

      const waypointToEndClear = !pathIntersectsObstacle(nearestEndWaypoint.points[0], end, elements)

      if (startToWaypointClear && waypointToEndClear) {
        // Generate path through waypoints
        const path = [start]

        // Add path to first waypoint
        path.push(...generateStraightPath(start, nearestStartWaypoint.points[0], Math.floor(numPoints / 3)).slice(1))

        // Add path between waypoints if they're connected
        if (nearestStartWaypoint.properties?.connections?.includes(nearestEndWaypoint.id)) {
          path.push(
            ...generateStraightPath(
              nearestStartWaypoint.points[0],
              nearestEndWaypoint.points[0],
              Math.floor(numPoints / 3),
            ).slice(1),
          )
        }

        // Add path from last waypoint to end
        path.push(...generateStraightPath(nearestEndWaypoint.points[0], end, Math.floor(numPoints / 3)).slice(1))

        return path
      }
    }
  }

  // If waypoints didn't work, use obstacle avoidance
  return generatePathWithObstacleAvoidance(start, end, elements, numPoints)
}

// Check if a path intersects with any obstacle
// function pathIntersectsObstacle(start: any, end: any, elements: any[]): boolean {
//   const obstacles = elements.filter((el) => el.type === "OBSTACLE")

//   for (const obstacle of obstacles) {
//     for (let i = 0; i < obstacle.points.length - 1; i++) {
//       if (doLineSegmentsIntersect(start, end, obstacle.points[i], obstacle.points[i + 1])) {
//         return true
//       }
//     }
//   }

//   return false
// }

// Generate a straight path with some randomness
function generateStraightPath(start: any, end: any, numPoints: number): any[] {
  const path = [start]

  for (let i = 1; i < numPoints; i++) {
    const t = i / (numPoints - 1)
    const randomFactor = 0.05 * (1 - t) // Less randomness as we approach the target

    path.push({
      x: start.x + t * (end.x - start.x) + (Math.random() - 0.5) * randomFactor * Math.abs(end.x - start.x),
      y: start.y + t * (end.y - start.y) + (Math.random() - 0.5) * randomFactor * Math.abs(end.y - start.y),
    })
  }

  // Make sure the last point is exactly the end point
  if (path[path.length - 1] !== end) {
    path.push(end)
  }

  return path
}

// Generate a path with obstacle avoidance
function generatePathWithObstacleAvoidance(start: any, end: any, elements: any[], numPoints: number): any[] {
  const obstacles = elements.filter((el) => el.type === "OBSTACLE")
  const path = [start]

  // Find midpoints that avoid obstacles
  const midpoints = []

  // Calculate direct vector from start to end
  const dx = end.x - start.x
  const dy = end.y - start.y
  const directDistance = Math.sqrt(dx * dx + dy * dy)

  // Try perpendicular directions
  const perpendicularX = -dy / directDistance
  const perpendicularY = dx / directDistance

  // Try both perpendicular directions with different magnitudes
  const detourDistances = [directDistance * 0.5, directDistance * 0.7, directDistance * 0.9]
  let bestDetour = null
  let bestDetourScore = Number.POSITIVE_INFINITY

  for (const detourDist of detourDistances) {
    for (const sign of [-1, 1]) {
      const detourPoint = {
        x: start.x + dx * 0.5 + sign * perpendicularX * detourDist,
        y: start.y + dy * 0.5 + sign * perpendicularY * detourDist,
      }

      // Check if detour point is valid
      if (isInsideWalkableArea(detourPoint, elements) && !isPointNearObstacle(detourPoint, elements, 40)) {
        // Score the detour point (lower is better)
        const startToDetour = distance(start, detourPoint)
        const detourToEnd = distance(detourPoint, end)
        const score = startToDetour + detourToEnd

        if (score < bestDetourScore) {
          bestDetourScore = score
          bestDetour = detourPoint
        }
      }
    }
  }

  if (bestDetour) {
    midpoints.push(bestDetour)
  } else {
    // If we couldn't find a good detour point, try random points
    for (let i = 0; i < 20; i++) {
      const randomPoint = {
        x: start.x + dx * 0.5 + (Math.random() - 0.5) * directDistance * 0.9,
        y: start.y + dy * 0.5 + (Math.random() - 0.5) * directDistance * 0.9,
      }

      if (isInsideWalkableArea(randomPoint, elements) && !isPointNearObstacle(randomPoint, elements, 40)) {
        midpoints.push(randomPoint)
        break
      }
    }
  }

  // Generate path through midpoints
  let currentPoint = start
  const pointsPerSegment = Math.floor(numPoints / (midpoints.length + 1))

  for (const midpoint of midpoints) {
    const segmentPoints = generateStraightPath(currentPoint, midpoint, pointsPerSegment)

    // Add all points except the first (to avoid duplicates)
    path.push(...segmentPoints.slice(1))
    currentPoint = midpoint
  }

  // Generate final segment to end
  const finalSegment = generateStraightPath(currentPoint, end, numPoints - path.length + 1)

  // Add all points except the first (to avoid duplicates)
  path.push(...finalSegment.slice(1))

  return path
}
