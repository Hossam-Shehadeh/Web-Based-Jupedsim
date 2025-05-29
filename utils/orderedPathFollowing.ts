import type { Element, Point, Agent } from "../types/simulationTypes"
import { distance } from "./simulationUtils"

// Calculate a path through ordered waypoints
export function calculateOrderedWaypointPath(
  orderedWaypointIds: string[],
  elements: Element[],
  segmentPoints = 20,
): Point[] {
  if (orderedWaypointIds.length < 2) return []

  const waypoints = orderedWaypointIds
    .map((id) => elements.find((el) => el.id === id))
    .filter((el): el is Element => el !== undefined && el.points.length > 0)
    .map((el) => el.points[0])

  if (waypoints.length < 2) return []

  // Create a complete path by connecting all waypoints with smooth segments
  const completePath: Point[] = [waypoints[0]]

  for (let i = 0; i < waypoints.length - 1; i++) {
    const start = waypoints[i]
    const end = waypoints[i + 1]

    // Generate a smooth path segment between these waypoints
    const segment = generateSmoothPathSegment(start, end, elements, segmentPoints)

    // Add all points except the first (to avoid duplication)
    completePath.push(...segment.slice(1))
  }

  return completePath
}

// Generate a smooth path segment between two points
function generateSmoothPathSegment(start: Point, end: Point, elements: Element[], numPoints: number): Point[] {
  const obstacles = elements.filter((el) => el.type === "OBSTACLE")

  // Check if direct path intersects any obstacles
  const hasObstacle = obstacles.some((obstacle) => {
    if (obstacle.points.length < 2) return false

    for (let i = 0; i < obstacle.points.length - 1; i++) {
      if (doLineSegmentsIntersect(start, end, obstacle.points[i], obstacle.points[i + 1])) {
        return true
      }
    }
    return false
  })

  if (!hasObstacle) {
    // If no obstacles, create a direct path with slight curvature
    return generateCurvedPath(start, end, numPoints)
  } else {
    // If obstacles exist, find a path around them
    return generatePathAroundObstacles(start, end, elements, numPoints)
  }
}

// Generate a curved path between two points (for visual appeal)
function generateCurvedPath(start: Point, end: Point, numPoints: number): Point[] {
  const path: Point[] = []

  // Calculate midpoint with slight offset for natural curve
  const midX = (start.x + end.x) / 2
  const midY = (start.y + end.y) / 2

  // Perpendicular vector for curve control
  const dx = end.x - start.x
  const dy = end.y - start.y
  const dist = Math.sqrt(dx * dx + dy * dy)

  // Perpendicular direction (normalized)
  const perpX = -dy / dist
  const perpY = dx / dist

  // Control point offset (10% of distance)
  const offset = dist * 0.1
  const ctrlX = midX + perpX * offset
  const ctrlY = midY + perpY * offset

  // Generate points along the quadratic curve
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints

    // Quadratic Bezier formula
    const x = (1 - t) * (1 - t) * start.x + 2 * (1 - t) * t * ctrlX + t * t * end.x
    const y = (1 - t) * (1 - t) * start.y + 2 * (1 - t) * t * ctrlY + t * t * end.y

    path.push({ x, y })
  }

  return path
}

