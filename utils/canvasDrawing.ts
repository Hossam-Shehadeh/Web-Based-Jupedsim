import type { Element, Agent, Point } from "../types/simulationTypes"

const GRID_SIZE = 50

export function drawCanvas(
  canvas: HTMLCanvasElement,
  {
    elements,
    agents,
    scale,
    offset,
    isSimulationRunning,
    simulationSpeed,
    simulationTime,
  }: {
    elements: Element[]
    agents: Agent[]
    scale: number
    offset: Point
    isSimulationRunning: boolean
    simulationSpeed: number
    simulationTime: number
  },
) {
  const ctx = canvas.getContext("2d")
  if (!ctx) return

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Apply transformations
  ctx.save()
  ctx.translate(offset.x, offset.y)
  ctx.scale(scale, scale)

  // Draw background
  drawBackground(ctx, canvas.width / scale, canvas.height / scale)

  // Draw grid
  drawGrid(ctx, canvas, scale, offset)

  // Draw elements
  elements.forEach((element) => drawElement(ctx, element, scale))

  // Draw agents
  drawAgents(ctx, agents, scale)

  // Display simulation info
  if (isSimulationRunning) {
    drawSimulationInfo(ctx, scale, simulationSpeed, agents.length, simulationTime)
  }

  ctx.restore()
}

// Update the drawBackground function to create a square pattern
function drawBackground(ctx: CanvasRenderingContext2D, width: number, height: number) {
  // Draw grid background with squares
  const gridSize = 30
  ctx.save()

  // Draw squares pattern
  for (let x = 0; x <= width; x += gridSize) {
    for (let y = 0; y <= height; y += gridSize) {
      // Alternate colors for checkerboard effect
      const isEvenRow = Math.floor(y / gridSize) % 2 === 0
      const isEvenCol = Math.floor(x / gridSize) % 2 === 0

      if ((isEvenRow && isEvenCol) || (!isEvenRow && !isEvenCol)) {
        ctx.fillStyle = "#f9fafb" // Light square
      } else {
        ctx.fillStyle = "#f3f4f6" // Slightly darker square
      }

      ctx.fillRect(x, y, gridSize, gridSize)
    }
  }

  // Draw grid lines
  ctx.strokeStyle = "#e5e7eb" // Light gray grid lines
  ctx.lineWidth = 0.5

  // Draw vertical lines
  for (let x = 0; x <= width; x += gridSize) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }

  // Draw horizontal lines
  for (let y = 0; y <= height; y += gridSize) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }

  // Add subtle dots at intersections
  ctx.fillStyle = "#d1d5db"
  for (let x = 0; x <= width; x += gridSize) {
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath()
      ctx.arc(x, y, 1, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.restore()
}

function drawGrid(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, scale: number, offset: Point) {
  const gridOffsetX = offset.x % (GRID_SIZE * scale)
  const gridOffsetY = offset.y % (GRID_SIZE * scale)

  ctx.beginPath()
  ctx.strokeStyle = "#e5e7eb"
  ctx.lineWidth = 0.5 / scale

  for (let x = gridOffsetX / scale; x < canvas.width / scale; x += GRID_SIZE) {
    ctx.moveTo(x, 0)
    ctx.lineTo(x, canvas.height / scale)
  }

  for (let y = gridOffsetY / scale; y < canvas.height / scale; y += GRID_SIZE) {
    ctx.moveTo(0, y)
    ctx.lineTo(canvas.width / scale, y)
  }

  ctx.stroke()
}

// Update the drawElement function to make obstacles more visible
function drawElement(ctx: CanvasRenderingContext2D, element: Element, scale: number) {
  ctx.beginPath()

  switch (element.type) {
    case "STREET_LINE":
    case "FREE_LINE":
      ctx.strokeStyle = "#3b82f6"
      ctx.lineWidth = 2 / scale
      drawLine(ctx, element.points, element.type === "STREET_LINE")
      break

    case "OBSTACLE":
      // Draw a danger zone around obstacles to visualize the safety margin
      ctx.fillStyle = "rgba(255, 0, 0, 0.08)" // Very light red fill for danger zone
      if (element.points.length > 2) {
        // For polygon obstacles, draw expanded polygon
        drawExpandedPolygon(ctx, element.points, 40 / scale)
        ctx.fill()
      } else if (element.points.length === 2) {
        // For line obstacles, draw expanded line
        drawExpandedLine(ctx, element.points[0], element.points[1], 40 / scale)
        ctx.fill()
      }

      // Draw the actual obstacle
      ctx.strokeStyle = "#000000"
      ctx.lineWidth = 4 / scale
      drawLine(ctx, element.points, false)

      // Add a semi-transparent fill to make obstacles more visible
      if (element.points.length > 2) {
        ctx.fillStyle = "rgba(255, 0, 0, 0.2)" // Light red fill
        ctx.fill()
      } else if (element.points.length === 2) {
        // For line obstacles, draw a thicker line with a red highlight
        ctx.save()
        ctx.strokeStyle = "rgba(255, 0, 0, 0.6)" // Red highlight
        ctx.lineWidth = 8 / scale
        ctx.beginPath()
        ctx.moveTo(element.points[0].x, element.points[0].y)
        ctx.lineTo(element.points[1].x, element.points[1].y)
        ctx.stroke()
        ctx.restore()

        // Draw the black line on top
        ctx.strokeStyle = "#000000"
        ctx.lineWidth = 4 / scale
        ctx.beginPath()
        ctx.moveTo(element.points[0].x, element.points[0].y)
        ctx.lineTo(element.points[1].x, element.points[1].y)
        ctx.stroke()
      }
      break

    case "START_POINT":
      ctx.fillStyle = "#22c55e"
      drawCircle(ctx, element.points[0], 8 / scale)
      break

    case "SOURCE_RECTANGLE":
      drawRectangle(ctx, element.points, "rgba(34, 197, 94, 0.3)", "#22c55e", 2 / scale)
      drawAgentCount(ctx, element, scale)
      break

    case "EXIT_POINT":
      drawRectangle(ctx, element.points, "rgba(239, 68, 68, 0.3)", "#ef4444", 2 / scale)
      drawExitLabel(ctx, element, scale)
      break

    case "WAYPOINT":
      drawWaypoint(ctx, element, scale)
      break
  }
}

// Draw an expanded polygon to visualize the safety margin
function drawExpandedPolygon(ctx: CanvasRenderingContext2D, points: Point[], margin: number) {
  if (points.length < 3) return

  // Simple approach: draw a circle around each point and a rectangle around each edge
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i]
    const p2 = points[(i + 1) % points.length]

    // Draw circle around each vertex
    ctx.beginPath()
    ctx.arc(p1.x, p1.y, margin, 0, Math.PI * 2)
    ctx.fill()

    // Draw rectangle along each edge
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    const length = Math.sqrt(dx * dx + dy * dy)

    if (length > 0) {
      const nx = (-dy / length) * margin
      const ny = (dx / length) * margin

      ctx.beginPath()
      ctx.moveTo(p1.x + nx, p1.y + ny)
      ctx.lineTo(p2.x + nx, p2.y + ny)
      ctx.lineTo(p2.x - nx, p2.y - ny)
      ctx.lineTo(p1.x - nx, p1.y - ny)
      ctx.closePath()
      ctx.fill()
    }
  }
}

