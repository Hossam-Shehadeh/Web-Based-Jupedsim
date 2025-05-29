"use client"

import { useState } from "react"
import { useSimulation } from "./simulation-context"
import { Button } from "@/components/ui/button"
import { AlertCircle, HelpCircle, Grid, MousePointer, Square, Circle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"

export function DrawingHelper() {
  const { selectedTool } = useSimulation()
  const [showHelp, setShowHelp] = useState(false)

  // Show different help content based on the selected tool
  const getHelpContent = () => {
    switch (selectedTool) {
      case "STREET_LINE":
        return (
          <div className="space-y-4">
            <h3 className="font-medium">Drawing Street Lines</h3>
            <div className="space-y-2">
              <p>Street lines are used to define walkable areas with straight lines that snap to the grid.</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Click to place the first point</li>
                <li>Click again to place the second point (creates a straight line)</li>
                <li>Double-click to close the shape and create a polygon</li>
              </ol>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                <p className="text-sm flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2 text-blue-500" />
                  Street lines automatically snap to the grid for precise placement
                </p>
              </div>
            </div>
          </div>
        )
      case "FREE_LINE":
        return (
          <div className="space-y-4">
            <h3 className="font-medium">Drawing Free Lines</h3>
            <div className="space-y-2">
              <p>Free lines allow you to create custom walkable areas with freeform shapes.</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Click and hold to start drawing</li>
                <li>Move your mouse to create the shape</li>
                <li>Release to complete the shape</li>
              </ol>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                <p className="text-sm flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2 text-blue-500" />
                  Free lines don't snap to the grid, giving you more flexibility
                </p>
              </div>
            </div>
          </div>
        )
      case "OBSTACLE":
        return (
          <div className="space-y-4">
            <h3 className="font-medium">Drawing Obstacles</h3>
            <div className="space-y-2">
              <p>Obstacles are areas that agents cannot walk through.</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Click and hold to start drawing</li>
                <li>Move your mouse to create the obstacle shape</li>
                <li>Release to complete the obstacle</li>
              </ol>
              <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded">
                <p className="text-sm flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                  Agents will avoid obstacles during simulation
                </p>
              </div>
            </div>
          </div>
        )
      case "START_POINT":
        return (
          <div className="space-y-4">
            <h3 className="font-medium">Placing Start Points</h3>
            <div className="space-y-2">
              <p>Start points define where individual agents begin their journey.</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Click anywhere on a walkable area to place a start point</li>
              </ol>
              <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
                <p className="text-sm flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2 text-green-500" />
                  Start points must be placed within walkable areas
                </p>
              </div>
            </div>
          </div>
        )
      case "SOURCE_RECTANGLE":
        return (
          <div className="space-y-4">
            <h3 className="font-medium">Creating Source Rectangles</h3>
            <div className="space-y-2">
              <p>Source rectangles generate multiple agents in an area.</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Click to place the first corner</li>
                <li>Drag to size the rectangle</li>
                <li>Release to create the source</li>
              </ol>
              <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
                <p className="text-sm flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2 text-green-500" />
                  You can adjust the number of agents in the properties panel
                </p>
              </div>
            </div>
          </div>
        )
      case "EXIT_POINT":
        return (
          <div className="space-y-4">
            <h3 className="font-medium">Creating Exit Points</h3>
            <div className="space-y-2">
              <p>Exit points are destinations where agents will try to reach.</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Click to place the start of the exit</li>
                <li>Drag to define the exit direction and width</li>
                <li>Release to create the exit</li>
              </ol>
              <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded">
                <p className="text-sm flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                  Agents will navigate toward exit points during simulation
                </p>
              </div>
            </div>
          </div>
        )
      default:
        return (
          <div className="space-y-4">
            <h3 className="font-medium">Drawing Help</h3>
            <p>Select a tool from the sidebar to see specific instructions.</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="border rounded p-2 flex items-center">
                <Grid className="h-4 w-4 mr-2" />
                <span>Street Lines: Create straight-line walkable areas</span>
              </div>
              <div className="border rounded p-2 flex items-center">
                <MousePointer className="h-4 w-4 mr-2" />
                <span>Free Lines: Create freeform walkable areas</span>
              </div>
              <div className="border rounded p-2 flex items-center">
                <Square className="h-4 w-4 mr-2" />
                <span>Obstacles: Create areas agents avoid</span>
              </div>
              <div className="border rounded p-2 flex items-center">
                <Circle className="h-4 w-4 mr-2" />
                <span>Start Points: Place individual agents</span>
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon" className="rounded-full bg-white shadow-md">
            <HelpCircle className="h-5 w-5" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Drawing Help</DialogTitle>
            <DialogDescription>Learn how to use the drawing tools effectively</DialogDescription>
          </DialogHeader>
          <div className="mt-4">{getHelpContent()}</div>
          <div className="mt-6 flex justify-end">
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
