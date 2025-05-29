import type { Element, Point } from "../types/simulationTypes"
import { distance, isInsideWalkableArea, isPointNearObstacle, distanceToLineSegment } from "./simulationUtils"
import type { Waypoint, Obstacle } from "@/types/simulationTypes"

// Grid cell size for A* pathfinding
const GRID_CELL_SIZE = 20

// Node for A* pathfinding
interface AStarNode {
  x: number
  y: number
  g: number // Cost from start to current node
  h: number // Heuristic (estimated cost from current to goal)
  f: number // Total cost (g + h)
  parent: AStarNode | null
  isObstacle: boolean
}

// A* pathfinding algorithm
export function findPath(
  start: { x: number; y: number },
  end: { x: number; y: number },
  obstacles: Obstacle[],
  gridSize = 10,
): { x: number; y: number }[] {
  // Create a grid for pathfinding
  const gridCellSize = gridSize
  const width = Math.ceil(2000 / gridCellSize)
  const height = Math.ceil(2000 / gridCellSize)

  // Create a grid representation
  const grid: boolean[][] = Array(height)
    .fill(null)
    .map(() => Array(width).fill(false))

  // Mark obstacle cells as blocked
  for (const obstacle of obstacles) {
    markObstacleInGrid(obstacle, grid, gridCellSize)
  }

  // Convert coordinates to grid indices
  const startNode = {
    x: Math.floor(start.x / gridCellSize),
    y: Math.floor(start.y / gridCellSize),
    g: 0,
    h: 0,
    f: 0,
    parent: null as any,
  }

  const endNode = {
    x: Math.floor(end.x / gridCellSize),
    y: Math.floor(end.y / gridCellSize),
  }

  // A* algorithm
  const openSet: any[] = [startNode]
  const closedSet: any[] = []

  while (openSet.length > 0) {
    // Find node with lowest f score
    let currentIndex = 0
    for (let i = 0; i < openSet.length; i++) {
      if (openSet[i].f < openSet[currentIndex].f) {
        currentIndex = i
      }
    }

    const current = openSet[currentIndex]

    // Check if we reached the end
    if (current.x === endNode.x && current.y === endNode.y) {
      // Reconstruct path
      const path: { x: number; y: number }[] = []
      let temp = current

      while (temp.parent) {
        // Convert grid indices back to coordinates
        path.push({
          x: temp.x * gridCellSize + gridCellSize / 2,
          y: temp.y * gridCellSize + gridCellSize / 2,
        })
        temp = temp.parent
      }

      // Add start point
      path.push({
        x: start.x,
        y: start.y,
      })

      return path.reverse()
    }

    // Move current from open to closed set
    openSet.splice(currentIndex, 1)
    closedSet.push(current)

    // Check neighbors
    const neighbors = getNeighbors(current, grid)

    for (const neighbor of neighbors) {
      // Skip if in closed set
      if (closedSet.some((node) => node.x === neighbor.x && node.y === neighbor.y)) {
        continue
      }

      // Calculate g score
      const gScore = current.g + 1

      // Check if neighbor is in open set
      const openNode = openSet.find((node) => node.x === neighbor.x && node.y === neighbor.y)

      if (!openNode) {
        // Add to open set
        neighbor.g = gScore
        neighbor.h = heuristic(neighbor, endNode)
        neighbor.f = neighbor.g + neighbor.h
        neighbor.parent = current
        openSet.push(neighbor)
      } else if (gScore < openNode.g) {
        // Update g score
        openNode.g = gScore
        openNode.f = openNode.g + openNode.h
        openNode.parent = current
      }
    }
  }

  // No path found
  return []
}

