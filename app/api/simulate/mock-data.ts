import { isInsideWalkableArea, isPointNearObstacle, findPath } from "@/utils/simulationUtils"

// Helper function to generate mock simulation frames
export function generateMockSimulationFrames(elements: any[], simulationTime: number, timeStep: number) {
  const frames = []
  const numFrames = Math.ceil(simulationTime / timeStep)

  // Find start points and sources
  const startPoints = elements.filter((el) => el.type === "START_POINT")
  const sources = elements.filter((el) => el.type === "SOURCE_RECTANGLE")

  // Find exit points
  const exitPoints = elements.filter((el) => el.type === "EXIT_POINT")

  // Generate initial agents
  const agents = []
  let agentId = 0

  // Add agents from start points
  for (const startPoint of startPoints) {
    if (startPoint.points && startPoint.points.length > 0) {
      agents.push({
        id: `agent-${agentId++}`,
        position: { ...startPoint.points[0] },
        radius: 5 + Math.random() * 3,
      })
    }
  }

  // Add agents from sources
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

        while (!validPosition && attempts < 10) {
          position = {
            x: x1 + Math.random() * width,
            y: y1 + Math.random() * height,
          }

          // Check if position is valid (inside walkable area and not too close to obstacles)
          validPosition = isInsideWalkableArea(position, elements) && !isPointNearObstacle(position, elements, 10)
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

  // If no agents, create some default ones
  if (agents.length === 0) {
    for (let i = 0; i < 10; i++) {
      agents.push({
        id: `agent-${i}`,
        position: {
          x: 100 + Math.random() * 200,
          y: 100 + Math.random() * 200,
        },
        radius: 5 + Math.random() * 3,
      })
    }
  }

  // Generate target positions from exit points
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

  // Generate agent paths with obstacle avoidance
  const agentPaths = {}

  for (const agent of agents) {
    // Pick a random target
    const targetIdx = Math.floor(agent.id.charCodeAt(agent.id.length - 1) % targetPositions.length)
    const target = targetPositions[targetIdx]

    // Generate path with obstacle avoidance
    const pathPoints = Math.ceil(numFrames * 0.7) // Use fewer points than frames for smoother movement
    agentPaths[agent.id] = findPath(agent.position, target, elements, pathPoints)
  }

  // Generate frames
  for (let frameIdx = 0; frameIdx < numFrames; frameIdx++) {
    const time = frameIdx * timeStep
    const frameAgents = []

    for (const agent of agents) {
      // Calculate progress through the path
      const path = agentPaths[agent.id]
      if (!path) continue

      // Find the appropriate point in the path based on frame index
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
