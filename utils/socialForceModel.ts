import type { Agent, Obstacle, Point, Door, Room, SimulationConfig } from "@/types/simulationTypes"

// Calculate distance between two points
const distance = (p1: Point, p2: Point): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
}

// Calculate unit vector from p1 to p2
const unitVector = (p1: Point, p2: Point): Point => {
  const dist = distance(p1, p2)
  if (dist === 0) return { x: 0, y: 0 }
  return {
    x: (p2.x - p1.x) / dist,
    y: (p2.y - p1.y) / dist,
  }
}

// Calculate desired force (attraction to target)
export const calculateDesiredForce = (agent: Agent, targetPosition: Point, config: SimulationConfig): Point => {
  const direction = unitVector(agent.position, targetPosition)
  return {
    x: direction.x * config.socialForce.desiredForce * agent.maxSpeed,
    y: direction.y * config.socialForce.desiredForce * agent.maxSpeed,
  }
}

// Calculate repulsion force from other agents
export const calculateAgentRepulsionForce = (agent: Agent, otherAgents: Agent[], config: SimulationConfig): Point => {
  let repulsionX = 0
  let repulsionY = 0

  for (const other of otherAgents) {
    if (other.id === agent.id) continue

    const dist = distance(agent.position, other.position)
    const combinedRadius = agent.radius + other.radius

    // Only apply repulsion if agents are close enough
    if (dist < combinedRadius * 3) {
      const repulsionStrength = config.socialForce.repulsionForce * Math.exp(-(dist - combinedRadius) / combinedRadius)

      const direction = unitVector(other.position, agent.position)
      repulsionX += direction.x * repulsionStrength
      repulsionY += direction.y * repulsionStrength
    }
  }

  return { x: repulsionX, y: repulsionY }
}

// Calculate repulsion force from obstacles
export const calculateObstacleRepulsionForce = (
  agent: Agent,
  obstacles: Obstacle[],
  config: SimulationConfig,
): Point => {
  let repulsionX = 0
  let repulsionY = 0

  for (const obstacle of obstacles) {
    // Find closest point on obstacle to agent
    const closestX = Math.max(
      obstacle.position.x,
      Math.min(agent.position.x, obstacle.position.x + obstacle.size.width),
    )
    const closestY = Math.max(
      obstacle.position.y,
      Math.min(agent.position.y, obstacle.position.y + obstacle.size.height),
    )

    const closestPoint = { x: closestX, y: closestY }
    const dist = distance(agent.position, closestPoint)

    // Increase the repulsion range to ensure agents don't touch obstacles
    // Original: if (dist < agent.radius * 3)
    if (dist < agent.radius * 5) {
      // Increase the repulsion strength by multiplying by 2
      const repulsionStrength = config.socialForce.obstacleForce * 2 * Math.exp(-(dist - agent.radius) / agent.radius)

      const direction = unitVector(closestPoint, agent.position)
      repulsionX += direction.x * repulsionStrength
      repulsionY += direction.y * repulsionStrength
    }
  }

  return { x: repulsionX, y: repulsionY }
}

// Calculate attraction force to doors when agent needs to exit a room
export const calculateDoorAttractionForce = (
  agent: Agent,
  doors: Door[],
  rooms: Room[],
  targetPosition: Point,
  config: SimulationConfig,
): Point => {
  // If agent is not in a room, no door attraction is needed
  if (!agent.roomId) return { x: 0, y: 0 }

  // Find the current room
  const currentRoom = rooms.find((room) => room.id === agent.roomId)
  if (!currentRoom) return { x: 0, y: 0 }

  // Check if target is outside the current room
  const isTargetInRoom =
    targetPosition.x >= currentRoom.position.x &&
    targetPosition.x <= currentRoom.position.x + currentRoom.size.width &&
    targetPosition.y >= currentRoom.position.y &&
    targetPosition.y <= currentRoom.position.y + currentRoom.size.height

  // If target is in the same room, no door attraction is needed
  if (isTargetInRoom) return { x: 0, y: 0 }

  // Find the best door to exit through
  let bestDoor: Door | null = null
  let shortestPath = Number.POSITIVE_INFINITY

  for (const doorId of currentRoom.doorIds) {
    const door = doors.find((d) => d.id === doorId)
    if (!door || !door.isOpen) continue

    // Calculate path length through this door
    const doorCenter = {
      x: door.position.x + door.size.width / 2,
      y: door.position.y + door.size.height / 2,
    }

    const pathLength = distance(agent.position, doorCenter) + distance(doorCenter, targetPosition)

    if (pathLength < shortestPath) {
      shortestPath = pathLength
      bestDoor = door
    }
  }

  // If no suitable door found, return zero force
  if (!bestDoor) return { x: 0, y: 0 }

  // Calculate attraction to the best door
  const doorCenter = {
    x: bestDoor.position.x + bestDoor.size.width / 2,
    y: bestDoor.position.y + bestDoor.size.height / 2,
  }

  const direction = unitVector(agent.position, doorCenter)
  return {
    x: direction.x * config.socialForce.doorAttractionForce,
    y: direction.y * config.socialForce.doorAttractionForce,
  }
}

// Combine all forces to calculate the total force acting on an agent
export const calculateTotalForce = (
  agent: Agent,
  targetPosition: Point,
  otherAgents: Agent[],
  obstacles: Obstacle[],
  doors: Door[],
  rooms: Room[],
  config: SimulationConfig,
): Point => {
  const desiredForce = calculateDesiredForce(agent, targetPosition, config)
  const repulsionForce = calculateAgentRepulsionForce(agent, otherAgents, config)
  const obstacleForce = calculateObstacleRepulsionForce(agent, obstacles, config)
  const doorForce = calculateDoorAttractionForce(agent, doors, rooms, targetPosition, config)

  return {
    x: desiredForce.x + repulsionForce.x + obstacleForce.x + doorForce.x,
    y: desiredForce.y + repulsionForce.y + obstacleForce.y + doorForce.y,
  }
}

// Update agent velocity based on social forces
export const updateAgentVelocity = (agent: Agent, force: Point, deltaTime: number): Point => {
  // Simple Euler integration
  const newVelocity = {
    x: agent.velocity.x + force.x * deltaTime,
    y: agent.velocity.y + force.y * deltaTime,
  }

  // Calculate speed
  const speed = Math.sqrt(Math.pow(newVelocity.x, 2) + Math.pow(newVelocity.y, 2))

  // Cap speed at maxSpeed
  if (speed > agent.maxSpeed) {
    const factor = agent.maxSpeed / speed
    newVelocity.x *= factor
    newVelocity.y *= factor
  }

  return newVelocity
}

// Check if agent is inside a room
export const determineAgentRoom = (agent: Agent, rooms: Room[]): string | undefined => {
  for (const room of rooms) {
    if (
      agent.position.x >= room.position.x &&
      agent.position.x <= room.position.x + room.size.width &&
      agent.position.y >= room.position.y &&
      agent.position.y <= room.position.y + room.size.height
    ) {
      return room.id
    }
  }
  return undefined
}

// Check if agent is passing through a door
export const isPassingThroughDoor = (agent: Agent, door: Door): boolean => {
  return (
    agent.position.x >= door.position.x &&
    agent.position.x <= door.position.x + door.size.width &&
    agent.position.y >= door.position.y &&
    agent.position.y <= door.position.y + door.size.height
  )
}