// Mark obstacle cells in the grid
function markObstacleInGrid(obstacle: Obstacle, grid: boolean[][], gridCellSize: number): void {
  // Get bounding box of obstacle
  let minX = Number.POSITIVE_INFINITY,
    minY = Number.POSITIVE_INFINITY,
    maxX = Number.NEGATIVE_INFINITY,
    maxY = Number.NEGATIVE_INFINITY

  for (const point of obstacle.points) {
    minX = Math.min(minX, point.x)
    minY = Math.min(minY, point.y)
    maxX = Math.max(maxX, point.x)
    maxY = Math.max(maxY, point.y)
  }

  // Convert to grid indices
  const gridMinX = Math.max(0, Math.floor(minX / gridCellSize))
  const gridMinY = Math.max(0, Math.floor(minY / gridCellSize))
  const gridMaxX = Math.min(grid[0].length - 1, Math.ceil(maxX / gridCellSize))
  const gridMaxY = Math.min(grid.length - 1, Math.ceil(maxY / gridCellSize))

  // Mark cells that intersect with the obstacle
  for (let y = gridMinY; y <= gridMaxY; y++) {
    for (let x = gridMinX; x <= gridMaxX; x++) {
      // Check if cell center is inside obstacle
      const cellCenterX = x * gridCellSize + gridCellSize / 2
      const cellCenterY = y * gridCellSize + gridCellSize / 2

      if (isPointInPolygon(cellCenterX, cellCenterY, obstacle.points)) {
        grid[y][x] = true // Mark as blocked
      }

      // Also check cell corners to ensure better coverage
      const corners = [
        { x: x * gridCellSize, y: y * gridCellSize },
        { x: (x + 1) * gridCellSize, y: y * gridCellSize },
        { x: x * gridCellSize, y: (y + 1) * gridCellSize },
        { x: (x + 1) * gridCellSize, y: (y + 1) * gridCellSize },
      ]

      for (const corner of corners) {
        if (isPointInPolygon(corner.x, corner.y, obstacle.points)) {
          grid[y][x] = true // Mark as blocked
          break
        }
      }
    }
  }
}

// Check if a point is inside a polygon
function isPointInPolygon(x: number, y: number, points: { x: number; y: number }[]): boolean {
  let inside = false

  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i].x,
      yi = points[i].y
    const xj = points[j].x,
      yj = points[j].y

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi

    if (intersect) inside = !inside
  }

  return inside
}

// Get valid neighbors for a node
function getNeighbors(node: any, grid: boolean[][]): any[] {
  const neighbors: any[] = []
  const directions = [
    { x: 0, y: -1 }, // Up
    { x: 1, y: 0 }, // Right
    { x: 0, y: 1 }, // Down
    { x: -1, y: 0 }, // Left
    { x: 1, y: -1 }, // Up-Right
    { x: 1, y: 1 }, // Down-Right
    { x: -1, y: 1 }, // Down-Left
    { x: -1, y: -1 }, // Up-Left
  ]

  for (const dir of directions) {
    const x = node.x + dir.x
    const y = node.y + dir.y

    // Check if within bounds
    if (x >= 0 && x < grid[0].length && y >= 0 && y < grid.length) {
      // Check if not blocked
      if (!grid[y][x]) {
        neighbors.push({
          x,
          y,
          parent: null,
        })
      }
    }
  }

  return neighbors
}

// Heuristic function (Manhattan distance)
function heuristic(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}

/**
 * A* pathfinding algorithm to find optimal paths around obstacles
 */
export function findPathAStar(start: Point, goal: Point, elements: Element[], safetyMargin = 40): Point[] {
  // Create a grid representation of the environment
  const bounds = getBoundingBox(elements, start, goal)
  const grid = createGrid(bounds, elements, safetyMargin)

  // Find the closest valid start and goal positions
  const startNode = findClosestValidNode(start, grid, bounds)
  const goalNode = findClosestValidNode(goal, grid, bounds)

  if (!startNode || !goalNode) {
    console.warn("Could not find valid start or goal position for pathfinding")
    return [start, goal] // Return direct path if we can't find valid nodes
  }

  // Initialize open and closed sets
  const openSet: AStarNode[] = [startNode]
  const closedSet: Set<string> = new Set()

  // A* search algorithm
  while (openSet.length > 0) {
    // Find node with lowest f cost
    let currentIndex = 0
    for (let i = 1; i < openSet.length; i++) {
      if (openSet[i].f < openSet[currentIndex].f) {
        currentIndex = i
      }
    }

    const current = openSet[currentIndex]

    // Check if we reached the goal
    if (current.x === goalNode.x && current.y === goalNode.y) {
      return reconstructPath(current)
    }

    // Move current node from open to closed set
    openSet.splice(currentIndex, 1)
    closedSet.add(`${current.x},${current.y}`)

    // Check all neighbors
    const neighbors = getNeighborsAStar(current, grid, bounds)

    for (const neighbor of neighbors) {
      // Skip if in closed set
      if (closedSet.has(`${neighbor.x},${neighbor.y}`)) continue

      // Calculate g score
      const tentativeG = current.g + distance({ x: current.x, y: current.y }, { x: neighbor.x, y: neighbor.y })

      // Check if this path is better
      let inOpenSet = false
      for (let i = 0; i < openSet.length; i++) {
        if (openSet[i].x === neighbor.x && openSet[i].y === neighbor.y) {
          inOpenSet = true
          if (tentativeG < openSet[i].g) {
            openSet[i].g = tentativeG
            openSet[i].f = tentativeG + openSet[i].h
            openSet[i].parent = current
          }
          break
        }
      }

      // Add to open set if not already there
      if (!inOpenSet) {
        neighbor.g = tentativeG
        neighbor.h = distance({ x: neighbor.x, y: neighbor.y }, { x: goalNode.x, y: goalNode.y })
        neighbor.f = neighbor.g + neighbor.h
        neighbor.parent = current
        openSet.push(neighbor)
      }
    }
  }

  // No path found, return direct path with intermediate points to try to avoid obstacles
  console.warn("No path found, using fallback path")
  return generateFallbackPath(start, goal, elements, safetyMargin)
}

