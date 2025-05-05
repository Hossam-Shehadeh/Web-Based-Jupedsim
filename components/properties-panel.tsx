"use client"

import type React from "react"

import { useState } from "react"
import { useSimulation } from "./SimulationContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { X, Info } from "lucide-react"

export function PropertiesPanel() {
  const { selectedElement, updateElement, deleteElement, selectElement } = useSimulation()
  const [agentCount, setAgentCount] = useState(selectedElement?.properties?.agentCount || 10)

  if (!selectedElement) return null

  const handleAgentCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const count = Number.parseInt(e.target.value)
    if (!isNaN(count) && count > 0) {
      setAgentCount(count)
      updateElement(selectedElement.id, {
        properties: {
          ...selectedElement.properties,
          agentCount: count,
        },
      })
    }
  }

  return (
    <TooltipProvider>
      <div className="absolute right-4 top-24 w-64 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium">Properties</h3>
          <Button variant="ghost" size="icon" onClick={() => selectElement(null)}>
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-xs text-gray-500 dark:text-gray-400">Type</Label>
            <div className="font-medium">{selectedElement.type.replace(/_/g, " ")}</div>
          </div>

          {selectedElement.type === "SOURCE_RECTANGLE" && (
            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="agentCount">Agent Count</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-5 w-5">
                      <Info className="h-3 w-3" />
                      <span className="sr-only">Info</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Number of agents to spawn from this source</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="agentCount"
                type="number"
                min="1"
                max="100"
                value={agentCount}
                onChange={handleAgentCountChange}
              />
            </div>
          )}

          <div className="pt-2">
            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={() => {
                deleteElement(selectedElement.id)
                selectElement(null)
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
