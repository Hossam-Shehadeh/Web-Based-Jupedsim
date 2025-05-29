"use client"

import { useState } from "react"
import { useSimulation } from "./simulation-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowUp, ArrowDown, X, Play } from "lucide-react"

export function OrderedWaypointsPanel() {
  const {
    elements,
    orderedWaypoints,
    setOrderedWaypoints,
    removeFromOrderedWaypoints,
    reorderWaypoints,
    runSimulation,
    setAlertMessage,
  } = useSimulation()

  const [agentCount, setAgentCount] = useState(5)
  const [agentSpacing, setAgentSpacing] = useState(2) // Time spacing between agents in seconds

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      reorderWaypoints(index, index - 1)
    }
  }

  const handleMoveDown = (index: number) => {
    if (index < orderedWaypoints.length - 1) {
      reorderWaypoints(index, index + 1)
    }
  }

  const handleRemove = (waypointId: string) => {
    removeFromOrderedWaypoints(waypointId)
  }

  const handleClearAll = () => {
    setOrderedWaypoints([])
  }

  const handleRunSimulation = () => {
    if (orderedWaypoints.length < 2) {
      setAlertMessage("Please define at least 2 waypoints for the path")
      return
    }

    // Run the simulation with the ordered waypoints
    runSimulation({
      useOrderedPath: true,
      agentCount,
      agentSpacing,
    })
  }

  // Get waypoint names or IDs for display
  const getWaypointLabel = (waypointId: string) => {
    const waypoint = elements.find((el) => el.id === waypointId)
    return waypoint ? `Waypoint ${waypointId.substring(0, 4)}` : waypointId.substring(0, 8)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Ordered Waypoint Path</span>
          <Button variant="outline" size="sm" onClick={handleClearAll}>
            Clear All
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {orderedWaypoints.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            Double-click on waypoints to add them to the ordered path
          </div>
        ) : (
          <div className="space-y-2">
            {orderedWaypoints.map((waypointId, index) => (
              <div key={waypointId} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-primary text-primary-foreground rounded-full text-sm font-medium">
                  {index + 1}
                </div>
                <div className="flex-grow">{getWaypointLabel(waypointId)}</div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                    <span className="sr-only">Move Up</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === orderedWaypoints.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                    <span className="sr-only">Move Down</span>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemove(waypointId)}>
                    <X className="h-4 w-4" />
                    <span className="sr-only">Remove</span>
                  </Button>
                </div>
              </div>
            ))}

            <div className="pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="agentCount">Number of Agents</Label>
                  <Input
                    id="agentCount"
                    type="number"
                    min="1"
                    max="50"
                    value={agentCount}
                    onChange={(e) => setAgentCount(Number.parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agentSpacing">Agent Spacing (seconds)</Label>
                  <Input
                    id="agentSpacing"
                    type="number"
                    min="0.5"
                    max="10"
                    step="0.5"
                    value={agentSpacing}
                    onChange={(e) => setAgentSpacing(Number.parseFloat(e.target.value) || 1)}
                  />
                </div>
              </div>

              <Button className="w-full" onClick={handleRunSimulation}>
                <Play className="mr-2 h-4 w-4" />
                Run Simulation
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
