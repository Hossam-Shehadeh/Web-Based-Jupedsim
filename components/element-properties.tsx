"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import type { Element } from "./SimulationContext"
import { useSimulation } from "./SimulationContext"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"

interface ElementPropertiesProps {
  element: Element
  onClose: () => void
}

export function ElementProperties({ element, onClose }: ElementPropertiesProps) {
  const { updateElement, deleteElement } = useSimulation()
  const [agentCount, setAgentCount] = useState(element.properties?.agentCount || 10)

  useEffect(() => {
    setAgentCount(element.properties?.agentCount || 10)
  }, [element])

  const handleAgentCountChange = (value: number[]) => {
    setAgentCount(value[0])
    updateElement(element.id, {
      properties: {
        ...element.properties,
        agentCount: value[0],
      },
    })
  }

  const handleDelete = () => {
    deleteElement(element.id)
    onClose()
  }

  return (
    <div className="absolute right-4 top-4 z-10 w-64 rounded-md border bg-background p-4 shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-medium">Element Properties</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-xs text-muted-foreground">Type</Label>
          <div className="mt-1 rounded-md bg-muted px-3 py-2 text-sm">
            {element.type.replace(/_/g, " ").toLowerCase()}
          </div>
        </div>

        {element.type === "SOURCE_RECTANGLE" && (
          <div className="space-y-2">
            <Label htmlFor="agent-count">Agent Count: {agentCount}</Label>
            <Slider
              id="agent-count"
              min={1}
              max={100}
              step={1}
              value={[agentCount]}
              onValueChange={handleAgentCountChange}
            />
          </div>
        )}

        {element.type === "WAYPOINT" && element.properties?.connections && (
          <div>
            <Label className="text-xs text-muted-foreground">Connections</Label>
            <div className="mt-1 text-sm">{element.properties.connections.length} connection(s)</div>
            <p className="mt-2 text-xs text-muted-foreground">
              Double-click on this waypoint to create a new connection.
            </p>
          </div>
        )}

        <Button variant="destructive" size="sm" className="w-full" onClick={handleDelete}>
          Delete Element
        </Button>
      </div>
    </div>
  )
}