/**
 * Get the bounding box for the grid, including start and goal positions
 */
function getBoundingBox(elements: Element[], start: Point, goal: Point) {
  let minX = Math.min(start.x, goal.x)
  let minY = Math.min(start.y, goal.y)
  let maxX = Math.max(start.x, goal.x)
  let maxY = Math.max(start.y, goal.y)

  // Expand bounds to include all elements
  elements.forEach((element) => {
    element.points.forEach((point) => {
      minX = Math.min(minX, point.x)
      minY = Math.min(minY, point.y)
      maxX = Math.max(maxX, point.x)
      maxY = Math.max(maxY, point.y)
    })
  })

  // Add padding
  const padding = 100
  minX -= padding
  minY -= padding
  maxX += padding
  maxY += padding

  return { minX, minY, maxX, maxY }
}

/**
 * Create a grid representation of the environment
 */
function createGrid(
  bounds: { minX: number; minY: number; maxX: number; maxY: number },
  elements: Element[],
  safetyMargin: number,
): AStarNode[][] {
  const { minX, minY, maxX, maxY } = bounds

  // Calculate grid dimensions
  const width = Math.ceil((maxX - minX) / GRID_CELL_SIZE)
  const height = Math.ceil((maxY - minY) / GRID_CELL_SIZE)

  // Initialize grid
  const grid: AStarNode[][] = []

  for (let y = 0; y < height; y++) {
    grid[y] = []
    for (let x = 0; x < width; x++) {
      // Calculate world coordinates
      const worldX = minX + x * GRID_CELL_SIZE
      const worldY = minY + y * GRID_CELL_SIZE

      // Check if this cell is an obstacle or near an obstacle
      const isObstacle =
        !isInsideWalkableArea({ x: worldX, y: worldY }, elements) ||
        isPointNearObstacle({ x: worldX, y: worldY }, elements, safetyMargin)

      grid[y][x] = {
        x: worldX,
        y: worldY,
        g: 0,
        h: 0,
        f: 0,
        parent: null,
        isObstacle,
      }
    }
  }

  return grid
}

/**
 * Find the closest valid node to a point
 */
function findClosestValidNode(
  point: Point,
  grid: AStarNode[][],
  bounds: { minX: number; minY: number; maxX: number; maxY: number },
): AStarNode | null {
  // Convert world coordinates to grid indices
  const gridX = Math.floor((point.x - bounds.minX) / GRID_CELL_SIZE)
  const gridY = Math.floor((point.y - bounds.minY) / GRID_CELL_SIZE)

  // Check if the point is within grid bounds
  if (gridX >= 0 && gridX < grid[0].length && gridY >= 0 && gridY < grid.length) {
    // If the exact cell is valid, return it
    if (!grid[gridY][gridX].isObstacle) {
      return grid[gridY][gridX]
    }

    // Otherwise, search for the closest valid cell
    const searchRadius = 10 // Maximum search radius

    for (let radius = 1; radius <= searchRadius; radius++) {
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          // Only check cells at the current radius
          if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue

          const newY = gridY + dy
          const newX = gridX + dx

          // Check if within bounds
          if (newX >= 0 && newX < grid[0].length && newY >= 0 && newY < grid.length) {
            if (!grid[newY][newX].isObstacle) {
              return grid[newY][newX]
            }
          }
        }
      }
    }
  }

  // If no valid node found, return null
  return null
}

/**
 * Get valid neighbors for a node
 */
