"use client"

import type React from "react"
import { useRef, useState, useEffect } from "react"
import { useSimulation } from "./simulation-context"
import { Button } from "@/components/ui/button"
import { Play, Pause, Grid, SkipBack, SkipForward } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import type { Point } from "../types/simulationTypes"

interface CanvasProps {
  width: number
  height: number
}

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [showGrid, setShowGrid] = useState(true)
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [gridSize, setGridSize] = useState(20)

  const {
    elements,
    selectedTool,
    selectedElement,
    isDrawing,
    setIsDrawing,
    addElement,
    updateElement,
    selectElement,
    agents,
    setAgents,
    isSimulationRunning,
    simulationFrames,
    currentFrame,
    setCurrentFrame,
    isPlaying,
    setIsPlaying,
    validateDrawing,
    setAlertMessage,
    orderedWaypoints,
    addToOrderedWaypoints,
    removeFromOrderedWaypoints,
    simulationTime,
  } = useSimulation()

  const [tempPoints, setTempPoints] = useState<Point[]>([])
  const [hoveredElement, setHoveredElement] = useState<string | null>(null)
  const animationRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(0)
  const [connectionMode, setConnectionMode] = useState<string | null>(null)
  const [connectionPreview, setConnectionPreview] = useState<{ from: Point; to: Point } | null>(null)
  const [doorConnectionMode, setDoorConnectionMode] = useState<{
    doorId: string
    roomId: string
    targetRoomId: string | null
  } | null>(null)

  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 })
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([])

  // Draw the ordered waypoint path
  const drawOrderedWaypointPath = (ctx: CanvasRenderingContext2D) => {
    if (orderedWaypoints.length < 2) return

    // Draw the ordered path with a distinct style
    ctx.strokeStyle = "#10b981" // Emerald green
    ctx.lineWidth = 3
    ctx.setLineDash([10, 5]) // Dashed line

    let startPoint: Point | null = null

    for (let i = 0; i < orderedWaypoints.length; i++) {
      const waypointId = orderedWaypoints[i]
      const waypoint = elements.find((el) => el.id === waypointId)

      if (waypoint && waypoint.points.length > 0) {
        const point = waypoint.points[0]

        if (startPoint) {
          // Draw line from previous waypoint to this one
          ctx.beginPath()
          ctx.moveTo(startPoint.x, startPoint.y)
          ctx.lineTo(point.x, point.y)
          ctx.stroke()
        }

        // Draw waypoint number
        ctx.fillStyle = "#10b981"
        ctx.font = "bold 14px Arial"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(`${i + 1}`, point.x, point.y)

        startPoint = point
      }
    }

    // Reset dash pattern
    ctx.setLineDash([])
  }

  // Add this function to handle waypoint double-click
  const handleWaypointDoubleClick = (waypointId: string, position: Point) => {
    // If already in connection mode, cancel it
    if (connectionMode) {
      setConnectionMode(null)
      setConnectionPreview(null)
      return
    }

    // Check if this waypoint is already in the ordered path
    if (orderedWaypoints.includes(waypointId)) {
      // If already in the path, remove it
      removeFromOrderedWaypoints(waypointId)
      setAlertMessage(`Waypoint removed from the ordered path`)
    } else {
      // Add to the ordered path
      addToOrderedWaypoints(waypointId)
      setAlertMessage(`Waypoint added to the ordered path as #${orderedWaypoints.length + 1}`)
    }
  }

  const handleDoorDoubleClick = (doorId: string) => {
    // Start door connection mode
    setDoorConnectionMode({
      doorId,
      roomId: "",
      targetRoomId: null,
    })
    setAlertMessage("Select the first room this door connects to")
  }

  // Handle animation frame updates
  useEffect(() => {
    if (isSimulationRunning && isPlaying && simulationFrames.length > 0) {
      const animate = (time: number) => {
        if (!lastTimeRef.current) {
          lastTimeRef.current = time
        }

        const deltaTime = time - lastTimeRef.current
        if (deltaTime > 100) {
          // Update every 100ms
          lastTimeRef.current = time
          setCurrentFrame((prev) => {
            const next = prev + 1
            if (next >= simulationFrames.length) {
              setIsPlaying(false)
              return prev
            }
            return next
          })
        }

        animationRef.current = requestAnimationFrame(animate)
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isSimulationRunning, isPlaying, simulationFrames.length, setCurrentFrame, setIsPlaying])

  // Update agents when current frame changes
  useEffect(() => {
    if (isSimulationRunning && simulationFrames.length > 0 && currentFrame < simulationFrames.length) {
      setAgents(simulationFrames[currentFrame].agents)
    }
  }, [currentFrame, isSimulationRunning, setAgents, simulationFrames])

  // Function to snap a point to the grid
  const snapPointToGrid = (point: Point): Point => {
    if (!snapToGrid) return point
    return {
      x: Math.round(point.x / gridSize) * gridSize,
      y: Math.round(point.y / gridSize) * gridSize,
    }
  }

  // Draw the canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw grid if enabled
    if (showGrid) {
      ctx.strokeStyle = "#e5e7eb"
      ctx.lineWidth = 0.5

      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.height, y)
        ctx.stroke()
      }
    }

    // Draw elements
    elements.forEach((element) => {
      const isSelected = selectedElement?.id === element.id
      const isHovered = hoveredElement === element.id

      switch (element.type) {
        case "ROOM":
          ctx.strokeStyle = isSelected || isHovered ? "#8b5cf6" : "#a78bfa" // Purple
          ctx.fillStyle = "rgba(167, 139, 250, 0.1)" // Light purple with transparency
          ctx.lineWidth = isSelected || isHovered ? 3 : 2
          if (element.points.length > 0) {
            ctx.beginPath()
            ctx.moveTo(element.points[0].x, element.points[0].y)
            for (let i = 1; i < element.points.length; i++) {
              ctx.lineTo(element.points[i].x, element.points[i].y)
            }
            if (element.points.length > 2) {
              ctx.closePath()
              ctx.fill()
            }
            ctx.stroke()

            // Draw room name if available
            if (element.properties?.name) {
              // Calculate center of the room
              let centerX = 0,
                centerY = 0
              element.points.forEach((point) => {
                centerX += point.x
                centerY += point.y
              })
              centerX /= element.points.length
              centerY /= element.points.length

              ctx.fillStyle = "#000"
              ctx.font = "12px Arial"
              ctx.textAlign = "center"
              ctx.textBaseline = "middle"
              ctx.fillText(element.properties.name, centerX, centerY)
            }
          }
          break
        case "DOOR":
          ctx.strokeStyle = isSelected || isHovered ? "#f59e0b" : "#fbbf24" // Amber
          ctx.fillStyle = "rgba(251, 191, 36, 0.3)" // Amber with transparency
          ctx.lineWidth = isSelected || isHovered ? 3 : 2
          if (element.points.length >= 2) {
            const x1 = element.points[0].x
            const y1 = element.points[0].y
            const x2 = element.points[1].x
            const y2 = element.points[1].y

            // Draw the door as a line
            ctx.beginPath()
            ctx.moveTo(x1, y1)
            ctx.lineTo(x2, y2)
            ctx.stroke()

            // Draw a small rectangle in the middle to represent the door
            const midX = (x1 + x2) / 2
            const midY = (y1 + y2) / 2
            const angle = Math.atan2(y2 - y1, x2 - x1)
            const doorWidth = 10
            const doorLength = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))

            ctx.save()
            ctx.translate(midX, midY)
            ctx.rotate(angle)
            ctx.fillRect(-doorLength / 2, -doorWidth / 2, doorLength, doorWidth)
            ctx.restore()

            // Draw connection info if available
            if (element.properties?.roomId && element.properties?.targetRoomId) {
              ctx.fillStyle = "#000"
              ctx.font = "10px Arial"
              ctx.textAlign = "center"
              ctx.textBaseline = "bottom"

              // Find room names
              const sourceRoom = elements.find((el) => el.id === element.properties?.roomId)
              const targetRoom = elements.find((el) => el.id === element.properties?.targetRoomId)
              const sourceName = sourceRoom?.properties?.name || element.properties.roomId
              const targetName = targetRoom?.properties?.name || targetRoom.properties.targetRoomId

              ctx.fillText(`${sourceName} ↔ ${targetName}`, midX, midY - 10)
            }
          }
          break
        case "STREET_LINE":
        case "FREE_LINE":
          ctx.strokeStyle = "#3b82f6"
          ctx.fillStyle = "rgba(59, 130, 246, 0.1)"
          ctx.lineWidth = isSelected || isHovered ? 3 : 2
          if (element.points.length > 0) {
            ctx.beginPath()
            ctx.moveTo(element.points[0].x, element.points[0].y)
            for (let i = 1; i < element.points.length; i++) {
              ctx.lineTo(element.points[i].x, element.points[i].y)
            }
            if (element.points.length > 2) {
              ctx.closePath()
              ctx.fill()
            }
            ctx.stroke()
          }
          break
        case "START_POINT":
          ctx.fillStyle = "#22c55e"
          ctx.strokeStyle = isSelected || isHovered ? "#15803d" : "#22c55e"
          ctx.lineWidth = isSelected || isHovered ? 3 : 2
          if (element.points.length > 0) {
            ctx.beginPath()
            ctx.arc(element.points[0].x, element.points[0].y, 8, 0, Math.PI * 2)
            ctx.fill()
            ctx.stroke()
          }
          break
        case "SOURCE_RECTANGLE":
          ctx.fillStyle = "rgba(34, 197, 94, 0.3)" // More visible green
          ctx.strokeStyle = isSelected || isHovered ? "#15803d" : "#22c55e"
          ctx.lineWidth = isSelected || isHovered ? 3 : 2
          if (element.points.length >= 2) {
            const x1 = element.points[0].x
            const y1 = element.points[0].y
            const x2 = element.points[1].x
            const y2 = element.points[1].y
            ctx.beginPath()
            ctx.rect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1))
            ctx.fill()
            ctx.stroke()

            // Draw agent count if available
            if (element.properties?.agentCount) {
              ctx.fillStyle = "#000"
              ctx.font = "12px Arial"
              ctx.textAlign = "center"
              ctx.textBaseline = "middle"
              ctx.fillText(`${element.properties.agentCount} agents`, (x1 + x2) / 2, (y1 + y2) / 2)
            }
          }
          break
        case "EXIT_POINT":
          ctx.fillStyle = "rgba(239, 68, 68, 0.3)" // Red with transparency
          ctx.strokeStyle = isSelected || isHovered ? "#b91c1c" : "#ef4444"
          ctx.lineWidth = isSelected || isHovered ? 3 : 2
          if (element.points.length >= 2) {
            const x1 = element.points[0].x
            const y1 = element.points[0].y
            const x2 = element.points[1].x
            const y2 = element.points[1].y
            ctx.beginPath()
            ctx.rect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1))
            ctx.fill()
            ctx.stroke()

            // Draw exit label
            ctx.fillStyle = "#000"
            ctx.font = "12px Arial"
            ctx.textAlign = "center"
            ctx.textBaseline = "middle"
            ctx.fillText("EXIT", (x1 + x2) / 2, (y1 + y2) / 2)
          }
          break
        case "OBSTACLE":
          ctx.strokeStyle = isSelected || isHovered ? "#525252" : "#737373"
          ctx.fillStyle = "rgba(163, 163, 163, 0.2)"
          ctx.lineWidth = isSelected || isHovered ? 3 : 2
          if (element.points.length > 0) {
            ctx.beginPath()
            ctx.moveTo(element.points[0].x, element.points[0].y)
            for (let i = 1; i < element.points.length; i++) {
              ctx.lineTo(element.points[i].x, element.points[i].y)
            }
            if (element.points.length > 2) {
              ctx.closePath()
              ctx.fill()
            }
            ctx.stroke()
          }
          break
        case "WAYPOINT":
          // Draw waypoint as a circle with concentric rings
          if (element.points.length > 0) {
            const x = element.points[0].x
            const y = element.points[0].y
            const size = 10 // Base size for the waypoint

            // Draw outer circle (ring)
            ctx.beginPath()
            ctx.arc(x, y, size, 0, Math.PI * 2)
            ctx.strokeStyle = isSelected || isHovered ? "#c2410c" : "#f97316" // Orange
            ctx.lineWidth = isSelected || isHovered ? 3 : 2
            ctx.stroke()

            // Draw inner circle
            ctx.beginPath()
            ctx.arc(x, y, size - 4, 0, Math.PI * 2)
            ctx.fillStyle = isSelected || isHovered ? "#fb923c" : "#f97316" // Orange
            ctx.fill()

            // Draw center dot
            ctx.beginPath()
            ctx.arc(x, y, 2, 0, Math.PI * 2)
            ctx.fillStyle = "#ffffff"
            ctx.fill()

            // Draw waypoint label
            if (isSelected || isHovered) {
              ctx.fillStyle = "#000"
              ctx.font = "10px Arial"
              ctx.textAlign = "center"
              ctx.textBaseline = "bottom"
              ctx.fillText(`WP-${element.id.substring(0, 4)}`, x, y - size - 4)
            }

            // Draw connections
            if (element.properties?.connections) {
              const connections = element.properties.connections
              connections.forEach((targetId) => {
                const targetElement = elements.find((el) => el.id === targetId)
                if (targetElement && targetElement.points.length > 0) {
                  // Draw connection line
                  const sourcePoint = element.points[0]
                  const targetPoint = targetElement.points[0]

                  // Use different styles for different connection types
                  const isSelected = selectedElement?.id === element.id || selectedElement?.id === targetId
                  const isBidirectional = targetElement.properties?.connections?.includes(element.id)

                  // Set line style based on connection type
                  if (isBidirectional) {
                    // Bidirectional connection (both ways)
                    ctx.strokeStyle = isSelected ? "#0ea5e9" : "#38bdf8" // Bright blue
                    ctx.lineWidth = isSelected ? 2.5 : 1.5
                    ctx.setLineDash([])
                  } else {
                    // One-way connection
                    ctx.strokeStyle = isSelected ? "#f97316" : "#fb923c" // Orange
                    ctx.lineWidth = isSelected ? 2.5 : 1.5
                    ctx.setLineDash([5, 3])
                  }

                  // Draw the connection line
                  ctx.beginPath()
                  ctx.moveTo(sourcePoint.x, sourcePoint.y)
                  ctx.lineTo(targetPoint.x, targetPoint.y)
                  ctx.stroke()

                  // Reset dash pattern
                  ctx.setLineDash([])

                  // Draw arrow to indicate direction
                  const angle = Math.atan2(targetPoint.y - sourcePoint.y, targetPoint.x - sourcePoint.x)
                  const arrowSize = 6
                  const arrowX = targetPoint.x - arrowSize * Math.cos(angle)
                  const arrowY = targetPoint.y - arrowSize * Math.sin(angle)

                  ctx.beginPath()
                  ctx.moveTo(arrowX, arrowY)
                  ctx.lineTo(
                    arrowX - arrowSize * Math.cos(angle - Math.PI / 6),
                    arrowY - arrowSize * Math.sin(angle - Math.PI / 6),
                  )
                  ctx.moveTo(arrowX, arrowY)
                  ctx.lineTo(
                    arrowX - arrowSize * Math.cos(angle + Math.PI / 6),
                    arrowY - arrowSize * Math.sin(angle + Math.PI / 6),
                  )
                  ctx.stroke()
                }
              })
            }
          }
          break
      }
    })

    // Draw the ordered waypoint path
    drawOrderedWaypointPath(ctx)

    // Draw temporary points for current drawing
    if (tempPoints.length > 0) {
      // Set different styles based on the selected tool
      if (selectedTool === "SOURCE_RECTANGLE") {
        ctx.strokeStyle = "#22c55e" // Green stroke
        ctx.fillStyle = "rgba(34, 197, 94, 0.3)" // Green fill with transparency
      } else if (selectedTool === "EXIT_POINT") {
        ctx.strokeStyle = "#ef4444" // Red stroke
        ctx.fillStyle = "rgba(239, 68, 68, 0.3)" // Red fill with transparency
      } else if (selectedTool === "ROOM") {
        ctx.strokeStyle = "#a78bfa" // Purple stroke
        ctx.fillStyle = "rgba(167, 139, 250, 0.1)" // Light purple fill
      } else if (selectedTool === "DOOR") {
        ctx.strokeStyle = "#fbbf24" // Amber stroke
        ctx.fillStyle = "rgba(251, 191, 36, 0.3)" // Amber fill
      } else {
        ctx.strokeStyle = "#3b82f6" // Default blue
        ctx.fillStyle = "rgba(59, 130, 246, 0.1)" // Default blue fill
      }

      ctx.lineWidth = 2

      if ((selectedTool === "SOURCE_RECTANGLE" || selectedTool === "EXIT_POINT") && tempPoints.length >= 2) {
        // Draw rectangle preview
        const x1 = tempPoints[0].x
        const y1 = tempPoints[0].y
        const x2 = tempPoints[tempPoints.length - 1].x
        const y2 = tempPoints[tempPoints.length - 1].y

        ctx.beginPath()
        ctx.rect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1))
        ctx.fill()
        ctx.stroke()

        // Draw label preview
        ctx.fillStyle = "#000"
        ctx.font = "12px Arial"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"

        if (selectedTool === "SOURCE_RECTANGLE") {
          ctx.fillText("Agents: 10", (x1 + x2) / 2, (y1 + y2) / 2)
        } else if (selectedTool === "EXIT_POINT") {
          ctx.fillText("EXIT", (x1 + x2) / 2, (y1 + y2) / 2)
        }
      } else if (selectedTool === "DOOR" && tempPoints.length >= 2) {
        // Draw door preview as a line
        const x1 = tempPoints[0].x
        const y1 = tempPoints[0].y
        const x2 = tempPoints[tempPoints.length - 1].x
        const y2 = tempPoints[tempPoints.length - 1].y

        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()

        // Draw a small rectangle in the middle to represent the door
        const midX = (x1 + x2) / 2
        const midY = (y1 + y2) / 2
        const angle = Math.atan2(y2 - y1, x2 - x1)
        const doorWidth = 10
        const doorLength = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))

        ctx.save()
        ctx.translate(midX, midY)
        ctx.rotate(angle)
        ctx.fillRect(-doorLength / 2, -doorWidth / 2, doorLength, doorWidth)
        ctx.restore()
      } else {
        // Draw lines for other tools
        ctx.beginPath()
        ctx.moveTo(tempPoints[0].x, tempPoints[0].y)

        for (let i = 1; i < tempPoints.length; i++) {
          ctx.lineTo(tempPoints[i].x, tempPoints[i].y)
        }

        // For street lines, draw a preview of the straight line to the current mouse position
        if (selectedTool === "STREET_LINE" && tempPoints.length > 0 && isDrawing) {
          const lastPoint = tempPoints[tempPoints.length - 1]
          const mousePos = tempPoints[tempPoints.length - 1] // This would be updated in handleMouseMove
          ctx.lineTo(mousePos.x, mousePos.y)
        }

        // For room, close the shape if we have enough points
        if (selectedTool === "ROOM" && tempPoints.length > 2) {
          ctx.closePath()
          ctx.fill()
        }

        ctx.stroke()
      }
    }

    // Draw connection preview
    if (connectionPreview) {
      ctx.strokeStyle = "#f97316"
      ctx.lineWidth = 2
      ctx.setLineDash([5, 3])

      ctx.beginPath()
      ctx.moveTo(connectionPreview.from.x, connectionPreview.from.y)
      ctx.lineTo(connectionPreview.to.x, connectionPreview.to.y)
      ctx.stroke()

      // Draw arrow
      const angle = Math.atan2(
        connectionPreview.to.y - connectionPreview.from.y,
        connectionPreview.to.x - connectionPreview.from.x,
      )
      const arrowSize = 6
      const arrowX = connectionPreview.to.x - arrowSize * Math.cos(angle)
      const arrowY = connectionPreview.to.y - arrowSize * Math.sin(angle)

      ctx.beginPath()
      ctx.moveTo(arrowX, arrowY)
      ctx.lineTo(arrowX - arrowSize * Math.cos(angle - Math.PI / 6), arrowY - arrowSize * Math.sin(angle - Math.PI / 6))
      ctx.moveTo(arrowX, arrowY)
      ctx.lineTo(arrowX - arrowSize * Math.cos(angle + Math.PI / 6), arrowY - arrowSize * Math.sin(angle + Math.PI / 6))
      ctx.stroke()

      ctx.setLineDash([])
    }

    // Draw door connection preview
    if (doorConnectionMode) {
      const door = elements.find((el) => el.id === doorConnectionMode.doorId)
      const room = elements.find((el) => el.id === doorConnectionMode.roomId)

      if (door && room) {
        // Draw a line from the door to the room center
        ctx.strokeStyle = "#fbbf24" // Amber
        ctx.lineWidth = 2
        ctx.setLineDash([5, 3])

        // Calculate door center
        const doorCenter = {
          x: (door.points[0].x + door.points[1].x) / 2,
          y: (door.points[0].y + door.points[1].y) / 2,
        }

        // Calculate room center
        const roomCenter = { x: 0, y: 0 }
        room.points.forEach((point) => {
          roomCenter.x += point.x
          roomCenter.y += point.y
        })
        roomCenter.x /= room.points.length
        roomCenter.y /= room.points.length

        // Draw the connection
        ctx.beginPath()
        ctx.moveTo(doorCenter.x, doorCenter.y)
        ctx.lineTo(roomCenter.x, roomCenter.y)
        ctx.stroke()

        // If we have a target room, draw that connection too
        if (doorConnectionMode.targetRoomId) {
          const targetRoom = elements.find((el) => el.id === doorConnectionMode.targetRoomId)
          if (targetRoom) {
            // Calculate target room center
            const targetCenter = { x: 0, y: 0 }
            targetRoom.points.forEach((point) => {
              targetCenter.x += point.x
              targetCenter.y += point.y
            })
            targetCenter.x /= targetRoom.points.length
            targetCenter.y /= targetRoom.points.length

            // Draw the connection
            ctx.beginPath()
            ctx.moveTo(doorCenter.x, doorCenter.y)
            ctx.lineTo(targetCenter.x, targetCenter.y)
            ctx.stroke()

            // Draw bidirectional arrow
            ctx.setLineDash([])
            ctx.strokeStyle = "#f59e0b"
            ctx.lineWidth = 1.5

            // Draw text showing the connection
            ctx.fillStyle = "#000"
            ctx.font = "12px Arial"
            ctx.textAlign = "center"
            ctx.textBaseline = "middle"
            const roomName = room.properties?.name || room.id.substring(0, 4)
            const targetName = targetRoom.properties?.name || targetRoom.id.substring(0, 4)
            ctx.fillText(`${roomName} ↔ ${targetName}`, doorCenter.x, doorCenter.y - 15)
          }
        }

        ctx.setLineDash([])
      }
    }

    // Draw agents
    agents.forEach((agent) => {
      // Choose color based on agent state
      let fillColor = "#3b82f6" // Default blue

      if (agent.state === "waiting") {
        fillColor = "#fbbf24" // Amber for waiting
      } else if (agent.state === "exiting") {
        fillColor = "#22c55e" // Green for exiting
      } else if (agent.state === "arrived") {
        fillColor = "#ef4444" // Red for arrived
      }

      ctx.fillStyle = fillColor
      ctx.beginPath()
      ctx.arc(agent.position.x, agent.position.y, agent.radius, 0, Math.PI * 2)
      ctx.fill()

      // Draw agent ID for debugging
      if (isSimulationRunning) {
        ctx.fillStyle = "#000"
        ctx.font = "8px Arial"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(agent.id.substring(0, 3), agent.position.x, agent.position.y)
      }
    })

    // Draw simulation time
    if (isSimulationRunning) {
      ctx.fillStyle = "#000"
      ctx.font = "14px Arial"
      ctx.textAlign = "left"
      ctx.textBaseline = "top"
      ctx.fillText(`Time: ${simulationTime.toFixed(1)}s`, 10, 10)

      // Draw agent count
      ctx.fillText(`Agents: ${agents.length}`, 10, 30)
    }

    // Draw current points if drawing an obstacle
    if (currentPoints.length > 0 && (selectedTool === "OBSTACLE" || selectedTool === "wall")) {
      ctx.beginPath()
      ctx.moveTo(currentPoints[0].x, currentPoints[0].y)

      for (let i = 1; i < currentPoints.length; i++) {
        ctx.lineTo(currentPoints[i].x, currentPoints[i].y)
      }

      // Connect to mouse position if dragging
      if (isDragging && currentPoints.length > 0) {
        ctx.lineTo(dragStartPos.x, dragStartPos.y)
      }

      ctx.strokeStyle = "#666"
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw points
      for (const point of currentPoints) {
        ctx.beginPath()
        ctx.arc(point.x, point.y, 4, 0, Math.PI * 2)
        ctx.fillStyle = "#666"
        ctx.fill()
      }
    }
  }, [
    elements,
    selectedElement,
    hoveredElement,
    tempPoints,
    agents,
    showGrid,
    gridSize,
    snapToGrid,
    selectedTool,
    isDrawing,
    connectionMode,
    connectionPreview,
    orderedWaypoints,
    doorConnectionMode,
    isSimulationRunning,
    simulationTime,
    isDragging,
    dragStartPos,
    currentPoints,
  ])

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    let point = { x, y }

    // Snap to grid if enabled
    if (snapToGrid) {
      point = snapPointToGrid(point)
    }

    // If in connection mode, check if clicked on another waypoint
    if (connectionMode) {
      const clickedElement = findElementAtPoint(point)

      if (clickedElement && clickedElement.type === "WAYPOINT" && clickedElement.id !== connectionMode) {
        // Create connection between waypoints
        const sourceWaypoint = elements.find((el) => el.id === connectionMode)
        if (sourceWaypoint) {
          const connections = sourceWaypoint.properties?.connections || []

          // Check if connection already exists
          if (!connections.includes(clickedElement.id)) {
            updateElement(connectionMode, {
              properties: {
                ...sourceWaypoint.properties,
                connections: [...connections, clickedElement.id],
              },
            })
            setAlertMessage(
              `Connection created from WP-${connectionMode.substring(0, 4)} to WP-${clickedElement.id.substring(0, 4)}`,
            )
          } else {
            setAlertMessage("Connection already exists")
          }
        }
      } else if (!clickedElement || clickedElement.type !== "WAYPOINT") {
        setAlertMessage("Connection mode canceled. Click on a waypoint to create a connection.")
      }

      // Exit connection mode
      setConnectionMode(null)
      setConnectionPreview(null)
      return
    }

    // If in door connection mode, check if clicked on a room
    if (doorConnectionMode) {
      const clickedElement = findElementAtPoint(point)

      if (clickedElement && clickedElement.type === "ROOM") {
        // If we already have a source room, this is the target room
        if (doorConnectionMode.roomId && !doorConnectionMode.targetRoomId) {
          // Don't allow connecting to the same room
          if (clickedElement.id === doorConnectionMode.roomId) {
            setAlertMessage("Cannot connect a door to the same room")
          } else {
            // Update door connection mode with target room
            setDoorConnectionMode({
              ...doorConnectionMode,
              targetRoomId: clickedElement.id,
            })

            // Update the door with the connection
            const { doorId, roomId } = doorConnectionMode
            updateElement(doorId, {
              properties: {
                roomId,
                targetRoomId: clickedElement.id,
              },
            })

            setAlertMessage("Door connection created")

            // Exit door connection mode
            setDoorConnectionMode(null)
          }
        } else {
          // This is the source room
          setDoorConnectionMode({
            ...doorConnectionMode,
            roomId: clickedElement.id,
          })
          setAlertMessage("Now select the target room for this door")
        }
      } else if (!clickedElement || clickedElement.type !== "ROOM") {
        setAlertMessage("Door connection mode canceled. Click on a room to connect.")
        setDoorConnectionMode(null)
      }

      return
    }

    // If in select mode, try to select an element
    if (selectedTool === "SELECT") {
      const clickedElement = findElementAtPoint(point)
      selectElement(clickedElement)

      // Handle double click on waypoint
      if (clickedElement && clickedElement.type === "WAYPOINT" && e.detail === 2) {
        handleWaypointDoubleClick(clickedElement.id, clickedElement.points[0])
      }

      // Handle double click on door
      if (clickedElement && clickedElement.type === "DOOR" && e.detail === 2) {
        handleDoorDoubleClick(clickedElement.id)
      }

      return
    }

    // If in delete mode, try to delete an element
    if (selectedTool === "DELETE") {
      const clickedElement = findElementAtPoint(point)
      if (clickedElement) {
        selectElement(null)
      }
      return
    }

    // Check if we can draw at this point
    if (selectedTool && selectedTool !== "STREET_LINE" && selectedTool !== "FREE_LINE") {
      if (!validateDrawing(point, selectedTool)) {
        setAlertMessage("Cannot draw outside walkable areas. Please place elements within the defined walkable space.")
        return
      }
    }

    // Start drawing
    if (selectedTool) {
      setIsDrawing(true)
      setTempPoints([point])

      // For point-based elements, create them immediately
      if (selectedTool === "START_POINT" || selectedTool === "WAYPOINT") {
        const newElement = addElement({
          type: selectedTool,
          points: [point],
        })
        selectElement(newElement)
        setIsDrawing(false)
        setTempPoints([])
      }
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    let point = { x, y }

    // Snap to grid if enabled
    if (snapToGrid) {
      point = snapPointToGrid(point)
    }

    // Update hovered element
    if (selectedTool === "SELECT" || selectedTool === "DELETE") {
      const element = findElementAtPoint(point)
      setHoveredElement(element?.id || null)
    }

    // Update connection preview if in connection mode
    if (connectionMode) {
      const sourceElement = elements.find((el) => el.id === connectionMode)
      if (sourceElement && sourceElement.points.length > 0) {
        setConnectionPreview({
          from: sourceElement.points[0],
          to: point,
        })
      }
    }

    // If drawing, update temporary points
    if (isDrawing && selectedTool) {
      if (selectedTool === "FREE_LINE" || selectedTool === "OBSTACLE" || selectedTool === "ROOM") {
        // For free drawing, add points continuously
        setTempPoints((prev) => [...prev, point])
      } else if (selectedTool === "STREET_LINE") {
        // For street lines, only update the last point for straight lines
        if (tempPoints.length > 0) {
          setTempPoints([tempPoints[0], point])
        }
      } else if (selectedTool === "SOURCE_RECTANGLE" || selectedTool === "EXIT_POINT") {
        // For rectangle-based elements, update the second point
        setTempPoints([tempPoints[0], point])
      } else if (selectedTool === "DOOR") {
        // For doors, update the second point
        setTempPoints([tempPoints[0], point])
      }
    }
  }

  const handleMouseUp = () => {
    if (isDrawing && selectedTool && tempPoints.length > 0) {
      // Finish drawing
      if (selectedTool === "FREE_LINE" || selectedTool === "OBSTACLE") {
        // For free-form elements, create them with all points
        if (tempPoints.length > 1) {
          const newElement = addElement({
            type: selectedTool,
            points: tempPoints,
          })
          selectElement(newElement)
        }
      } else if (selectedTool === "STREET_LINE") {
        // For street lines, create straight lines between points
        if (tempPoints.length >= 2) {
          const newElement = addElement({
            type: selectedTool,
            points: [tempPoints[0], tempPoints[tempPoints.length - 1]],
          })
          selectElement(newElement)
        }
      } else if (selectedTool === "SOURCE_RECTANGLE" || selectedTool === "EXIT_POINT") {
        // For rectangle-based elements, create them with start and end points
        if (tempPoints.length >= 2) {
          const startPoint = tempPoints[0]
          const endPoint = tempPoints[tempPoints.length - 1]

          // For SOURCE_RECTANGLE, check if it's within walkable areas
          if (selectedTool === "SOURCE_RECTANGLE") {
            // Check all four corners of the rectangle
            const corners = [
              startPoint,
              { x: endPoint.x, y: startPoint.y },
              endPoint,
              { x: startPoint.x, y: endPoint.y },
            ]

            // If any corner is outside walkable area, show alert
            const allCornersValid = corners.every((corner) => validateDrawing(corner, selectedTool))

            if (!allCornersValid) {
              setAlertMessage("Source rectangle must be completely within walkable areas.")
              setIsDrawing(false)
              setTempPoints([])
              return
            }
          }

          const newElement = addElement({
            type: selectedTool,
            points: [startPoint, endPoint],
            properties: selectedTool === "SOURCE_RECTANGLE" ? { agentCount: 10 } : {},
          })
          selectElement(newElement)
        }
      } else if (selectedTool === "ROOM") {
        // For rooms, create a closed polygon
        if (tempPoints.length > 2) {
          // Close the polygon by connecting back to the first point if needed
          const points = [...tempPoints]
          if (points[0].x !== points[points.length - 1].x || points[0].y !== points[points.length - 1].y) {
            points.push(points[0])
          }

          const newElement = addElement({
            type: selectedTool,
            points,
            properties: {
              name: `Room ${elements.filter((el) => el.type === "ROOM").length + 1}`,
              capacity: 50, // Default capacity
            },
          })
          selectElement(newElement)
        }
      } else if (selectedTool === "DOOR") {
        // For doors, create a line
        if (tempPoints.length >= 2) {
          const newElement = addElement({
            type: selectedTool,
            points: [tempPoints[0], tempPoints[tempPoints.length - 1]],
          })
          selectElement(newElement)

          // Prompt to connect the door to rooms
          setDoorConnectionMode({
            doorId: newElement.id,
            roomId: "",
            targetRoomId: null,
          })
          setAlertMessage("Select the first room this door connects to")
        }
      }

      setIsDrawing(false)
      setTempPoints([])
    }
  }

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // For STREET_LINE, double-click to finish the polygon
    if (isDrawing && selectedTool === "STREET_LINE" && tempPoints.length > 2) {
      // Close the polygon by connecting back to the first point
      const closedPoints = [...tempPoints, tempPoints[0]]
      const newElement = addElement({
        type: selectedTool,
        points: closedPoints,
      })
      selectElement(newElement)
      setIsDrawing(false)
      setTempPoints([])
    }

    // For ROOM, double-click to finish the polygon
    if (isDrawing && selectedTool === "ROOM" && tempPoints.length > 2) {
      // Close the polygon by connecting back to the first point
      const closedPoints = [...tempPoints, tempPoints[0]]
      const newElement = addElement({
        type: selectedTool,
        points: closedPoints,
        properties: {
          name: `Room ${elements.filter((el) => el.type === "ROOM").length + 1}`,
          capacity: 50, // Default capacity
        },
      })
      selectElement(newElement)
      setIsDrawing(false)
      setTempPoints([])
    }
  }

  const findElementAtPoint = (point: Point) => {
    // Check in reverse order to select the top-most element
    for (let i = elements.length - 1; i >= 0; i--) {
      const element = elements[i]
      switch (element.type) {
        case "START_POINT":
          if (element.points.length > 0) {
            const distance = Math.sqrt(
              Math.pow(element.points[0].x - point.x, 2) + Math.pow(element.points[0].y - point.y, 2),
            )
            if (distance <= 8) {
              return element
            }
          }
          break
        case "WAYPOINT":
          if (element.points.length > 0) {
            const distance = Math.sqrt(
              Math.pow(element.points[0].x - point.x, 2) + Math.pow(element.points[0].y - point.y, 2),
            )
            if (distance <= 10) {
              // Increased hit area for circular waypoints
              return element
            }
          }
          break
        case "SOURCE_RECTANGLE":
        case "EXIT_POINT":
          if (element.points.length >= 2) {
            const x1 = Math.min(element.points[0].x, element.points[1].x)
            const y1 = Math.min(element.points[0].y, element.points[1].y)
            const x2 = Math.max(element.points[0].x, element.points[1].x)
            const y2 = Math.max(element.points[0].y, element.points[1].y)
            if (point.x >= x1 && point.x <= x2 && point.y >= y1 && point.y <= y2) {
              return element
            }
          }
          break
        case "ROOM":
          if (element.points.length > 2) {
            if (isPointInPolygon(point, element.points)) {
              return element
            }
          }
          break
        case "DOOR":
          if (element.points.length >= 2) {
            const distance = distanceToLine(point, element.points[0], element.points[1])
            if (distance <= 10) {
              // Increased hit area for doors
              return element
            }
          }
          break
        case "STREET_LINE":
        case "FREE_LINE":
        case "OBSTACLE":
          if (element.points.length > 1) {
            for (let j = 0; j < element.points.length - 1; j++) {
              const x1 = element.points[j].x
              const y1 = element.points[j].y
              const x2 = element.points[j + 1].x
              const y2 = element.points[j + 1].y
              const distance = distanceToLine(point, { x: x1, y: y1 }, { x: x2, y: y2 })
              if (distance <= 5) {
                return element
              }
            }
            // For closed shapes, check the last segment
            if (
              (element.type === "STREET_LINE" || element.type === "FREE_LINE" || element.type === "OBSTACLE") &&
              element.points.length > 2
            ) {
              const x1 = element.points[element.points.length - 1].x
              const y1 = element.points[element.points.length - 1].y
              const x2 = element.points[0].x
              const y2 = element.points[0].y
              const distance = distanceToLine(point, { x: x1, y: y1 }, { x: x2, y: y2 })
              if (distance <= 5) {
                return element
              }
            }
          }
          break
      }
    }
    return null
  }

  // Check if a point is inside a polygon
  const isPointInPolygon = (point: Point, polygon: Point[]): boolean => {
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

  const distanceToLine = (point: Point, lineStart: Point, lineEnd: Point) => {
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

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleStepBack = () => {
    setCurrentFrame((prev) => Math.max(0, prev - 1))
  }

  const handleStepForward = () => {
    setCurrentFrame((prev) => Math.min(simulationFrames.length - 1, prev + 1))
  }

  const handleReset = () => {
    setCurrentFrame(0)
    setIsPlaying(false)
  }

  const toggleGrid = () => {
    setShowGrid(!showGrid)
  }

  const toggleSnapToGrid = () => {
    setSnapToGrid(!snapToGrid)
  }

  return (
    <TooltipProvider>
      <div className="relative" ref={containerRef}>
        <div className="absolute top-2 right-2 z-10 flex space-x-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showGrid ? "default" : "outline"}
                size="icon"
                onClick={toggleGrid}
                className="bg-white/80 backdrop-blur-sm"
              >
                <Grid className="h-4 w-4" />
                <span className="sr-only">Toggle Grid</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{showGrid ? "Hide Grid" : "Show Grid"}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={snapToGrid ? "default" : "outline"}
                size="icon"
                onClick={toggleSnapToGrid}
                className="bg-white/80 backdrop-blur-sm"
              >
                <span className="text-xs font-bold">Snap</span>
                <span className="sr-only">Toggle Snap to Grid</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{snapToGrid ? "Disable Snap to Grid" : "Enable Snap to Grid"}</TooltipContent>
          </Tooltip>
        </div>

        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border rounded-lg bg-white dark:bg-gray-900"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDoubleClick={handleDoubleClick}
        />

        {connectionMode && (
          <div className="absolute top-2 left-2 bg-orange-100 border border-orange-300 text-orange-800 px-3 py-1 rounded-md shadow-md">
            <span className="font-medium">Connection Mode:</span> Click on another waypoint to create a connection
          </div>
        )}

        {doorConnectionMode && (
          <div className="absolute top-2 left-2 bg-amber-100 border border-amber-300 text-amber-800 px-3 py-1 rounded-md shadow-md">
            <span className="font-medium">Door Connection Mode:</span>{" "}
            {doorConnectionMode.roomId
              ? "Now select the target room for this door"
              : "Select the first room this door connects to"}
          </div>
        )}

        {isSimulationRunning && simulationFrames.length > 0 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-2 bg-white dark:bg-gray-800 p-2 rounded-lg shadow">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleReset}>
                  <SkipBack className="h-4 w-4" />
                  <span className="sr-only">Reset</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reset</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleStepBack}>
                  <SkipBack className="h-4 w-4" />
                  <span className="sr-only">Step Back</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Step Back</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handlePlayPause}>
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  <span className="sr-only">{isPlaying ? "Pause" : "Play"}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isPlaying ? "Pause" : "Play"}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleStepForward}>
                  <SkipForward className="h-4 w-4" />
                  <span className="sr-only">Step Forward</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Step Forward</TooltipContent>
            </Tooltip>

            <div className="text-sm ml-2">
              Frame {currentFrame + 1} / {simulationFrames.length}
            </div>
          </div>
        )}

        <div className="absolute bottom-2 left-2 text-xs text-gray-500">
          {selectedTool === "STREET_LINE" && (
            <div className="bg-white/80 p-1 rounded shadow backdrop-blur-sm">
              Click to start a line, click again for each point, double-click to close the shape
            </div>
          )}
          {selectedTool === "ROOM" && (
            <div className="bg-white/80 p-1 rounded shadow backdrop-blur-sm">
              Click to start a room, click for each corner, double-click to close the shape
            </div>
          )}
          {selectedTool === "DOOR" && (
            <div className="bg-white/80 p-1 rounded shadow backdrop-blur-sm">
              Click and drag to create a door, then select the rooms it connects
            </div>
          )}
          {selectedTool === "SOURCE_RECTANGLE" && (
            <div className="bg-white/80 p-1 rounded shadow backdrop-blur-sm">
              Click and drag to create an agent source area
            </div>
          )}
          {selectedTool === "EXIT_POINT" && (
            <div className="bg-white/80 p-1 rounded shadow backdrop-blur-sm">Click and drag to create an exit area</div>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
