"use client"

import { useState } from "react"
import {
  Pencil,
  Square,
  Circle,
  ArrowRight,
  Trash2,
  MousePointer,
  LayoutGrid,
  X,
  CornerDownRight,
  Repeat,
  Trash,
  Move,
} from "lucide-react"
import { useSimulation, type GeometryType } from "./SimulationContext"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export default function Sidebar() {
  const {
    selectedTool,
    setSelectedTool,
    simulationModels,
    selectedModel,
    setSelectedModel,
    geometryType,
    setGeometryType,
    simulationSpeed,
    setSimulationSpeed,
    deleteSimulation,
    isSimulationRunning,
    stopSimulation,
  } = useSimulation()

  const [isExpanded, setIsExpanded] = useState(true)

  const handleSpeedChange = (value: number[]) => {
    setSimulationSpeed(value[0])
  }

  const handleDeleteSimulation = () => {
    // First stop the simulation if it's running
    if (isSimulationRunning) {
      stopSimulation()
    }
    // Then delete all elements
    deleteSimulation()
  }

  // Custom button style for selected tools
  const toolButtonStyle = (isActive: boolean) =>
    cn(
      "transition-all duration-200",
      isActive
        ? "bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
        : "bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700",
    )

  return (
    <div
      className={`relative flex h-full flex-col border-r bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm transition-all duration-300 ${isExpanded ? "w-64" : "w-16"}`}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute -right-3 top-3 z-10 h-6 w-6 rounded-full border bg-white dark:bg-gray-700 shadow-md"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <X className="h-3 w-3" /> : <CornerDownRight className="h-3 w-3" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{isExpanded ? "Collapse sidebar" : "Expand sidebar"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Main content area - make scrollable */}
      <div className="flex flex-col p-4 gap-4 overflow-y-auto custom-scrollbar">
        <TooltipProvider delayDuration={300}>
          <div className="space-y-4">
            <div className={`flex items-center ${isExpanded ? "justify-between" : "justify-center"}`}>
              {isExpanded && <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tools</Label>}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSelectedTool("SELECT")}
                    className={`h-10 w-10 ${toolButtonStyle(selectedTool === "SELECT")}`}
                  >
                    <MousePointer className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Select Tool</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSelectedTool("MOVE")}
                    className={`h-10 w-10 ${toolButtonStyle(selectedTool === "MOVE")}`}
                  >
                    <Move className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Move Tool</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSelectedTool("DELETE")}
                    className={`h-10 w-10 ${toolButtonStyle(selectedTool === "DELETE")}`}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Delete Tool</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </TooltipProvider>

        <Separator />

        {isExpanded ? (
          <>
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Geometry</Label>
              <RadioGroup
                value={geometryType}
                onValueChange={(value) => setGeometryType(value as GeometryType)}
                className="flex gap-2"
              >
                <div className="flex items-center space-x-2 rounded-md border p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
                  <RadioGroupItem value="STREET_LINE" id="street-lines" />
                  <Label htmlFor="street-lines" className="cursor-pointer">
                    Street Lines
                  </Label>
                </div>
                <div className="flex items-center space-x-2 rounded-md border p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
                  <RadioGroupItem value="FREE_LINE" id="free-lines" />
                  <Label htmlFor="free-lines" className="cursor-pointer">
                    Free Lines
                  </Label>
                </div>
              </RadioGroup>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTool(geometryType)}
                className={`w-full justify-start ${toolButtonStyle(selectedTool === geometryType)}`}
              >
                {geometryType === "STREET_LINE" ? (
                  <LayoutGrid className="mr-2 h-4 w-4" />
                ) : (
                  <Pencil className="mr-2 h-4 w-4" />
                )}
                Draw Walkable Area
              </Button>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Agents</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTool("START_POINT")}
                  className={`justify-start ${toolButtonStyle(selectedTool === "START_POINT")}`}
                >
                  <Circle className="mr-2 h-4 w-4 text-green-500" />
                  Start Point
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTool("SOURCE_RECTANGLE")}
                  className={`justify-start ${toolButtonStyle(selectedTool === "SOURCE_RECTANGLE")}`}
                >
                  <Square className="mr-2 h-4 w-4 text-green-500" />
                  Source
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Obstacles & Exits</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTool("OBSTACLE")}
                  className={`justify-start ${toolButtonStyle(selectedTool === "OBSTACLE")}`}
                >
                  <Square className="mr-2 h-4 w-4" />
                  Obstacle
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTool("EXIT_POINT")}
                  className={`justify-start ${toolButtonStyle(selectedTool === "EXIT_POINT")}`}
                >
                  <ArrowRight className="mr-2 h-4 w-4 text-red-500" />
                  Exit Point
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Waypoints</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTool("WAYPOINT")}
                className={`w-full justify-start ${toolButtonStyle(selectedTool === "WAYPOINT")}`}
              >
                <Repeat className="mr-2 h-4 w-4" />
                Add Waypoint
              </Button>
              <p className="text-xs text-gray-500 dark:text-gray-400">Double-click waypoints to connect them</p>
            </div>
          </>
        ) : (
          <TooltipProvider delayDuration={300}>
            <div className="flex flex-col gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSelectedTool(geometryType)}
                    className={`h-10 w-10 ${toolButtonStyle(selectedTool === geometryType)}`}
                  >
                    {geometryType === "STREET_LINE" ? (
                      <LayoutGrid className="h-5 w-5" />
                    ) : (
                      <Pencil className="h-5 w-5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Draw Walkable Area ({geometryType === "STREET_LINE" ? "Street Lines" : "Free Lines"})</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSelectedTool("MOVE")}
                    className={`h-10 w-10 ${toolButtonStyle(selectedTool === "MOVE")}`}
                  >
                    <Move className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Move Tool</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSelectedTool("START_POINT")}
                    className={`h-10 w-10 ${toolButtonStyle(selectedTool === "START_POINT")}`}
                  >
                    <Circle className="h-5 w-5 text-green-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Start Point</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSelectedTool("SOURCE_RECTANGLE")}
                    className={`h-10 w-10 ${toolButtonStyle(selectedTool === "SOURCE_RECTANGLE")}`}
                  >
                    <Square className="h-5 w-5 text-green-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Source Rectangle</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSelectedTool("OBSTACLE")}
                    className={`h-10 w-10 ${toolButtonStyle(selectedTool === "OBSTACLE")}`}
                  >
                    <Square className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Obstacle</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSelectedTool("EXIT_POINT")}
                    className={`h-10 w-10 ${toolButtonStyle(selectedTool === "EXIT_POINT")}`}
                  >
                    <ArrowRight className="h-5 w-5 text-red-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Exit Point</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSelectedTool("WAYPOINT")}
                    className={`h-10 w-10 ${toolButtonStyle(selectedTool === "WAYPOINT")}`}
                  >
                    <Repeat className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Waypoint</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        )}

        <Separator />

        {isExpanded ? (
          <>
            <div className="space-y-3">
              <Label htmlFor="model-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Simulation Model
              </Label>
              <Select
                value={selectedModel?.id}
                onValueChange={(value) => {
                  const model = simulationModels.find((m) => m.id === value)
                  if (model) setSelectedModel(model)
                }}
              >
                <SelectTrigger id="model-select" className="w-full">
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
            <div className="space-y-2">
              <Label htmlFor="speed-slider" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Simulation Speed (m/s)
              </Label>
              <div className="flex items-center space-x-2">
                <Slider
                  id="speed-slider"
                  min={0}
                  max={3}
                  step={0.1}
                  value={[simulationSpeed]}
                  onValueChange={handleSpeedChange}
                  className="flex-grow"
                />
                <Input
                  type="number"
                  value={simulationSpeed.toFixed(1)}
                  onChange={(e) => setSimulationSpeed(Number.parseFloat(e.target.value))}
                  className="w-16 text-right"
                />
              </div>
            </div>
          </>
        ) : (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10 bg-white dark:bg-gray-800">
                  <span className="text-xs font-bold">M</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Model: {selectedModel?.name}</p>
              </TooltipContent>
            </Tooltip>
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="destructive" size="icon" className="h-10 w-10" onClick={deleteSimulation}>
                    <Trash className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Delete Simulation</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </>
        )}
      </div>

      {/* Fixed footer */}
      <div className="mt-auto p-4 space-y-4 border-t bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
        {isExpanded && (
          <div className="space-y-2">
            <Label htmlFor="speed-slider" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Simulation Speed (m/s)
            </Label>
            <div className="flex items-center space-x-2">
              <Slider
                id="speed-slider"
                min={0}
                max={3}
                step={0.1}
                value={[simulationSpeed]}
                onValueChange={handleSpeedChange}
                className="flex-grow"
              />
              <Input
                type="number"
                value={simulationSpeed.toFixed(1)}
                onChange={(e) => setSimulationSpeed(Number.parseFloat(e.target.value))}
                className="w-16 text-right"
              />
            </div>
          </div>
        )}

        {isExpanded ? (
          <Button variant="destructive" className="w-full" onClick={handleDeleteSimulation}>
            <Trash className="mr-2 h-4 w-4" />
            Delete Simulation
          </Button>
        ) : (
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="destructive" size="icon" className="h-10 w-10" onClick={handleDeleteSimulation}>
                  <Trash className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Delete Simulation</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  )
}
