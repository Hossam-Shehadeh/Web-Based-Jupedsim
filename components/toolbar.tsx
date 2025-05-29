"use client"

import type React from "react"
import { useState } from "react"
import { useSimulationContext } from "@/components/SimulationContext"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import type { ElementType } from "@/types/simulationTypes"
import { useSimulationLogic } from "@/hooks/useSimulationLogic"
import { SimulationConfigPanel } from "@/components/simulation-config-panel"
import { RoomEditor } from "@/components/room-editor"

export const Toolbar: React.FC = () => {
  const { state, dispatch, setSimulationRunning, resetSimulation } = useSimulationContext()
  const { config, updateConfig } = useSimulationLogic()
  const [showConfigPanel, setShowConfigPanel] = useState(false)
  const [showRoomEditor, setShowRoomEditor] = useState(false)

  const handleToolChange = (value: string) => {
    dispatch({
      type: "SET_SELECTED_TOOL",
      payload: value as ElementType,
    })
  }

  const handleRunPause = () => {
    setSimulationRunning(!state.simulationRunning)
  }

  const handleReset = () => {
    resetSimulation()
  }

  return (
    <div className="p-4 bg-white border-b">
      <div className="flex flex-wrap gap-4 items-center">
        <div>
          <RadioGroup
            value={state.selectedTool || "select"}
            onValueChange={handleToolChange}
            className="flex space-x-2"
          >
            <div className="flex items-center space-x-1">
              <RadioGroupItem value="select" id="select" />
              <Label htmlFor="select">Select</Label>
            </div>
            <div className="flex items-center space-x-1">
              <RadioGroupItem value="agent" id="agent" />
              <Label htmlFor="agent">Agent</Label>
            </div>
            <div className="flex items-center space-x-1">
              <RadioGroupItem value="source" id="source" />
              <Label htmlFor="source">Source</Label>
            </div>
            <div className="flex items-center space-x-1">
              <RadioGroupItem value="exit" id="exit" />
              <Label htmlFor="exit">Exit</Label>
            </div>
            <div className="flex items-center space-x-1">
              <RadioGroupItem value="obstacle" id="obstacle" />
              <Label htmlFor="obstacle">Obstacle</Label>
            </div>
            <div className="flex items-center space-x-1">
              <RadioGroupItem value="waypoint" id="waypoint" />
              <Label htmlFor="waypoint">Waypoint</Label>
            </div>
            <div className="flex items-center space-x-1">
              <RadioGroupItem value="room" id="room" />
              <Label htmlFor="room">Room</Label>
            </div>
            <div className="flex items-center space-x-1">
              <RadioGroupItem value="door" id="door" />
              <Label htmlFor="door">Door</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="flex space-x-2 ml-auto">
          <Button variant="outline" onClick={() => setShowRoomEditor(true)}>
            Room Editor
          </Button>
          <Button variant="outline" onClick={() => setShowConfigPanel(true)}>
            Config
          </Button>
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button variant={state.simulationRunning ? "destructive" : "default"} onClick={handleRunPause}>
            {state.simulationRunning ? "Pause" : "Run"}
          </Button>
        </div>
      </div>

      {showConfigPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="max-w-md w-full">
            <SimulationConfigPanel
              config={config}
              onUpdateConfig={updateConfig}
              onClose={() => setShowConfigPanel(false)}
            />
          </div>
        </div>
      )}

      {showRoomEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="max-w-md w-full">
            <RoomEditor onClose={() => setShowRoomEditor(false)} />
          </div>
        </div>
      )}
    </div>
  )
}

export default Toolbar
