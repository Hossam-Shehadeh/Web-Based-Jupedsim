"use client"

import type React from "react"
import { useRef, useState, useEffect, useCallback } from "react"
import { useSimulation } from "./SimulationContext"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { ZoomIn, ZoomOut, Move, Play, Pause } from "lucide-react"
import { ElementProperties } from "./ElementProperties"
import { useSimulationLogic } from "../hooks/useSimulationLogic"
import type { Element } from "../types/simulationTypes"
import type { Agent, Point } from "../types/simulationTypes"
import { handleMouseInteractions } from "../utils/canvasUtils"

const GRID_SIZE = 50

// Fix the drawCanvas function to properly handle the grid background
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

  // Draw grid first (so it's behind everything)
  drawGrid(ctx, canvas, scale, offset)

  // Draw elements
  elements.forEach((element) => drawElement(ctx, element, scale))

  // Draw agents
  drawAgents(ctx, agents, scale, simulationSpeed)

  // Display simulation info
  if (isSimulationRunning) {
    drawSimulationInfo(ctx, scale, simulationSpeed, agents.length, simulationTime)
  }

  ctx.restore()
}

function drawGrid(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, scale: number, offset: Point) {
  const gridSize = 50
  const gridOffsetX = offset.x % (gridSize * scale)
  const gridOffsetY = offset.y % (gridSize * scale)

  ctx.beginPath()
  ctx.strokeStyle = "#e5e7eb"
  ctx.lineWidth = 0.5 / scale

  // Draw vertical grid lines
  for (let x = gridOffsetX / scale; x < canvas.width / scale; x += gridSize) {
    ctx.moveTo(x, 0)
    ctx.lineTo(x, canvas.height / scale)
  }

  // Draw horizontal grid lines
  for (let y = gridOffsetY / scale; y < canvas.height / scale; y += gridSize) {
    ctx.moveTo(0, y)
    ctx.lineTo(canvas.width / scale, y)
  }

  ctx.stroke()
}

// Fix the drawAgents function to handle simulation speed
function drawAgents(ctx: CanvasRenderingContext2D, agents: Agent[], scale: number, simulationSpeed: number) {
  agents.forEach((agent) => {
    // Draw agent body
    ctx.fillStyle = "rgba(255, 0, 0, 0.7)"
    ctx.beginPath()
    ctx.arc(agent.position.x, agent.position.y, agent.radius, 0, Math.PI * 2)
    ctx.fill()

    // Add a white border to make agents more visible
    ctx.strokeStyle = "#ffffff"
    ctx.lineWidth = 0.5 / scale
    ctx.stroke()

    // Remove the velocity indicator code
    // if (agent.velocity && simulationSpeed > 0 && (agent.velocity.x !== 0 || agent.velocity.y !== 0)) {
    //   const speed = Math.sqrt(agent.velocity.x * agent.velocity.x + agent.velocity.y * agent.velocity.y)
    //   if (speed > 0) {
    //     const dirX = agent.velocity.x / speed
    //     const dirY = agent.velocity.y / speed
    //
    //     ctx.strokeStyle = "#ffffff"
    //     ctx.lineWidth = 1.5 / scale
    //     ctx.beginPath()
    //     ctx.moveTo(agent.position.x, agent.position.y)
    //     ctx.lineTo(agent.position.x + dirX * agent.radius * 1.5, agent.position.y + dirY * agent.radius * 1.5)
    //     ctx.stroke()
    //   }
    // }
  })
}

function drawElement(ctx: CanvasRenderingContext2D, element: Element, scale: number) {
  ctx.fillStyle = element.color
  ctx.fillRect(element.x, element.y, element.width, element.height)
}

function drawSimulationInfo(
  ctx: CanvasRenderingContext2D,
  scale: number,
  simulationSpeed: number,
  agentCount: number,
  simulationTime: number,
) {
  ctx.fillStyle = "black"
  ctx.font = `${14 / scale}px sans-serif`
  ctx.fillText(`Speed: ${simulationSpeed.toFixed(1)}x`, 10, 20)
  ctx.fillText(`Agents: ${agentCount}`, 10, 40)
  ctx.fillText(`Time: ${simulationTime.toFixed(1)}s`, 10, 60)
}

