import type { Element, Point } from "../types/simulationTypes"
import { distance, isInsideWalkableArea, isPointNearObstacle, distanceToLineSegment } from "./simulationUtils"

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
    const neighbors = getNeighbors(current, grid, bounds)

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
function getNeighbors(
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
