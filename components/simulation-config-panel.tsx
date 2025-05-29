"use client"

import type React from "react"
import { useState } from "react"
import type { SimulationConfig } from "@/types/simulationTypes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"

interface SimulationConfigPanelProps {
  config: SimulationConfig
  onUpdateConfig: (config: Partial<SimulationConfig>) => void
  onClose: () => void
}

export const SimulationConfigPanel: React.FC<SimulationConfigPanelProps> = ({ config, onUpdateConfig, onClose }) => {
  const [localConfig, setLocalConfig] = useState<SimulationConfig>({ ...config })

  const handleChange = (section: keyof SimulationConfig, key: string, value: number) => {
    setLocalConfig((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }))
  }

  const handleSave = () => {
    onUpdateConfig(localConfig)
    onClose()
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Simulation Configuration</h2>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Social Force Parameters</h3>

        <div className="grid gap-4">
          <div>
            <Label htmlFor="desiredForce">Desired Force: {localConfig.socialForce.desiredForce.toFixed(1)}</Label>
            <Slider
              id="desiredForce"
              min={0}
              max={5}
              step={0.1}
              value={[localConfig.socialForce.desiredForce]}
              onValueChange={(value) => handleChange("socialForce", "desiredForce", value[0])}
              className="my-2"
            />
            <p className="text-sm text-gray-500">Controls how strongly agents are attracted to their targets</p>
          </div>

          <div>
            <Label htmlFor="repulsionForce">Repulsion Force: {localConfig.socialForce.repulsionForce.toFixed(1)}</Label>
            <Slider
              id="repulsionForce"
              min={0}
              max={10}
              step={0.1}
              value={[localConfig.socialForce.repulsionForce]}
              onValueChange={(value) => handleChange("socialForce", "repulsionForce", value[0])}
              className="my-2"
            />
            <p className="text-sm text-gray-500">Controls how strongly agents avoid each other</p>
          </div>

          <div>
            <Label htmlFor="obstacleForce">Obstacle Force: {localConfig.socialForce.obstacleForce.toFixed(1)}</Label>
            <Slider
              id="obstacleForce"
              min={0}
              max={20}
              step={0.1}
              value={[localConfig.socialForce.obstacleForce]}
              onValueChange={(value) => handleChange("socialForce", "obstacleForce", value[0])}
              className="my-2"
            />
            <p className="text-sm text-gray-500">Controls how strongly agents avoid obstacles</p>
          </div>

          <div>
            <Label htmlFor="doorAttractionForce">
              Door Attraction Force: {localConfig.socialForce.doorAttractionForce.toFixed(1)}
            </Label>
            <Slider
              id="doorAttractionForce"
              min={0}
              max={5}
              step={0.1}
              value={[localConfig.socialForce.doorAttractionForce]}
              onValueChange={(value) => handleChange("socialForce", "doorAttractionForce", value[0])}
              className="my-2"
            />
            <p className="text-sm text-gray-500">
              Controls how strongly agents are attracted to doors when exiting rooms
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Simulation Parameters</h3>

        <div className="grid gap-4">
          <div>
            <Label htmlFor="timeLimit">Time Limit (seconds)</Label>
            <Input
              id="timeLimit"
              type="number"
              min={1}
              value={localConfig.timeLimit}
              onChange={(e) =>
                setLocalConfig((prev) => ({
                  ...prev,
                  timeLimit: Number(e.target.value),
                }))
              }
              className="my-2"
            />
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Agent Defaults</h3>

        <div className="grid gap-4">
          <div>
            <Label htmlFor="agentRadius">Agent Radius</Label>
            <Input
              id="agentRadius"
              type="number"
              min={1}
              max={50}
              value={localConfig.agentDefaults.radius}
              onChange={(e) => handleChange("agentDefaults", "radius", Number(e.target.value))}
              className="my-2"
            />
          </div>

          <div>
            <Label htmlFor="agentMaxSpeed">Agent Max Speed</Label>
            <Input
              id="agentMaxSpeed"
              type="number"
              min={1}
              max={200}
              value={localConfig.agentDefaults.maxSpeed}
              onChange={(e) => handleChange("agentDefaults", "maxSpeed", Number(e.target.value))}
              className="my-2"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSave} className="flex-1">
          Save Configuration
        </Button>
        <Button variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
      </div>
    </div>
  )
}

export default SimulationConfigPanel
