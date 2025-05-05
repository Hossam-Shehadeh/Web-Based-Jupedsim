"use client"

import type React from "react"

import { useRef, useEffect, useState } from "react"
import { useSimulation } from "./SimulationContext"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Play, Pause, SkipBack, SkipForward } from "lucide-react"

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
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
  } = useSimulation()
  const [tempPoints, setTempPoints] = useState<{ x: number; y: number }[]>([])
  const [hoveredElement, setHoveredElement] = useState<string | null>(null)
  const animationRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(0)

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

  // Draw the canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw grid
    ctx.strokeStyle = "#e5e7eb"
    ctx.lineWidth = 0.5
    const gridSize = 20
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }

    // Draw elements
    elements.forEach((element) => {
      const isSelected = selectedElement?.id === element.id
      const isHovered = hoveredElement === element.id

      switch (element.type) {
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
          ctx.fillStyle = "rgba(34, 197, 94, 0.2)"
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
          ctx.strokeStyle = isSelected || isHovered ? "#b91c1c" : "#ef4444"
          ctx.lineWidth = isSelected || isHovered ? 3 : 2
          if (element.points.length >= 2) {
            const x1 = element.points[0].x
            const y1 = element.points[0].y
            const x2 = element.points[1].x
            const y2 = element.points[1].y
            ctx.beginPath()
            ctx.moveTo(x1, y1)
            ctx.lineTo(x2, y2)
            ctx.stroke()

            // Draw arrow
            const angle = Math.atan2(y2 - y1, x2 - x1)
            const arrowSize = 10
            ctx.beginPath()
            ctx.moveTo(x2, y2)
            ctx.lineTo(x2 - arrowSize * Math.cos(angle - Math.PI / 6), y2 - arrowSize * Math.sin(angle - Math.PI / 6))
            ctx.moveTo(x2, y2)
            ctx.lineTo(x2 - arrowSize * Math.cos(angle + Math.PI / 6), y2 - arrowSize * Math.sin(angle + Math.PI / 6))
            ctx.stroke()
          }
          break
        case "OBSTACLE":
          ctx.strokeStyle = isSelected || isHovered ? "#525252" : "#737373"
          ctx.fillStyle = "#a3a3a3"
          ctx.lineWidth = isSelected || isHovered ? 3 : 2
          if (element.points.length > 0) {
            ctx.beginPath()
            ctx.moveTo(element.points[0].x, element.points[0].y)
            for (let i = 1; i < element.points.length; i++) {
              ctx.lineTo(element.points[i].x, element.points[i].y)
            }
            ctx.stroke()
          }
          break
        case "WAYPOINT":
          ctx.fillStyle = "#f97316"
          ctx.strokeStyle = isSelected || isHovered ? "#c2410c" : "#f97316"
          ctx.lineWidth = isSelected || isHovered ? 3 : 2
          if (element.points.length > 0) {
            ctx.beginPath()
            ctx.arc(element.points[0].x, element.points[0].y, 6, 0, Math.PI * 2)
            ctx.fill()
            ctx.stroke()

            // Draw connections
            if (element.properties?.connections) {
              ctx.strokeStyle = "#f97316"
              ctx.lineWidth = 1
              ctx.setLineDash([5, 3])
              const sourcePoint = element.points[0]
              element.properties.connections.forEach((targetId) => {
                const targetElement = elements.find((el) => el.id === targetId)
                if (targetElement && targetElement.points.length > 0) {
                  const targetPoint = targetElement.points[0]
                  ctx.beginPath()
                  ctx.moveTo(sourcePoint.x, sourcePoint.y)
                  ctx.lineTo(targetPoint.x, targetPoint.y)
                  ctx.stroke()
                }
              })
              ctx.setLineDash([])
            }
          }
          break
      }
    })

    // Draw temporary points for current drawing
    if (tempPoints.length > 0) {
      ctx.strokeStyle = "#3b82f6"
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(tempPoints[0].x, tempPoints[0].y)
      for (let i = 1; i < tempPoints.length; i++) {
        ctx.lineTo(tempPoints[i].x, tempPoints[i].y)
      }
      ctx.stroke()
    }

    // Draw agents
    agents.forEach((agent) => {
      ctx.fillStyle = "#3b82f6"
      ctx.beginPath()
      ctx.arc(agent.position.x, agent.position.y, agent.radius, 0, Math.PI * 2)
      ctx.fill()

      // Draw velocity vector if available
      if (agent.velocity) {
        ctx.strokeStyle = "#ef4444"
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(agent.position.x, agent.position.y)
        ctx.lineTo(agent.position.x + agent.velocity.x * 5, agent.position.y + agent.velocity.y * 5)
        ctx.stroke()
      }
    })
  }, [elements, selectedElement, hoveredElement, tempPoints, agents])

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const point = { x, y }

    // If in select mode, try to select an element
    if (selectedTool === "SELECT") {
      const clickedElement = findElementAtPoint(point)
      selectElement(clickedElement)
      return
    }

    // If in delete mode, try to delete an element
    if (selectedTool === "DELETE") {
      const clickedElement = findElementAtPoint(point)
      if (clickedElement) {
        const elementToDelete = elements.find((el) => el.id === clickedElement.id)
        if (elementToDelete) {
          selectElement(null)
          // Remove the element
          const updatedElements = elements.filter((el) => el.id !== elementToDelete.id)
          // Update the simulation context
          // This is a simplified approach; you might need to adjust based on your actual implementation
          // setElements(updatedElements)
        }
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
    const point = { x, y }

    // Update hovered element
    if (selectedTool === "SELECT" || selectedTool === "DELETE") {
      const element = findElementAtPoint(point)
      setHoveredElement(element?.id || null)
    }

    // If drawing, update temporary points
    if (isDrawing && selectedTool) {
      if (selectedTool === "STREET_LINE" || selectedTool === "FREE_LINE" || selectedTool === "OBSTACLE") {
        setTempPoints((prev) => [...prev, point])
      } else if (selectedTool === "SOURCE_RECTANGLE" || selectedTool === "EXIT_POINT") {
        setTempPoints([tempPoints[0], point])
      }
    }
  }

  const handleMouseUp = () => {
    if (isDrawing && selectedTool && tempPoints.length > 0) {
      // Finish drawing
      if (selectedTool === "STREET_LINE" || selectedTool === "FREE_LINE" || selectedTool === "OBSTACLE") {
        // For line-based elements, create them with all points
        const newElement = addElement({
          type: selectedTool,
          points: tempPoints,
        })
        selectElement(newElement)
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
      }

      setIsDrawing(false)
      setTempPoints([])
    }
  }

  const findElementAtPoint = (point: { x: number; y: number }) => {
    // Check in reverse order to select the top-most element
    for (let i = elements.length - 1; i >= 0; i--) {
      const element = elements[i]
      switch (element.type) {
        case "START_POINT":
        case "WAYPOINT":
          if (element.points.length > 0) {
            const distance = Math.sqrt(
              Math.pow(element.points[0].x - point.x, 2) + Math.pow(element.points[0].y - point.y, 2),
            )
            if (distance <= 8) {
              return element
            }
          }
          break
        case "SOURCE_RECTANGLE":
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
        case "EXIT_POINT":
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
            if ((element.type === "STREET_LINE" || element.type === "FREE_LINE") && element.points.length > 2) {
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

  const distanceToLine = (
    point: { x: number; y: number },
    lineStart: { x: number; y: number },
    lineEnd: { x: number; y: number },
  ) => {
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

  return (
    <TooltipProvider>
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border rounded-lg bg-white dark:bg-gray-900"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
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
      </div>
    </TooltipProvider>
  )
}
