import type { Agent, Waypoint, Obstacle } from "@/types/simulationTypes"

// Calculate repulsion force between agents to prevent overlap
export function calculateRepulsionForce(
  agent: Agent,
  otherAgents: Agent[],
  repulsionStrength = 5.0,
  minDistance = 0.6,
): { x: number; y: number } {
  let forceX = 0
  let forceY = 0

  for (const other of otherAgents) {
    if (agent.id === other.id) continue

    const dx = agent.x - other.x
    const dy = agent.y - other.y
    const distanceSquared = dx * dx + dy * dy
    const distance = Math.sqrt(distanceSquared)

    // Apply repulsion force if agents are too close
    if (distance < minDistance) {
      // Normalize direction vector
      const nx = dx / distance
      const ny = dy / distance

      // Calculate repulsion force (stronger as agents get closer)
      const forceMagnitude = repulsionStrength * (1 - distance / minDistance)

      forceX += nx * forceMagnitude
      forceY += ny * forceMagnitude
    }
  }

  return { x: forceX, y: forceY }
}

// Check if an agent is colliding with any obstacle
export function isCollidingWithObstacle(agent: Agent, obstacles: Obstacle[], buffer = 0.1): boolean {
  const agentRadius = agent.radius || 0.3

  for (const obstacle of obstacles) {
    // Check if agent is inside the obstacle
    if (isPointInPolygon(agent.x, agent.y, obstacle.points)) {
      return true
    }

    // Check if agent is too close to any edge of the obstacle
    const edges = getObstacleEdges(obstacle)

    for (const edge of edges) {
      const distance = distanceToLineSegment(agent.x, agent.y, edge.x1, edge.y1, edge.x2, edge.y2)

      if (distance < agentRadius + buffer) {
        return true
      }
    }
  }

  return false
}

// Get all edges of an obstacle
function getObstacleEdges(obstacle: Obstacle): { x1: number; y1: number; x2: number; y2: number }[] {
  const edges = []
  const points = obstacle.points

  for (let i = 0; i < points.length; i++) {
    const p1 = points[i]
    const p2 = points[(i + 1) % points.length]

    edges.push({
      x1: p1.x,
      y1: p1.y,
      x2: p2.x,
      y2: p2.y,
    })
  }

  return edges
}

// Calculate distance from a point to a line segment
function distanceToLineSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const A = px - x1
  const B = py - y1
  const C = x2 - x1
  const D = y2 - y1

  const dot = A * C + B * D
  const lenSq = C * C + D * D
  let param = -1

  if (lenSq !== 0) {
    param = dot / lenSq
  }

  let xx, yy

  if (param < 0) {
    xx = x1
    yy = y1
  } else if (param > 1) {
    xx = x2
    yy = y2
  } else {
    xx = x1 + param * C
    yy = y1 + param * D
  }

  const dx = px - xx
  const dy = py - yy

  return Math.sqrt(dx * dx + dy * dy)
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

// Check if an agent has reached a waypoint
export function hasReachedWaypoint(agent: Agent, waypoint: Waypoint, threshold = 0.5): boolean {
  const dx = agent.x - waypoint.x
  const dy = agent.y - waypoint.y
  const distance = Math.sqrt(dx * dx + dy * dy)

  return distance <= threshold
}

// Get the next waypoint for an agent
export function getNextWaypoint(agent: Agent, waypoints: Waypoint[], waypointIds: string[]): Waypoint | null {
  if (!waypointIds || waypointIds.length === 0) {
    return null
  }

  const nextWaypointId = waypointIds[0]
  return waypoints.find((wp) => wp.id === nextWaypointId) || null
}

// Move agent towards a target position while avoiding obstacles
export function moveAgentTowardsTarget(
  agent: Agent,
  targetX: number,
  targetY: number,
  obstacles: Obstacle[],
  otherAgents: Agent[],
  dt = 0.05,
): void {
  // Calculate direction to target
  const dx = targetX - agent.x
  const dy = targetY - agent.y
  const distance = Math.sqrt(dx * dx + dy * dy)

  if (distance < 0.1) {
    // Agent has reached the target
    return
  }

  // Normalize direction
  const dirX = dx / distance
  const dirY = dy / distance

  // Calculate repulsion force from other agents
  const repulsionForce = calculateRepulsionForce(agent, otherAgents)

  // Calculate obstacle avoidance force
  const obstacleForce = calculateObstacleAvoidanceForce(agent, obstacles)

  // Combine forces
  const totalForceX = dirX + repulsionForce.x + obstacleForce.x
  const totalForceY = dirY + repulsionForce.y + obstacleForce.y

  // Normalize the total force
  const totalForceMagnitude = Math.sqrt(totalForceX * totalForceX + totalForceY * totalForceY)

  let moveX = 0
  let moveY = 0

  if (totalForceMagnitude > 0) {
    const normalizedForceX = totalForceX / totalForceMagnitude
    const normalizedForceY = totalForceY / totalForceMagnitude

    // Calculate movement
    const speed = agent.speed || 1.0
    moveX = normalizedForceX * speed * dt
    moveY = normalizedForceY * speed * dt
  }

  // Update agent position
  agent.x += moveX
  agent.y += moveY

  // Ensure agent doesn't collide with obstacles after movement
  if (isCollidingWithObstacle(agent, obstacles)) {
    // Revert movement if collision occurs
    agent.x -= moveX
    agent.y -= moveY
  }
}

// Calculate obstacle avoidance force
function calculateObstacleAvoidanceForce(
  agent: Agent,
  obstacles: Obstacle[],
  sensorRange = 2.0,
  avoidanceStrength = 3.0,
): { x: number; y: number } {
  let forceX = 0
  let forceY = 0

  for (const obstacle of obstacles) {
    const edges = getObstacleEdges(obstacle)

    for (const edge of edges) {
      const distance = distanceToLineSegment(agent.x, agent.y, edge.x1, edge.y1, edge.x2, edge.y2)

      // Apply avoidance force if agent is close to an edge
      if (distance < sensorRange) {
        // Calculate closest point on the edge
        const closestPoint = closestPointOnLineSegment(agent.x, agent.y, edge.x1, edge.y1, edge.x2, edge.y2)

        // Calculate direction away from the edge
        const dx = agent.x - closestPoint.x
        const dy = agent.y - closestPoint.y
        const edgeDistance = Math.sqrt(dx * dx + dy * dy)

        if (edgeDistance > 0) {
          // Normalize direction
          const nx = dx / edgeDistance
          const ny = dy / edgeDistance

          // Calculate force (stronger as agent gets closer to the edge)
          const forceMagnitude = avoidanceStrength * (1 - distance / sensorRange)

          forceX += nx * forceMagnitude
          forceY += ny * forceMagnitude
        }
      }
    }
  }

  return { x: forceX, y: forceY }
}

// Find the closest point on a line segment
function closestPointOnLineSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): { x: number; y: number } {
  const A = px - x1
  const B = py - y1
  const C = x2 - x1
  const D = y2 - y1

  const dot = A * C + B * D
  const lenSq = C * C + D * D
  let param = -1

  if (lenSq !== 0) {
    param = dot / lenSq
  }

  let xx, yy

  if (param < 0) {
    xx = x1
    yy = y1
  } else if (param > 1) {
    xx = x2
    yy = y2
  } else {
    xx = x1 + param * C
    yy = y1 + param * D
  }

  return { x: xx, y: yy }
}