function getNeighborsAStar(
  node: AStarNode,
  grid: AStarNode[][],
  bounds: { minX: number; minY: number; maxX: number; maxY: number },
): AStarNode[] {
  const neighbors: AStarNode[] = []

  // Convert world coordinates to grid indices
  const gridX = Math.floor((node.x - bounds.minX) / GRID_CELL_SIZE)
  const gridY = Math.floor((node.y - bounds.minY) / GRID_CELL_SIZE)

  // Check all 8 directions
  const directions = [
    { dx: -1, dy: -1 },
    { dx: 0, dy: -1 },
    { dx: 1, dy: -1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
    { dx: -1, dy: 1 },
    { dx: 0, dy: 1 },
    { dx: 1, dy: 1 },
  ]

  for (const { dx, dy } of directions) {
    const newY = gridY + dy
    const newX = gridX + dx

    // Check if within bounds
    if (newX >= 0 && newX < grid[0].length && newY >= 0 && newY < grid.length) {
      // Add if not an obstacle
      if (!grid[newY][newX].isObstacle) {
        neighbors.push(grid[newY][newX])
      }
    }
  }

  return neighbors
}

/**
 * Reconstruct path from A* result
 */
function reconstructPath(endNode: AStarNode): Point[] {
  const path: Point[] = []
  let current: AStarNode | null = endNode

  while (current) {
    path.unshift({ x: current.x, y: current.y })
    current = current.parent
  }

  // Apply path smoothing
  return smoothPath(path)
}

/**
 * Smooth the path to make it more natural
 */
function smoothPath(path: Point[]): Point[] {
  if (path.length <= 2) return path

  const smoothed: Point[] = [path[0]]

  // Use path simplification to remove unnecessary points
  let i = 0
  while (i < path.length - 2) {
    // Check if we can skip the next point
    const current = path[i]
    const next = path[i + 1]
    const afterNext = path[i + 2]

    // Calculate angles
    const angle1 = Math.atan2(next.y - current.y, next.x - current.x)
    const angle2 = Math.atan2(afterNext.y - next.y, afterNext.x - next.x)

    // If the angles are similar, skip the middle point
    if (Math.abs(angle1 - angle2) < 0.3) {
      // Threshold in radians
      i += 2
    } else {
      smoothed.push(next)
      i++
    }
  }

  // Add the last point
  if (path.length > 1) {
    smoothed.push(path[path.length - 1])
  }

  return smoothed
}

/**
 * Generate a fallback path when A* fails
 */
function generateFallbackPath(start: Point, goal: Point, elements: Element[], safetyMargin: number): Point[] {
  // Try to find a path with intermediate points
  const obstacles = elements.filter((el) => el.type === "OBSTACLE")

  // If no obstacles, return direct path
  if (obstacles.length === 0) {
    return [start, goal]
  }

  // Calculate direct vector
  const dx = goal.x - start.x
  const dy = goal.y - start.y
  const directDist = Math.sqrt(dx * dx + dy * dy)

  // Try perpendicular directions with increasing distances
  const perpX = -dy / directDist
  const perpY = dx / directDist

  const detourDistances = [0.3, 0.5, 0.7, 0.9].map((factor) => directDist * factor)

  for (const detourDist of detourDistances) {
    for (const sign of [-1, 1]) {
      const detourPoint: Point = {
        x: start.x + dx * 0.5 + sign * perpX * detourDist,
        y: start.y + dy * 0.5 + sign * perpY * detourDist,
      }

      // Check if detour point is valid
      if (isInsideWalkableArea(detourPoint, elements) && !isPointNearObstacle(detourPoint, elements, safetyMargin)) {
        // Check if paths to and from detour are clear
        let pathToClear = true
        let pathFromClear = true

        for (const obstacle of obstacles) {
          for (let i = 0; i < obstacle.points.length - 1; i++) {
            if (lineIntersectsLine(start, detourPoint, obstacle.points[i], obstacle.points[i + 1], safetyMargin)) {
              pathToClear = false
            }

            if (lineIntersectsLine(detourPoint, goal, obstacle.points[i], obstacle.points[i + 1], safetyMargin)) {
              pathFromClear = false
            }
          }
        }

        if (pathToClear && pathFromClear) {
          return [start, detourPoint, goal]
        }
      }
    }
  }

  // If all else fails, try multiple random points
  for (let attempt = 0; attempt < 30; attempt++) {
    const randomPoint: Point = {
      x: start.x + dx * 0.5 + (Math.random() - 0.5) * directDist,
      y: start.y + dy * 0.5 + (Math.random() - 0.5) * directDist,
    }

    if (isInsideWalkableArea(randomPoint, elements) && !isPointNearObstacle(randomPoint, elements, safetyMargin)) {
      return [start, randomPoint, goal]
    }
  }

  // Last resort: just return the start point (agent will wait)
  return [start]
}

/**
 * Check if a line intersects another line with a safety margin
 */
function lineIntersectsLine(a: Point, b: Point, c: Point, d: Point, safetyMargin: number): boolean {
  // Check for direct intersection
  if (doLinesIntersect(a, b, c, d)) {
    return true
  }

  // Check if any point is too close to the line
  if (
    distanceToLineSegment(a, c, d) < safetyMargin ||
    distanceToLineSegment(b, c, d) < safetyMargin ||
    distanceToLineSegment(c, a, b) < safetyMargin ||
    distanceToLineSegment(d, a, b) < safetyMargin
  ) {
    return true
  }

  return false
}

/**
 * Check if two line segments intersect
 */
function doLinesIntersect(a: Point, b: Point, c: Point, d: Point): boolean {
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

/**
 * Dynamically recalculate path when environment changes
 */
export function shouldRecalculatePath(
  agent: { position: Point; path?: Point[] },
  goal: Point,
  elements: Element[],
  safetyMargin: number,
): boolean {
  // If no path exists, we should calculate one
  if (!agent.path || agent.path.length < 2) {
    return true
  }

  // Check if the current path intersects with any obstacle
  const obstacles = elements.filter((el) => el.type === "OBSTACLE")

  for (let i = 0; i < agent.path.length - 1; i++) {
    const current = agent.path[i]
    const next = agent.path[i + 1]

    for (const obstacle of obstacles) {
      for (let j = 0; j < obstacle.points.length - 1; j++) {
        if (lineIntersectsLine(current, next, obstacle.points[j], obstacle.points[j + 1], safetyMargin)) {
          return true
        }
      }
    }
  }

  // Check if we're too far from the path
  if (agent.path.length > 1) {
    const nextPathPoint = agent.path[1]
    const distToPath = distance(agent.position, nextPathPoint)

    if (distToPath > 50) {
      return true
    }
  }

  return false
}

/**
 * Find a path using waypoints
 */
export function getWaypointPath(start: Point, end: Point, elements: Element[]): Point[] | null {
  // Get all waypoints
  const waypoints = elements.filter((el) => el.type === "WAYPOINT")
  if (waypoints.length === 0) return null

  // Find nearest waypoints to start and end
  let nearestStartWaypoint = null
  let minStartDist = Number.POSITIVE_INFINITY
  let nearestEndWaypoint = null
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

  // If we couldn't find valid waypoints, return null
  if (!nearestStartWaypoint || !nearestEndWaypoint) return null

  // If they're the same waypoint, just go directly
  if (nearestStartWaypoint.id === nearestEndWaypoint.id) {
    return [start, nearestStartWaypoint.points[0], end]
  }

  // Find a path through the waypoint network
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

  return null
}

/**
 * Check if a path intersects with any obstacle
 */
function pathIntersectsObstacle(start: Point, end: Point, elements: Element[]): boolean {
  const obstacles = elements.filter((el) => el.type === "OBSTACLE")

  for (const obstacle of obstacles) {
    if (obstacle.points.length < 2) continue
    for (let i = 0; i < obstacle.points.length - 1; i++) {
      if (doLineSegmentsIntersect(start, end, obstacle.points[i], obstacle.points[i + 1])) {
        return true
      }
    }
  }

  return false
}

/**
 * Check if two line segments intersect
 */
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

/**
 * Find a path through the waypoint graph
 * Enhanced to support circular paths and bidirectional connections
 */
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
  const queue: { waypoint: Element; path: Element[] }[] = [{ waypoint: startWaypoint, path: [startWaypoint] }]
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

// Find a path through waypoints
export function findPathThroughWaypoints(
  start: { x: number; y: number },
  waypoints: Waypoint[],
  waypointIds: string[],
  obstacles: Obstacle[],
): { x: number; y: number }[] {
  if (!waypoints.length || !waypointIds.length) {
    return []
  }

  // Get ordered waypoints
  const orderedWaypoints = waypointIds
    .map((id) => waypoints.find((wp) => wp.id === id))
    .filter((wp) => wp !== undefined) as Waypoint[]

  if (orderedWaypoints.length === 0) {
    return []
  }

  // Create a complete path through all waypoints
  let completePath: { x: number; y: number }[] = []
  let currentPosition = start

  for (const waypoint of orderedWaypoints) {
    const pathSegment = findPath(currentPosition, { x: waypoint.x, y: waypoint.y }, obstacles)

    // Add path segment (excluding the last point to avoid duplicates)
    if (completePath.length === 0) {
      completePath = pathSegment
    } else {
      // Skip the first point of the segment as it's the same as the last point of the previous segment
      completePath = completePath.concat(pathSegment.slice(1))
    }

    // Update current position
    currentPosition = { x: waypoint.x, y: waypoint.y }
  }

  return completePath
}
