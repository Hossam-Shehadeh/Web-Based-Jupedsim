"use client"

import type React from "react"

import { useRef, useState, useEffect, useCallback } from "react"
import { useSimulation } from "@/hooks/useSimulation"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, Home, Play, Pause, SkipBack } from "lucide-react"
import { ElementProperties } from "./ElementProperties"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Point, Element } from "@/types"
import { isInsideWalkableArea, isRectangleInWalkableArea, distanceToLineSegment } from "@/lib/geometry"
import { motion, AnimatePresence } from "framer-motion"

const GRID_SIZE = 50

export default function SimulationCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)

  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [showProperties, setShowProperties] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  const [startPan, setStartPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [currentPoints, setCurrentPoints] = useState<Point[]>([])
  const [connectingWaypoint, setConnectingWaypoint] = useState<string | null>(null)
  const [showControls, setShowControls] = useState(false)

  // Add state for dragging elements
  const [isDragging, setIsDragging] = useState(false)
  const [draggedElement, setDraggedElement] = useState<Element | null>(null)
  const [dragStartPos, setDragStartPos] = useState<Point>({ x: 0, y: 0 })
  const [elementStartPos, setElementStartPos] = useState<Point[]>([])

  const {
    elements,
    selectedTool,
    selectedElement,
    selectElement,
    isSimulationRunning,
    simulationSpeed,
    addElement,
    deleteElement,
    updateElement,
    connectWaypoints,
    setIsDrawing,
    isDrawing,
    agents,
    setAgents,
    runSimulation,
    isPlaying,
    setIsPlaying,
    simulationTime,
    stopSimulation,
    currentFrame,
    setCurrentFrame,
    simulationFrames,
    isLoading,
    setError,
  } = useSimulation()

  // Show controls when simulation is running
  useEffect(() => {
    if (isSimulationRunning) {
      setShowControls(true)
    } else {
      // Hide controls with a delay when simulation stops
      const timer = setTimeout(() => {
        setShowControls(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isSimulationRunning])

  // Convert screen coordinates to canvas coordinates
  const screenToCanvas = useCallback(
    (x: number, y: number) => {
      if (!canvasRef.current || !containerRef.current) return { x: 0, y: 0 }

      const rect = containerRef.current.getBoundingClientRect()
      return {
        x: (x - rect.left - offset.x) / scale,
        y: (y - rect.top - offset.y) / scale,
      }
    },
    [offset, scale],
  )

  // Handle mouse down event
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!canvasRef.current) return

      const point = screenToCanvas(e.clientX, e.clientY)

      // If the middle mouse button is pressed or no tool is selected, start panning
      if (e.button === 1 || (e.button === 0 && selectedTool === null)) {
        setIsPanning(true)
        setStartPan({ x: e.clientX - offset.x, y: e.clientY - offset.y })
        return
      }

      // If connecting waypoints
      if (connectingWaypoint) {
        const targetWaypoint = elements.find(
          (el) =>
            el.type === "WAYPOINT" &&
            Math.sqrt(Math.pow(el.points[0].x - point.x, 2) + Math.pow(el.points[0].y - point.y, 2)) < 15 / scale,
        )

        if (targetWaypoint && targetWaypoint.id !== connectingWaypoint) {
          connectWaypoints(connectingWaypoint, targetWaypoint.id)
        }

        setConnectingWaypoint(null)
        return
      }

      // If move tool is selected
      if (selectedTool === "MOVE") {
        const clickedElement = findElementAtPoint(point)
        if (clickedElement) {
          setIsDragging(true)
          setDraggedElement(clickedElement)
          setDragStartPos(point)

          // Store the original positions of all points in the element
          setElementStartPos([...clickedElement.points])

          // Also select the element to show it's being moved
          selectElement(clickedElement)
          return
        }
      }

      // If delete tool is selected
      if (selectedTool === "DELETE") {
        const clickedElement = findElementAtPoint(point)
        if (clickedElement) {
          deleteElement(clickedElement.id)
          selectElement(null)
        }
        return
      }

      // If select tool is selected
      if (selectedTool === "SELECT") {
        const clickedElement = findElementAtPoint(point)
        selectElement(clickedElement)
        setShowProperties(!!clickedElement)
        return
      }

      // Start drawing if a drawing tool is selected
      if (selectedTool && selectedTool !== "SELECT" && selectedTool !== "DELETE" && selectedTool !== "MOVE") {
        setIsDrawing(true)
        setCurrentPoints([point])

        // For point-based elements, create them immediately
        if (selectedTool === "START_POINT" || selectedTool === "WAYPOINT") {
          // Only add if inside walkable area
          if (isInsideWalkableArea(point, elements)) {
            addElement({
              type: selectedTool,
              points: [point],
              properties: {},
            })
            setIsDrawing(false)
          } else {
            // Show error or visual feedback
            setError("Cannot place elements outside walkable areas")
            setIsDrawing(false)
          }
        }
      }
    },
    [
      selectedTool,
      offset,
      scale,
      screenToCanvas,
      elements,
      connectingWaypoint,
      setIsDrawing,
      addElement,
      deleteElement,
      selectElement,
      connectWaypoints,
      setError,
    ],
  )

  // Handle mouse move event
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!canvasRef.current) return

      const point = screenToCanvas(e.clientX, e.clientY)

      // Handle panning
      if (isPanning) {
        setOffset({
          x: e.clientX - startPan.x,
          y: e.clientY - startPan.y,
        })
        return
      }

      // Handle dragging elements
      if (isDragging && draggedElement) {
        // Calculate the movement delta
        const dx = point.x - dragStartPos.x
        const dy = point.y - dragStartPos.y

        // Create new points based on the original positions plus the delta
        const newPoints = elementStartPos.map((p) => ({
          x: p.x + dx,
          y: p.y + dy,
        }))

        // For elements that need to stay within walkable areas, validate the new position
        let isValidMove = true

        if (draggedElement.type === "START_POINT" || draggedElement.type === "WAYPOINT") {
          // For point elements, check if the new position is inside walkable areas
          isValidMove = isInsideWalkableArea(newPoints[0], elements)
        } else if (draggedElement.type === "SOURCE_RECTANGLE") {
          // For rectangles, check if all corners are inside walkable areas
          isValidMove = isRectangleInWalkableArea(newPoints[0], newPoints[1], elements)
        }

        // Only update if the move is valid
        if (isValidMove) {
          // Update the element with the new points
          updateElement(draggedElement.id, { points: newPoints })
        }

        return
      }

      // Handle drawing
      if (isDrawing && selectedTool) {
        setCurrentPoints((prev) => {
          if (selectedTool === "STREET_LINE" || selectedTool === "FREE_LINE" || selectedTool === "OBSTACLE") {
            return [...prev, point]
          } else if (selectedTool === "SOURCE_RECTANGLE" || selectedTool === "EXIT_POINT") {
            if (prev.length === 1) {
              return [prev[0], point]
            } else if (prev.length > 1) {
              return [prev[0], point]
            }
          }
          return prev
        })
      }
    },
    [
      isPanning,
      startPan,
      isDrawing,
      selectedTool,
      screenToCanvas,
      setIsDrawing,
      isDragging,
      draggedElement,
      dragStartPos,
      elementStartPos,
      updateElement,
      elements,
    ],
  )

  // Handle mouse up event
  const handleMouseUp = useCallback(() => {
    // Stop panning
    if (isPanning) {
      setIsPanning(false)
      return
    }

    // Stop dragging
    if (isDragging) {
      setIsDragging(false)
      setDraggedElement(null)
      return
    }

    // Finish drawing
    if (isDrawing && selectedTool && currentPoints.length > 0) {
      if (selectedTool === "STREET_LINE" || selectedTool === "FREE_LINE" || selectedTool === "OBSTACLE") {
        if (currentPoints.length > 1) {
          // For lines, we don't need to check if they're in walkable area
          addElement({
            type: selectedTool,
            points: currentPoints,
          })
        }
      } else if (selectedTool === "SOURCE_RECTANGLE" || selectedTool === "EXIT_POINT") {
        if (currentPoints.length === 2) {
          // Check if rectangle is within walkable area
          if (
            selectedTool === "EXIT_POINT" ||
            isRectangleInWalkableArea(currentPoints[0], currentPoints[1], elements)
          ) {
            addElement({
              type: selectedTool,
              points: currentPoints,
              properties: selectedTool === "SOURCE_RECTANGLE" ? { agentCount: 10 } : {},
            })
          } else {
            setError("Cannot place elements outside walkable areas")
          }
        }
      }

      setIsDrawing(false)
      setCurrentPoints([])
    }
  }, [isPanning, isDrawing, selectedTool, currentPoints, addElement, setIsDrawing, elements, setError, isDragging])

  // Find element at a specific point
  const findElementAtPoint = useCallback(
    (point: Point) => {
      // Check waypoints first (they're easier to click)
      const waypoint = elements.find(
        (el) =>
          el.type === "WAYPOINT" &&
          Math.sqrt(Math.pow(el.points[0].x - point.x, 2) + Math.pow(el.points[0].y - point.y, 2)) < 15 / scale,
      )

      if (waypoint) return waypoint

      // Check start points
      const startPoint = elements.find(
        (el) =>
          el.type === "START_POINT" &&
          Math.sqrt(Math.pow(el.points[0].x - point.x, 2) + Math.pow(el.points[0].y - point.y, 2)) < 10 / scale,
      )

      if (startPoint) return startPoint

      // Check rectangles
      const rectangle = elements.find(
        (el) =>
          (el.type === "SOURCE_RECTANGLE" || el.type === "EXIT_POINT") &&
          el.points.length === 2 &&
          point.x >= Math.min(el.points[0].x, el.points[1].x) &&
          point.x <= Math.max(el.points[0].x, el.points[1].x) &&
          point.y >= Math.min(el.points[0].y, el.points[1].y) &&
          point.y <= Math.max(el.points[0].y, el.points[1].y),
      )

      if (rectangle) return rectangle

      // Check lines
      return elements.find((el) => {
        if ((el.type === "STREET_LINE" || el.type === "FREE_LINE" || el.type === "OBSTACLE") && el.points.length > 1) {
          for (let i = 0; i < el.points.length - 1; i++) {
            const p1 = el.points[i]
            const p2 = el.points[i + 1]

            // Calculate distance from point to line segment
            const distance = distanceToLineSegment(point, p1, p2)
            if (distance < 5 / scale) {
              return true
            }
          }
        }
        return false
      })
    },
    [elements, scale],
  )

  // Handle double click on waypoint to start connecting
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!canvasRef.current || selectedTool !== "SELECT") return

      const point = screenToCanvas(e.clientX, e.clientY)
      const waypoint = elements.find(
        (el) =>
          el.type === "WAYPOINT" &&
          Math.sqrt(Math.pow(el.points[0].x - point.x, 2) + Math.pow(el.points[0].y - point.y, 2)) < 15 / scale,
      )

      if (waypoint) {
        setConnectingWaypoint(waypoint.id)
      }
    },
    [elements, scale, screenToCanvas, selectedTool],
  )

  // Draw the canvas
  const drawCanvas = useCallback(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Set canvas dimensions
    canvas.width = containerRef.current?.clientWidth || window.innerWidth
    canvas.height = containerRef.current?.clientHeight || window.innerHeight

    // Apply transformations
    ctx.save()
    ctx.translate(offset.x, offset.y)
    ctx.scale(scale, scale)

    // Draw checkerboard background
    drawCheckerboardBackground(ctx, canvas.width / scale, canvas.height / scale)

    // Draw grid
    drawGrid(ctx, canvas.width / scale, canvas.height / scale)

    // Draw elements
    elements.forEach((element) => {
      drawElement(ctx, element, isDragging && draggedElement?.id === element.id, selectedElement?.id === element.id)
    })

    // Draw current drawing
    if (isDrawing && currentPoints.length > 0) {
      drawCurrentDrawing(ctx)
    }

    // Draw connecting line when connecting waypoints
    if (connectingWaypoint) {
      drawConnectingLine(ctx)
    }

    // Draw agents
    if (isSimulationRunning && agents.length > 0) {
      drawAgents(ctx)
    }

    // Draw simulation info
    if (isSimulationRunning) {
      drawSimulationInfo(ctx)
    }

    ctx.restore()
  }, [
    offset,
    scale,
    elements,
    isDrawing,
    currentPoints,
    connectingWaypoint,
    isSimulationRunning,
    agents,
    selectedElement,
    isDragging,
    draggedElement,
  ])

  // Draw checkerboard background
  const drawCheckerboardBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
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

  // Draw grid
  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.beginPath()
    ctx.strokeStyle = "#e5e7eb"
    ctx.lineWidth = 0.5 / scale

    for (let x = 0; x < width; x += GRID_SIZE) {
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
    }

    for (let y = 0; y < height; y += GRID_SIZE) {
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
    }

    ctx.stroke()
  }

  // Draw element
  const drawElement = (ctx: CanvasRenderingContext2D, element: Element, isBeingDragged = false, isSelected = false) => {
    ctx.beginPath()

    // Apply a visual effect for elements being dragged
    if (isBeingDragged) {
      ctx.globalAlpha = 0.7 // Make it slightly transparent
    }

    switch (element.type) {
      case "STREET_LINE":
        ctx.strokeStyle = "#3b82f6"
        ctx.lineWidth = 2 / scale
        if (element.points.length > 0) {
          ctx.moveTo(element.points[0].x, element.points[0].y)
          for (let i = 1; i < element.points.length; i++) {
            // Snap to grid
            const snapX = Math.round(element.points[i].x / GRID_SIZE) * GRID_SIZE
            const snapY = Math.round(element.points[i].y / GRID_SIZE) * GRID_SIZE
            ctx.lineTo(snapX, snapY)
          }
        }
        ctx.stroke()
        break

      case "FREE_LINE":
        ctx.strokeStyle = "#3b82f6"
        ctx.lineWidth = 2 / scale
        if (element.points.length > 0) {
          ctx.moveTo(element.points[0].x, element.points[0].y)
          for (let i = 1; i < element.points.length; i++) {
            ctx.lineTo(element.points[i].x, element.points[i].y)
          }
        }
        ctx.stroke()
        break

      case "OBSTACLE":
        ctx.strokeStyle = "#000000"
        ctx.lineWidth = 3 / scale
        if (element.points.length > 0) {
          ctx.moveTo(element.points[0].x, element.points[0].y)
          for (let i = 1; i < element.points.length; i++) {
            ctx.lineTo(element.points[i].x, element.points[i].y)
          }
        }
        ctx.stroke()
        break

      case "START_POINT":
        ctx.fillStyle = "#22c55e"
        ctx.beginPath()
        ctx.arc(element.points[0].x, element.points[0].y, 8 / scale, 0, Math.PI * 2)
        ctx.fill()
        break

      case "SOURCE_RECTANGLE":
        if (element.points.length === 2) {
          ctx.fillStyle = "rgba(34, 197, 94, 0.3)"
          ctx.fillRect(
            element.points[0].x,
            element.points[0].y,
            element.points[1].x - element.points[0].x,
            element.points[1].y - element.points[0].y,
          )
          ctx.strokeStyle = "#22c55e"
          ctx.lineWidth = 2 / scale
          ctx.strokeRect(
            element.points[0].x,
            element.points[0].y,
            element.points[1].x - element.points[0].x,
            element.points[1].y - element.points[0].y,
          )

          // Draw agent count
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
        break

      case "EXIT_POINT":
        if (element.points.length === 2) {
          ctx.fillStyle = "rgba(239, 68, 68, 0.3)"
          ctx.fillRect(
            element.points[0].x,
            element.points[0].y,
            element.points[1].x - element.points[0].x,
            element.points[1].y - element.points[0].y,
          )
          ctx.strokeStyle = "#ef4444"
          ctx.lineWidth = 2 / scale
          ctx.strokeRect(
            element.points[0].x,
            element.points[0].y,
            element.points[1].x - element.points[0].x,
            element.points[1].y - element.points[0].y,
          )

          // Draw exit label
          ctx.fillStyle = "#000000"
          ctx.font = `${14 / scale}px sans-serif`
          ctx.fillText("Exit", element.points[0].x + 5 / scale, element.points[0].y + 20 / scale)
        }
        break

      case "WAYPOINT":
        // Draw waypoint circle
        ctx.fillStyle = "#3b82f6"
        ctx.beginPath()
        ctx.arc(element.points[0].x, element.points[0].y, 10 / scale, 0, Math.PI * 2)
        ctx.fill()

        // Draw inner circle to make it look like a cycle icon
        ctx.fillStyle = "#ffffff"
        ctx.beginPath()
        ctx.arc(element.points[0].x, element.points[0].y, 5 / scale, 0, Math.PI * 2)
        ctx.fill()

        // Draw connections
        if (element.properties?.connections) {
          element.properties.connections.forEach((targetId) => {
            const target = elements.find((el) => el.id === targetId)
            if (target && target.type === "WAYPOINT") {
              ctx.beginPath()
              ctx.strokeStyle = "#3b82f6"
              ctx.lineWidth = 2 / scale
              ctx.setLineDash([5 / scale, 5 / scale])
              ctx.moveTo(element.points[0].x, element.points[0].y)
              ctx.lineTo(target.points[0].x, target.points[0].y)
              ctx.stroke()
              ctx.setLineDash([])

              // Draw arrow at the end
              const dx = target.points[0].x - element.points[0].x
              const dy = target.points[0].y - element.points[0].y
              const angle = Math.atan2(dy, dx)

              ctx.beginPath()
              ctx.fillStyle = "#3b82f6"
              ctx.moveTo(
                target.points[0].x - (15 / scale) * Math.cos(angle) + (8 / scale) * Math.cos(angle - Math.PI / 2),
                target.points[0].y - (15 / scale) * Math.sin(angle) + (8 / scale) * Math.sin(angle - Math.PI / 2),
              )
              ctx.lineTo(
                target.points[0].x - (15 / scale) * Math.cos(angle) + (8 / scale) * Math.cos(angle + Math.PI / 2),
                target.points[0].y - (15 / scale) * Math.sin(angle) + (8 / scale) * Math.sin(angle + Math.PI / 2),
              )
              ctx.lineTo(target.points[0].x, target.points[0].y)
              ctx.closePath()
              ctx.fill()
            }
          })
        }
        break
    }

    // Reset opacity after drawing the element
    ctx.globalAlpha = 1.0

    // Highlight selected element
    if (isSelected) {
      ctx.strokeStyle = "#f97316"
      ctx.lineWidth = 2 / scale

      if (element.type === "START_POINT" || element.type === "WAYPOINT") {
        ctx.beginPath()
        ctx.arc(
          element.points[0].x,
          element.points[0].y,
          element.type === "START_POINT" ? 12 / scale : 14 / scale,
          0,
          Math.PI * 2,
        )
        ctx.stroke()
      } else if (element.type === "SOURCE_RECTANGLE" || element.type === "EXIT_POINT") {
        if (element.points.length === 2) {
          ctx.strokeStyle = "#f97316"
          ctx.lineWidth = 3 / scale
          ctx.strokeRect(
            element.points[0].x - 2 / scale,
            element.points[0].y - 2 / scale,
            element.points[1].x - element.points[0].x + 4 / scale,
            element.points[1].y - element.points[0].y + 4 / scale,
          )
        }
      } else {
        ctx.strokeStyle = "#f97316"
        ctx.lineWidth = 4 / scale
        if (element.points.length > 0) {
          ctx.beginPath()
          ctx.moveTo(element.points[0].x, element.points[0].y)
          for (let i = 1; i < element.points.length; i++) {
            ctx.lineTo(element.points[i].x, element.points[i].y)
          }
          ctx.stroke()
        }
      }
    }
  }

  // Draw current drawing
  const drawCurrentDrawing = (ctx: CanvasRenderingContext2D) => {
    ctx.beginPath()

    switch (selectedTool) {
      case "STREET_LINE":
        ctx.strokeStyle = "#3b82f6"
        ctx.lineWidth = 2 / scale
        ctx.moveTo(currentPoints[0].x, currentPoints[0].y)
        for (let i = 1; i < currentPoints.length; i++) {
          // Snap to grid
          const snapX = Math.round(currentPoints[i].x / GRID_SIZE) * GRID_SIZE
          const snapY = Math.round(currentPoints[i].y / GRID_SIZE) * GRID_SIZE
          ctx.lineTo(snapX, snapY)
        }
        ctx.stroke()
        break

      case "FREE_LINE":
      case "OBSTACLE":
        ctx.strokeStyle = selectedTool === "FREE_LINE" ? "#3b82f6" : "#000000"
        ctx.lineWidth = selectedTool === "FREE_LINE" ? 2 / scale : 3 / scale
        ctx.moveTo(currentPoints[0].x, currentPoints[0].y)
        for (let i = 1; i < currentPoints.length; i++) {
          ctx.lineTo(currentPoints[i].x, currentPoints[i].y)
        }
        ctx.stroke()
        break

      case "SOURCE_RECTANGLE":
      case "EXIT_POINT":
        if (currentPoints.length === 2) {
          const color = selectedTool === "SOURCE_RECTANGLE" ? "#22c55e" : "#ef4444"
          ctx.fillStyle = `${color}33`
          ctx.fillRect(
            currentPoints[0].x,
            currentPoints[0].y,
            currentPoints[1].x - currentPoints[0].x,
            currentPoints[1].y - currentPoints[0].y,
          )
          ctx.strokeStyle = color
          ctx.lineWidth = 2 / scale
          ctx.strokeRect(
            currentPoints[0].x,
            currentPoints[0].y,
            currentPoints[1].x - currentPoints[0].x,
            currentPoints[1].y - currentPoints[0].y,
          )
        }
        break
    }
  }

  // Draw connecting line when connecting waypoints
  const drawConnectingLine = (ctx: CanvasRenderingContext2D) => {
    const sourceElement = elements.find((el) => el.id === connectingWaypoint)
    if (sourceElement) {
      const mousePos = screenToCanvas(
        containerRef.current?.getBoundingClientRect().left || 0 + containerRef.current?.clientWidth || 0 / 2,
        containerRef.current?.getBoundingClientRect().top || 0 + containerRef.current?.clientHeight || 0 / 2,
      )

      ctx.beginPath()
      ctx.strokeStyle = "#3b82f6"
      ctx.lineWidth = 2 / scale
      ctx.setLineDash([5 / scale, 5 / scale])
      ctx.moveTo(sourceElement.points[0].x, sourceElement.points[0].y)
      ctx.lineTo(mousePos.x, mousePos.y)
      ctx.stroke()
      ctx.setLineDash([])
    }
  }

  // Draw agents
  const drawAgents = (ctx: CanvasRenderingContext2D) => {
    agents.forEach((agent) => {
      // Draw agent as a simple circle
      ctx.fillStyle = "rgba(255, 0, 0, 0.7)"
      ctx.beginPath()
      ctx.arc(agent.position.x, agent.position.y, agent.radius, 0, Math.PI * 2)
      ctx.fill()

      // Add a subtle outline
      ctx.strokeStyle = "#cc0000"
      ctx.lineWidth = 1 / scale
      ctx.stroke()
    })
  }

  // Draw simulation info
  const drawSimulationInfo = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
    ctx.font = `${16 / scale}px sans-serif`
    ctx.fillText(`Speed: ${simulationSpeed.toFixed(1)} m/s`, 10 / scale, 30 / scale)
    ctx.fillText(`Agents: ${agents.length}`, 10 / scale, 50 / scale)
    ctx.fillText(`Time: ${simulationTime.toFixed(1)}s`, 10 / scale, 70 / scale)

    if (simulationFrames.length > 0) {
      const currentTime = simulationFrames[currentFrame]?.time || 0
      ctx.fillText(`Frame: ${currentFrame + 1}/${simulationFrames.length}`, 10 / scale, 90 / scale)
      ctx.fillText(`Simulation Time: ${currentTime.toFixed(2)}s`, 10 / scale, 110 / scale)
    }
  }

  // Animation loop
  const animate = useCallback(
    (time: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = time
      }

      lastTimeRef.current = time
      drawCanvas()
      animationRef.current = requestAnimationFrame(animate)
    },
    [drawCanvas],
  )

  // Set up animation loop
  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationRef.current)
    }
  }, [animate])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && containerRef.current) {
        canvasRef.current.width = containerRef.current.clientWidth
        canvasRef.current.height = containerRef.current.clientHeight
        drawCanvas()
      }
    }

    window.addEventListener("resize", handleResize)
    handleResize() // Call once to set initial size

    return () => window.removeEventListener("resize", handleResize)
  }, [drawCanvas])

  // Handle zoom with mouse wheel
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault()

      const delta = e.deltaY > 0 ? 0.9 : 1.1
      const newScale = Math.min(Math.max(scale * delta, 0.1), 10)

      // Zoom centered on mouse position
      const mousePos = screenToCanvas(e.clientX, e.clientY)
      const newOffset = {
        x: e.clientX - mousePos.x * newScale,
        y: e.clientY - mousePos.y * newScale,
      }

      setScale(newScale)
      setOffset(newOffset)
    },
    [scale, screenToCanvas],
  )

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    setIsPlaying(!isPlaying)
  }, [isPlaying, setIsPlaying])

  // Reset simulation
  const resetSimulation = useCallback(() => {
    setCurrentFrame(0)
    if (simulationFrames.length > 0) {
      setAgents(simulationFrames[0].agents)
    }
  }, [setCurrentFrame, simulationFrames, setAgents])

  // Reset view to center
  const resetView = useCallback(() => {
    setScale(1)
    setOffset({ x: 0, y: 0 })
  }, [])

  return (
    <div className="relative flex h-full flex-col">
      {/* Zoom controls */}
      <div className="absolute left-4 top-4 z-10 flex flex-col gap-2 bg-white/80 dark:bg-gray-800/80 p-2 rounded-lg shadow-md backdrop-blur-sm">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={() => setScale(Math.min(scale * 1.2, 10))}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Zoom In</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={() => setScale(Math.max(scale * 0.8, 0.1))}>
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Zoom Out</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={resetView}>
                <Home className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Reset View</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Simulation controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-4 right-4 z-10 bg-white dark:bg-gray-800 p-4 rounded-md shadow-lg"
          >
            <div className="flex flex-col gap-4">
              <Button
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                onClick={runSimulation}
                disabled={isLoading}
              >
                {isSimulationRunning ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" />
                    Stop Simulation
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Run Simulation
                  </>
                )}
              </Button>

              {isSimulationRunning && simulationFrames.length > 0 && (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={togglePlay}>
                    {isPlaying ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                    {isPlaying ? "Pause" : "Play"}
                  </Button>
                  <Button variant="outline" onClick={resetSimulation}>
                    <SkipBack className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                </div>
              )}

              {isSimulationRunning && (
                <>
                  <div className="text-sm">
                    <div>Time: {simulationTime.toFixed(1)}s</div>
                    <div>Agents: {agents.length}</div>
                    {simulationFrames.length > 0 && (
                      <div>
                        Frame: {currentFrame + 1}/{simulationFrames.length}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
      >
        <canvas ref={canvasRef} className="absolute inset-0" />
        {showProperties && selectedElement && (
          <ElementProperties element={selectedElement} onClose={() => setShowProperties(false)} />
        )}
      </div>
    </div>
  )
}