// Generate a path around obstacles
function generatePathAroundObstacles(start: Point, end: Point, elements: Element[], numPoints: number): Point[] {
  const obstacles = elements.filter((el) => el.type === "OBSTACLE")

  // Calculate direct vector
  const dx = end.x - start.x
  const dy = end.y - start.y
  const directDist = Math.sqrt(dx * dx + dy * dy)

  // Try different perpendicular offsets to find a valid path
  const perpX = -dy / directDist
  const perpY = dx / directDist

  // Try different offset distances
  const offsets = [0.3, 0.5, 0.7, 0.9].map((factor) => directDist * factor)

  for (const offset of offsets) {
    for (const sign of [-1, 1]) {
      // Calculate midpoint with offset
      const midX = start.x + dx * 0.5 + sign * perpX * offset
      const midY = start.y + dy * 0.5 + sign * perpY * offset

      const midpoint = { x: midX, y: midY }

      // Check if paths to and from midpoint are clear
      let pathToClear = true
      let pathFromClear = true

      for (const obstacle of obstacles) {
        for (let i = 0; i < obstacle.points.length - 1; i++) {
          if (doLineSegmentsIntersect(start, midpoint, obstacle.points[i], obstacle.points[i + 1])) {
            pathToClear = false
          }
          if (doLineSegmentsIntersect(midpoint, end, obstacle.points[i], obstacle.points[i + 1])) {
            pathFromClear = false
          }
        }
      }

      // If both paths are clear, generate a path through this midpoint
      if (pathToClear && pathFromClear) {
        // Generate first half of path
        const firstHalf = generateCurvedPath(start, midpoint, Math.floor(numPoints / 2))

        // Generate second half of path
        const secondHalf = generateCurvedPath(midpoint, end, Math.floor(numPoints / 2))

        // Combine paths (excluding duplicate midpoint)
        return [...firstHalf, ...secondHalf.slice(1)]
      }
    }
  }

  // If no clear path found, return a direct path as fallback
  return generateCurvedPath(start, end, numPoints)
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

// Calculate positions for multiple agents along a path with proper spacing
export function calculateAgentPositionsOnPath(
  path: Point[],
  agentCount: number,
  simulationTime: number,
  agentSpacing: number,
  agentSpeed: number,
): Agent[] {
  if (path.length < 2) return []

  const agents: Agent[] = []

  // Calculate total path length
  let totalPathLength = 0
  for (let i = 0; i < path.length - 1; i++) {
    totalPathLength += distance(path[i], path[i + 1])
  }

  // Calculate time to traverse the entire path at the given speed
  const totalTravelTime = totalPathLength / agentSpeed

  // For each agent, calculate its position along the path
  for (let i = 0; i < agentCount; i++) {
    // Calculate time offset for this agent (staggered starts)
    const timeOffset = i * agentSpacing

    // Calculate effective time for this agent
    const effectiveTime = simulationTime - timeOffset

    // If agent hasn't started yet, skip
    if (effectiveTime < 0) continue

    // Calculate progress along the path (0 to 1)
    const progress = Math.min(effectiveTime / totalTravelTime, 1)

    // Find position along the path
    const position = getPositionAlongPath(path, progress * totalPathLength)

    // Calculate velocity
    const velocity = calculateVelocityAtPosition(path, position, agentSpeed)

    // Add agent if it's on the path
    if (position) {
      agents.push({
        id: `agent-${i}`,
        position,
        radius: 5 + Math.random() * 2, // Random radius between 5-7
        velocity,
      })
    }
  }

  // Apply collision avoidance to ensure agents don't overlap
  return applyCollisionAvoidance(agents, path, agentSpeed)
}

// Get position at a specific distance along the path
function getPositionAlongPath(path: Point[], targetDistance: number): Point {
  let distanceCovered = 0

  for (let i = 0; i < path.length - 1; i++) {
    const segmentLength = distance(path[i], path[i + 1])

    // If this segment contains our target position
    if (distanceCovered + segmentLength >= targetDistance) {
      // Calculate how far along this segment we need to go
      const remainingDistance = targetDistance - distanceCovered
      const segmentProgress = remainingDistance / segmentLength

      // Interpolate position
      return {
        x: path[i].x + segmentProgress * (path[i + 1].x - path[i].x),
        y: path[i].y + segmentProgress * (path[i + 1].y - path[i].y),
      }
    }

    distanceCovered += segmentLength
  }

  // If we've gone beyond the path, return the last point
  return path[path.length - 1]
}

// Calculate velocity at a position on the path
function calculateVelocityAtPosition(path: Point[], position: Point, speed: number): Point {
  // Find the closest segment
  let closestSegmentIndex = 0
  let minDistance = Number.POSITIVE_INFINITY

  for (let i = 0; i < path.length - 1; i++) {
    const dist = distanceToLineSegment(position, path[i], path[i + 1])
    if (dist < minDistance) {
      minDistance = dist
      closestSegmentIndex = i
    }
  }

  // Calculate direction along the path at this point
  const start = path[closestSegmentIndex]
  const end = path[closestSegmentIndex + 1]

  const dx = end.x - start.x
  const dy = end.y - start.y
  const length = Math.sqrt(dx * dx + dy * dy)

  // Normalize and scale by speed
  return {
    x: (dx / length) * speed,
    y: (dy / length) * speed,
  }
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

// Apply collision avoidance to ensure agents don't overlap
function applyCollisionAvoidance(agents: Agent[], path: Point[], speed: number): Agent[] {
  if (agents.length <= 1) return agents

  // Sort agents by progress along the path (from start to end)
  agents.sort((a, b) => {
    const aProgress = getProgressAlongPath(a.position, path)
    const bProgress = getProgressAlongPath(b.position, path)
    return aProgress - bProgress
  })

  // Ensure minimum spacing between agents
  const minSpacing = 15 // Minimum distance between agent centers

  for (let i = 1; i < agents.length; i++) {
    const prevAgent = agents[i - 1]
    const currentAgent = agents[i]

    const dist = distance(prevAgent.position, currentAgent.position)

    // If agents are too close
    if (dist < minSpacing) {
      // Calculate how far the current agent needs to move back
      const moveBackDistance = minSpacing - dist

      // Get current agent's progress along the path
      const progress = getProgressAlongPath(currentAgent.position, path)

      // Calculate new position further back on the path
      const newProgress = Math.max(0, progress - moveBackDistance / getTotalPathLength(path))
      const newPosition = getPositionAlongPath(path, newProgress * getTotalPathLength(path))

      // Update agent position
      currentAgent.position = newPosition

      // Recalculate velocity
      currentAgent.velocity = calculateVelocityAtPosition(path, newPosition, speed)
    }
  }

  return agents
}

// Get agent's progress along the path (0 to 1)
function getProgressAlongPath(position: Point, path: Point[]): number {
  // Find closest point on the path
  let minDistance = Number.POSITIVE_INFINITY
  let closestSegmentIndex = 0
  let closestPoint: Point = path[0]

  for (let i = 0; i < path.length - 1; i++) {
    const projectedPoint = projectPointOnLineSegment(position, path[i], path[i + 1])
    const dist = distance(position, projectedPoint)

    if (dist < minDistance) {
      minDistance = dist
      closestSegmentIndex = i
      closestPoint = projectedPoint
    }
  }

  // Calculate distance from start to this point
  let distanceFromStart = 0

  // Add distances of complete segments
  for (let i = 0; i < closestSegmentIndex; i++) {
    distanceFromStart += distance(path[i], path[i + 1])
  }

  // Add distance within the current segment
  distanceFromStart += distance(path[closestSegmentIndex], closestPoint)

  // Return progress as a fraction of total path length
  return distanceFromStart / getTotalPathLength(path)
}

// Project a point onto a line segment
function projectPointOnLineSegment(point: Point, lineStart: Point, lineEnd: Point): Point {
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

  return { x: xx, y: yy }
}

// Get total path length
function getTotalPathLength(path: Point[]): number {
  let totalLength = 0
  for (let i = 0; i < path.length - 1; i++) {
    totalLength += distance(path[i], path[i + 1])
  }
  return totalLength
}
