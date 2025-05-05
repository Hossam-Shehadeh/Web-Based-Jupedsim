import type { Element, Point } from "../types/simulationTypes"

// Check if a point is inside a polygon defined by an array of points
export function isPointInPolygon(point: Point, polygon: Point[]): boolean {
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
export function isInsideWalkableArea(point: Point, elements: Element[]): boolean {
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

// Improve the isRectangleInWalkableArea function to check all corners
export function isRectangleInWalkableArea(p1: Point, p2: Point, elements: Element[]): boolean {
  const topLeft = { x: Math.min(p1.x, p2.x), y: Math.min(p1.y, p2.y) }
  const topRight = { x: Math.max(p1.x, p2.x), y: Math.min(p1.y, p2.y) }
  const bottomLeft = { x: Math.min(p1.x, p2.x), y: Math.max(p1.y, p2.y) }
  const bottomRight = { x: Math.max(p1.x, p2.x), y: Math.max(p1.y, p2.y) }

  // Check if all four corners are inside the walkable area
  return (
    isInsideWalkableArea(topLeft, elements) &&
    isInsideWalkableArea(topRight, elements) &&
    isInsideWalkableArea(bottomLeft, elements) &&
    isInsideWalkableArea(bottomRight, elements)
  )
}

// Calculate distance between two points
export function distance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  return Math.sqrt(dx * dx + dy * dy)
}

// Find the nearest exit point to a given point
export function findNearestExitPoint(point: Point, elements: Element[]): Point {
  const exitPoints = elements.filter((el) => el.type === "EXIT_POINT")
  if (exitPoints.length === 0) {
    return { x: 0, y: 0 } // Default value if no exit points exist
  }

  let nearestExit = exitPoints[0].points[0]
  let minDistance = distance(point, exitPoints[0].points[0])

  for (const exitPoint of exitPoints) {
    const exitPosition = exitPoint.points[0]
    const currentDistance = distance(point, exitPosition)
    if (currentDistance < minDistance) {
      minDistance = currentDistance
      nearestExit = exitPosition
    }
  }

  return nearestExit
}

// Calculate distance from a point to a line segment
export function distanceToLineSegment(point: Point, lineStart: Point, lineEnd: Point): number {
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

// Increase the safety margin for obstacle avoidance
export function isPointNearObstacle(point: Point, elements: Element[], threshold = 40): boolean {
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

// Increase safety margin for collision detection
export function checkCollision(position: Point, radius: number, elements: Element[], agents: any[]): boolean {
  // Check for collision with obstacles - use a larger safety margin
  const safetyMargin = 40 // Increased safety margin from 25 to 40
  const obstacles = elements.filter((el) => el.type === "OBSTACLE")
  for (const obstacle of obstacles) {
    for (let i = 0; i < obstacle.points.length - 1; i++) {
      const lineStart = obstacle.points[i]
      const lineEnd = obstacle.points[i + 1]

      // Calculate distance from point to line segment
      const dist = distanceToLineSegment(position, lineStart, lineEnd)
      if (dist < radius + safetyMargin) {
        return true
      }
    }
  }

  // Check for collision with other agents (excluding self)
  for (const agent of agents) {
    const dist = distance(position, agent.position)
    if (dist > 0 && dist < radius + agent.radius) {
      return true
    }
  }

  return false
}

/**
 * Generates a path from a start point to an end point with some randomness
 */
export function generatePath(start: Point, end: Point, steps: number, randomFactor = 0.2): Point[] {
  const path: Point[] = [start]
  const dx = (end.x - start.x) / steps
  const dy = (end.y - start.y) / steps

  for (let i = 1; i < steps; i++) {
    // Add some randomness to the path
    const randomX = (Math.random() - 0.5) * randomFactor * dx * steps
    const randomY = (Math.random() - 0.5) * randomFactor * dy * steps

    path.push({
      x: start.x + dx * i + randomX,
      y: start.y + dy * i + randomY,
    })
  }

  path.push(end)
  return path
}

export function findPath(start: Point, end: Point, elements: Element[], numPoints = 20): Point[] {
  const path: Point[] = []
  // Implement your pathfinding logic here
  // This is a placeholder implementation
  for (let i = 0; i < numPoints; i++) {
    const x = start.x + (end.x - start.x) * (i / numPoints)
    const y = start.y + (end.y - start.y) * (i / numPoints)
    path.push({ x, y })
  }
  return path
}

// Check if two line segments intersect
export function doLineSegmentsIntersect(a: Point, b: Point, c: Point, d: Point): boolean {
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