export default function SimulationCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [showProperties, setShowProperties] = useState(false)
  const [selectedElement, setSelectedElement] = useState<Element | null>(null)

  const { elements, selectedTool, isSimulationRunning, simulationSpeed } = useSimulation()

  const { agents, isPlaying, simulationTime, togglePlay, runSimulation, setSimulationTime } = useSimulationLogic()

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      handleMouseInteractions(e, "down", {
        canvasRef,
        containerRef,
        scale,
        offset,
        setOffset,
        elements,
        selectedTool,
        setSelectedElement,
        setShowProperties,
      })
    },
    [scale, offset, elements, selectedTool],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      handleMouseInteractions(e, "move", {
        canvasRef,
        containerRef,
        scale,
        offset,
      })
    },
    [scale, offset],
  )

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      handleMouseInteractions(e, "up", {
        canvasRef,
        containerRef,
        scale,
        offset,
      })
    },
    [scale, offset],
  )

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      const newScale = Math.min(Math.max(scale * delta, 0.1), 10)
      setScale(newScale)
    },
    [scale],
  )

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const resizeObserver = new ResizeObserver(() => {
      canvas.width = container.clientWidth
      canvas.height = container.clientHeight
      drawCanvas(canvas, {
        elements,
        agents,
        scale,
        offset,
        isSimulationRunning,
        simulationSpeed,
        simulationTime,
      })
    })

    resizeObserver.observe(container)

    return () => resizeObserver.disconnect()
  }, [elements, agents, scale, offset, isSimulationRunning, simulationSpeed, simulationTime])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let animationFrameId: number

    const render = () => {
      drawCanvas(canvas, {
        elements,
        agents,
        scale,
        offset,
        isSimulationRunning,
        simulationSpeed,
        simulationTime,
      })
      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => cancelAnimationFrame(animationFrameId)
  }, [elements, agents, scale, offset, isSimulationRunning, simulationSpeed, simulationTime])

  return (
    <div className="relative flex h-full flex-col">
      <div className="absolute left-4 top-4 z-10 flex flex-col gap-2 rounded-md border bg-white/80 dark:bg-gray-800/80 p-2 shadow-md backdrop-blur-sm">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setScale(Math.min(scale * 1.2, 10))}
          className="bg-white dark:bg-gray-700"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Slider
          value={[scale]}
          min={0.1}
          max={5}
          step={0.1}
          orientation="vertical"
          className="h-24"
          onValueChange={(value) => setScale(value[0])}
        />
        <Button
          variant="outline"
          size="icon"
          onClick={() => setScale(Math.max(scale * 0.8, 0.1))}
          className="bg-white dark:bg-gray-700"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            setScale(1)
            setOffset({ x: 0, y: 0 })
          }}
          className="bg-white dark:bg-gray-700"
        >
          <Move className="h-4 w-4" />
        </Button>
      </div>

      {showProperties && selectedElement && (
        <ElementProperties element={selectedElement} onClose={() => setShowProperties(false)} />
      )}

      <div
        ref={containerRef}
        className="relative h-full w-full overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-blue-900"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      >
        <canvas ref={canvasRef} className="absolute inset-0 touch-none" />

        {isSimulationRunning && agents.length > 0 && (
          <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 p-2 rounded-md shadow-md">
            <Button onClick={togglePlay}>
              {isPlaying ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
              {isPlaying ? "Pause" : "Play"}
            </Button>
            <Button onClick={runSimulation} className="ml-2">
              {isSimulationRunning ? "Stop" : "Start"} Simulation
            </Button>
            <div className="mt-2">Time: {simulationTime.toFixed(1)}s</div>
          </div>
        )}
      </div>
    </div>
  )
}
