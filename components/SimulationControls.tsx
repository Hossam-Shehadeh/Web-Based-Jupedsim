"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { useSimulation } from "./SimulationContext"
import { Play, Pause, RotateCcw, Trash2, Settings } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export const SimulationControls: React.FC = () => {
  const {
    isSimulationRunning,
    startSimulation,
    stopSimulation,
    deleteSimulation,
    runSimulation,
    simulationModels,
    selectedModel,
    setSelectedModel,
    simulationSpeed,
    setSimulationSpeed,
    isPlaying,
    setIsPlaying,
    currentFrame,
    simulationFrames,
    setCurrentFrame,
    simulationTime,
    setSimulationTime,
    selectedElement,
    updateElement,
    orderedWaypoints,
    clearOrderedWaypoints,
    showAlert,
  } = useSimulation()

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [agentCount, setAgentCount] = useState("10")

  const [useOrderedPath, setUseOrderedPath] = useState(false)
  const [orderedAgentCount, setOrderedAgentCount] = useState(5)
  const [orderedAgentSpacing, setOrderedAgentSpacing] = useState(2)

  // Handle simulation start/stop
  const handlePlayPause = async () => {
    if (!isSimulationRunning) {
      await runSimulation()
    } else {
      setIsPlaying(!isPlaying)
    }
  }

  // Handle simulation reset
  const handleReset = () => {
    stopSimulation()
  }

  // Handle simulation delete
  const handleDelete = () => {
    deleteSimulation()
  }

  // Handle model change
  const handleModelChange = (value: string) => {
    const model = simulationModels.find((m) => m.id === value)
    if (model) {
      setSelectedModel(model)
    }
  }

  // Handle speed change
  const handleSpeedChange = (value: number[]) => {
    setSimulationSpeed(value[0])
  }

  // Handle agent count change for source rectangles
  const handleAgentCountChange = () => {
    if (selectedElement && selectedElement.type === "SOURCE_RECTANGLE") {
      updateElement(selectedElement.id, {
        properties: {
          ...selectedElement.properties,
          agentCount: Number.parseInt(agentCount) || 10,
        },
      })
      setIsSettingsOpen(false)
    }
  }

  // Handle simulation time change
  const handleTimeChange = (value: string) => {
    const time = Number.parseInt(value)
    if (!isNaN(time) && time > 0) {
      setSimulationTime(time)
    }
  }

  // Update agent count when selected element changes
  React.useEffect(() => {
    if (selectedElement && selectedElement.type === "SOURCE_RECTANGLE") {
      setAgentCount(String(selectedElement.properties?.agentCount || 10))
    }
  }, [selectedElement])

  // Add a function to run the ordered waypoint simulation
  const runOrderedWaypointSimulation = () => {
    if (orderedWaypoints.length < 2) {
      showAlert("Please define at least 2 ordered waypoints by double-clicking on waypoints", "warning")
      return
    }

    runSimulation({
      useOrderedPath: true,
      agentCount: orderedAgentCount,
      agentSpacing: orderedAgentSpacing,
    })
  }

  return (
    <div className="flex flex-col gap-4 p-4 border border-gray-200 rounded-lg bg-white">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Simulation Controls</h3>
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Simulation Settings</DialogTitle>
              <DialogDescription>Configure simulation parameters</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {selectedElement && selectedElement.type === "SOURCE_RECTANGLE" && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="agentCount" className="text-right">
                    Agent Count
                  </Label>
                  <Input
                    id="agentCount"
                    value={agentCount}
                    onChange={(e) => setAgentCount(e.target.value)}
                    className="col-span-3"
                  />
                </div>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="simTime" className="text-right">
                  Simulation Time (s)
                </Label>
                <Input
                  id="simTime"
                  value={simulationTime}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleAgentCountChange}>Save Changes</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Simulation Model</label>
          <Select value={selectedModel?.id || ""} onValueChange={handleModelChange} disabled={isSimulationRunning}>
            <SelectTrigger>
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              {simulationModels.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  {model.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between">
            <label className="text-sm font-medium">Simulation Speed</label>
            <span className="text-sm text-gray-500">{simulationSpeed.toFixed(1)}x</span>
          </div>
          <Slider value={[simulationSpeed]} min={0} max={2} step={0.1} onValueChange={handleSpeedChange} />
        </div>

        {isSimulationRunning && simulationFrames.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium">Progress</label>
              <span className="text-sm text-gray-500">
                {currentFrame} / {simulationFrames.length - 1}
              </span>
            </div>
            <Slider
              value={[currentFrame]}
              min={0}
              max={simulationFrames.length - 1}
              step={1}
              onValueChange={(value) => setCurrentFrame(value[0])}
            />
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={handlePlayPause} className="flex-1">
            {!isSimulationRunning ? (
              <>
                <Play className="mr-2 h-4 w-4" /> Run
              </>
            ) : !isPlaying ? (
              <>
                <Play className="mr-2 h-4 w-4" /> Resume
              </>
            ) : (
              <>
                <Pause className="mr-2 h-4 w-4" /> Pause
              </>
            )}
          </Button>
          <Button onClick={handleReset} variant="outline" disabled={!isSimulationRunning}>
            <RotateCcw className="mr-2 h-4 w-4" /> Reset
          </Button>
          <Button onClick={handleDelete} variant="destructive">
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        </div>
      </div>
    </div>
  \
  ;<div className="mt-4 p-4 border rounded-md">
    <h3 className="text-lg font-medium mb-2">Ordered Waypoint Simulation</h3>

    <div className="flex items-center mb-2">
      <Switch id="use-ordered-path" checked={useOrderedPath} onCheckedChange={setUseOrderedPath} />
      <Label htmlFor="use-ordered-path" className="ml-2">
        Use Ordered Waypoint Path
      </Label>
    </div>

    {useOrderedPath && (
      <>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <Label htmlFor="agent-count">Agent Count</Label>
            <Input
              id="agent-count"
              type="number"
              min="1"
              max="50"
              value={orderedAgentCount}
              onChange={(e) => setOrderedAgentCount(Number.parseInt(e.target.value) || 5)}
            />
          </div>
          <div>
            <Label htmlFor="agent-spacing">Agent Spacing (sec)</Label>
            <Input
              id="agent-spacing"
              type="number"
              min="0.5"
              max="10"
              step="0.5"
              value={orderedAgentSpacing}
              onChange={(e) => setOrderedAgentSpacing(Number.parseFloat(e.target.value) || 2)}
            />
          </div>
        </div>

        <div className="mb-2">
          <p className="text-sm text-muted-foreground">Ordered waypoints: {orderedWaypoints.length}</p>
          <p className="text-xs text-muted-foreground">Double-click on waypoints to add them to the ordered path</p>
        </div>

        <div className="flex space-x-2">
          <Button onClick={runOrderedWaypointSimulation} disabled={isSimulationRunning || orderedWaypoints.length < 2}>
            Run Ordered Path Simulation
          </Button>
          <Button variant="outline" onClick={clearOrderedWaypoints} disabled={orderedWaypoints.length === 0}>
            Clear Ordered Waypoints
          </Button>
        </div>
      </>
    )}
  </div>
  )
}
