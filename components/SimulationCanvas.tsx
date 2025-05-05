"use client"

import type React from "react"
import { useRef, useState, useEffect, useCallback } from "react"
import { useSimulation } from "./SimulationContext"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { ZoomIn, ZoomOut, Move, Play, Pause } from "lucide-react"
import { ElementProperties } from "./ElementProperties"
import { useSimulationLogic } from "../hooks/useSimulationLogic"
import { drawCanvas } from "../utils/canvasDrawing"
import { handleMouseInteractions } from "../utils/mouseInteractions"
import type { Element } from "../types/simulationTypes"

const GRID_SIZE = 50

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
