import type { Agent, Waypoint, Obstacle } from "@/types/simulationTypes"

// Draw the grid
export function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number, gridSize = 50): void {
  ctx.beginPath()
  ctx.strokeStyle = "#eee"
  ctx.lineWidth = 1

  // Draw vertical lines
  for (let x = 0; x <= width; x += gridSize) {
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
  }

  // Draw horizontal lines
  for (let y = 0; y <= height; y += gridSize) {
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
  }

  ctx.stroke()
}

// Draw agents
export function drawAgents(
  ctx: CanvasRenderingContext2D,
  agents: Agent[],
  selectedElement: { type: string; id: string } | null,
): void {
  for (const agent of agents) {
    const isSelected = selectedElement?.type === "agent" && selectedElement?.id === agent.id

    // Draw agent circle
    ctx.beginPath()
    ctx.arc(agent.x, agent.y, agent.radius || 10, 0, Math.PI * 2)
    ctx.fillStyle = agent.color || (isSelected ? "#ff6b6b" : "#4dabf7")
    ctx.fill()

    // Draw selection indicator if selected
    if (isSelected) {
      ctx.beginPath()
      ctx.arc(agent.x, agent.y, (agent.radius || 10) + 4, 0, Math.PI * 2)
      ctx.strokeStyle = "#ff6b6b"
      ctx.lineWidth = 2
      ctx.stroke()
    }

    // Draw agent ID
    ctx.fillStyle = "#000"
    ctx.font = "10px Arial"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(agent.id, agent.x, agent.y)
  }
}

// Draw waypoints
export function drawWaypoints(
  ctx: CanvasRenderingContext2D,
  waypoints: Waypoint[],
  selectedElement: { type: string; id: string } | null,
): void {
  // First draw connections
  for (const waypoint of waypoints) {
    for (const connectionId of waypoint.connections) {
      const connectedWaypoint = waypoints.find((wp) => wp.id === connectionId)
      if (connectedWaypoint) {
        // Check if this is a bidirectional connection
        const isBidirectional = connectedWaypoint.connections.includes(waypoint.id)

        // Draw connection line
        ctx.beginPath()
        ctx.moveTo(waypoint.x, waypoint.y)
        ctx.lineTo(connectedWaypoint.x, connectedWaypoint.y)

        // Style based on connection type
        if (isBidirectional) {
          ctx.strokeStyle = "#74c0fc"
        } else {
          ctx.strokeStyle = "#a5d8ff"
        }

        ctx.lineWidth = 2
        ctx.stroke()

        // Draw arrow for direction
        const angle = Math.atan2(connectedWaypoint.y - waypoint.y, connectedWaypoint.x - waypoint.x)

        // Calculate position for the arrow (80% along the line)
        const arrowX = waypoint.x + (connectedWaypoint.x - waypoint.x) * 0.8
        const arrowY = waypoint.y + (connectedWaypoint.y - waypoint.y) * 0.8

        // Draw arrow
        ctx.beginPath()
        ctx.moveTo(arrowX, arrowY)
        ctx.lineTo(arrowX - 10 * Math.cos(angle - Math.PI / 6), arrowY - 10 * Math.sin(angle - Math.PI / 6))
        ctx.lineTo(arrowX - 10 * Math.cos(angle + Math.PI / 6), arrowY - 10 * Math.sin(angle + Math.PI / 6))
        ctx.closePath()
        ctx.fillStyle = isBidirectional ? "#74c0fc" : "#a5d8ff"
        ctx.fill()
      }
    }
  }

  // Then draw waypoints
  for (const waypoint of waypoints) {
    const isSelected = selectedElement?.type === "waypoint" && selectedElement?.id === waypoint.id

    // Draw waypoint
    ctx.beginPath()
    ctx.arc(waypoint.x, waypoint.y, 8, 0, Math.PI * 2)
    ctx.fillStyle = isSelected ? "#ff6b6b" : "#20c997"
    ctx.fill()

    // Draw selection indicator if selected
    if (isSelected) {
      ctx.beginPath()
      ctx.arc(waypoint.x, waypoint.y, 12, 0, Math.PI * 2)
      ctx.strokeStyle = "#ff6b6b"
      ctx.lineWidth = 2
      ctx.stroke()
    }

    // Draw waypoint ID
    ctx.fillStyle = "#000"
    ctx.font = "10px Arial"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(waypoint.id, waypoint.x, waypoint.y + 20)
  }
}

// Draw obstacles
export function drawObstacles(
  ctx: CanvasRenderingContext2D,
  obstacles: Obstacle[],
  selectedElement: { type: string; id: string } | null,
): void {
  for (const obstacle of obstacles) {
    const isSelected = selectedElement?.type === "obstacle" && selectedElement?.id === obstacle.id

    if (obstacle.points.length < 3) continue

    // Draw obstacle
    ctx.beginPath()
    ctx.moveTo(obstacle.points[0].x, obstacle.points[0].y)

    for (let i = 1; i < obstacle.points.length; i++) {
      ctx.lineTo(obstacle.points[i].x, obstacle.points[i].y)
    }

    ctx.closePath()
    ctx.fillStyle = isSelected ? "rgba(255, 107, 107, 0.3)" : "rgba(173, 181, 189, 0.5)"
    ctx.fill()

    // Draw outline
    ctx.strokeStyle = isSelected ? "#ff6b6b" : "#adb5bd"
    ctx.lineWidth = isSelected ? 3 : 2
    ctx.stroke()

    // Draw vertices
    for (const point of obstacle.points) {
      ctx.beginPath()
      ctx.arc(point.x, point.y, 4, 0, Math.PI * 2)
      ctx.fillStyle = isSelected ? "#ff6b6b" : "#adb5bd"
      ctx.fill()
    }
  }
}

// Draw the canvas
export function drawCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  agents: Agent[],
  waypoints: Waypoint[],
  obstacles: Obstacle[],
  selectedElement: { type: string; id: string } | null,
): void {
  // Clear canvas
  ctx.clearRect(0, 0, width, height)

  // Draw grid
  drawGrid(ctx, width, height)

  // Draw obstacles
  drawObstacles(ctx, obstacles, selectedElement)

  // Draw waypoints
  drawWaypoints(ctx, waypoints, selectedElement)

  // Draw agents
  drawAgents(ctx, agents, selectedElement)
}
