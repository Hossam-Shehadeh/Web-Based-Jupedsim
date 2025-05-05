import type { Element, Point } from "@/types"

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

// Check if a point is near an obstacle
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