// Draw an expanded line to visualize the safety margin
function drawExpandedLine(ctx: CanvasRenderingContext2D, p1: Point, p2: Point, margin: number) {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  const length = Math.sqrt(dx * dx + dy * dy)

  if (length > 0) {
    const nx = (-dy / length) * margin
    const ny = (dx / length) * margin

    ctx.beginPath()
    ctx.moveTo(p1.x + nx, p1.y + ny)
    ctx.lineTo(p2.x + nx, p2.y + ny)
    ctx.lineTo(p2.x - nx, p2.y - ny)
    ctx.lineTo(p1.x - nx, p1.y - ny)
    ctx.closePath()

    // Draw circles at the ends
    ctx.beginPath()
    ctx.arc(p1.x, p1.y, margin, 0, Math.PI * 2)
    ctx.fill()

    ctx.beginPath()
    ctx.arc(p2.x, p2.y, margin, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawLine(ctx: CanvasRenderingContext2D, points: Point[], snap: boolean) {
  if (points.length > 0) {
    ctx.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      if (snap) {
        const snapX = Math.round(points[i].x / GRID_SIZE) * GRID_SIZE
        const snapY = Math.round(points[i].y / GRID_SIZE) * GRID_SIZE
        ctx.lineTo(snapX, snapY)
      } else {
        ctx.lineTo(points[i].x, points[i].y)
      }
    }
  }
  ctx.stroke()
}

function drawCircle(ctx: CanvasRenderingContext2D, center: Point, radius: number) {
  ctx.beginPath()
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2)
  ctx.fill()
}

function drawRectangle(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  fillColor: string,
  strokeColor: string,
  lineWidth: number,
) {
  if (points.length === 2) {
    ctx.fillStyle = fillColor
    ctx.fillRect(points[0].x, points[0].y, points[1].x - points[0].x, points[1].y - points[0].y)
    ctx.strokeStyle = strokeColor
    ctx.lineWidth = lineWidth
    ctx.strokeRect(points[0].x, points[0].y, points[1].x - points[0].x, points[1].y - points[0].y)
  }
}

function drawAgentCount(ctx: CanvasRenderingContext2D, element: Element, scale: number) {
  if (element.properties?.agentCount) {
    ctx.fillStyle = "#000000"
    ctx.font = `${14 / scale}px sans-serif`
    ctx.fillText(
      `Agents: ${element.properties.agentCount}`,
      element.points[0].x + 5 / scale,
      element.points[0].y + 20 / scale,
    )
  }
}

function drawExitLabel(ctx: CanvasRenderingContext2D, element: Element, scale: number) {
  ctx.fillStyle = "#000000"
  ctx.font = `${14 / scale}px sans-serif`
  ctx.fillText("Exit", element.points[0].x + 5 / scale, element.points[0].y + 20 / scale)
}

function drawWaypoint(ctx: CanvasRenderingContext2D, element: Element, scale: number) {
  ctx.fillStyle = "#3b82f6"
  drawCircle(ctx, element.points[0], 10 / scale)

  ctx.fillStyle = "#ffffff"
  drawCircle(ctx, element.points[0], 5 / scale)

  if (element.properties?.connections) {
    element.properties.connections.forEach((targetId) => {
      const target = elements.find((el) => el.id === targetId)
      if (target && target.type === "WAYPOINT") {
        drawWaypointConnection(ctx, element.points[0], target.points[0], scale)
      }
    })
  }
}

function drawWaypointConnection(ctx: CanvasRenderingContext2D, start: Point, end: Point, scale: number) {
  ctx.beginPath()
  ctx.strokeStyle = "#3b82f6"
  ctx.lineWidth = 2 / scale
  ctx.setLineDash([5 / scale, 5 / scale])
  ctx.moveTo(start.x, start.y)
  ctx.lineTo(end.x, end.y)
  ctx.stroke()
  ctx.setLineDash([])

  drawArrow(ctx, start, end, scale)
}

function drawArrow(ctx: CanvasRenderingContext2D, start: Point, end: Point, scale: number) {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const angle = Math.atan2(dy, dx)

  ctx.beginPath()
  ctx.fillStyle = "#3b82f6"
  ctx.moveTo(
    end.x - (15 / scale) * Math.cos(angle) + (8 / scale) * Math.cos(angle - Math.PI / 2),
    end.y - (15 / scale) * Math.sin(angle) + (8 / scale) * Math.sin(angle - Math.PI / 2),
  )
  ctx.lineTo(
    end.x - (15 / scale) * Math.cos(angle) + (8 / scale) * Math.cos(angle + Math.PI / 2),
    end.y - (15 / scale) * Math.sin(angle) + (8 / scale) * Math.sin(angle + Math.PI / 2),
  )
  ctx.lineTo(end.x, end.y)
  ctx.closePath()
  ctx.fill()
}

function drawAgents(ctx: CanvasRenderingContext2D, agents: Agent[], scale: number) {
  agents.forEach((agent) => {
    // Draw agent body as a simple circle
    ctx.fillStyle = "rgba(255, 0, 0, 0.7)"
    ctx.beginPath()
    ctx.arc(agent.position.x, agent.position.y, agent.radius, 0, Math.PI * 2)
    ctx.fill()

    // Add a subtle outline
    ctx.strokeStyle = "#cc0000"
    ctx.lineWidth = 0.5 / scale
    ctx.stroke()
  })
}

function drawSimulationInfo(
  ctx: CanvasRenderingContext2D,
  scale: number,
  simulationSpeed: number,
  agentCount: number,
  simulationTime: number,
) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
  ctx.font = `${16 / scale}px sans-serif`
  ctx.fillText(`Speed: ${simulationSpeed.toFixed(1)} m/s`, 10 / scale, 30 / scale)
  ctx.fillText(`Agents: ${agentCount}`, 10 / scale, 50 / scale)
  ctx.fillText(`Time: ${simulationTime.toFixed(1)}s`, 10 / scale, 70 / scale)
}
