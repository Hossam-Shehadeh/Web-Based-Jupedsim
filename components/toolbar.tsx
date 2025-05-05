"use client"

import type React from "react"

import { useSimulation } from "./SimulationContext"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import {
  MousePointer,
  Pencil,
  Circle,
  ArrowRight,
  Square,
  Trash2,
  CornerDownRight,
  MapPin,
  LayoutGrid,
} from "lucide-react"

type ToolButtonProps = {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}

function ToolButton({ icon, label, active, onClick }: ToolButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={active ? "default" : "outline"}
          size="icon"
          className={`h-10 w-10 ${active ? "bg-blue-600 hover:bg-blue-700" : ""}`}
          onClick={onClick}
        >
          {icon}
          <span className="sr-only">{label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  )
}

export function Toolbar() {
  const { selectedTool, setSelectedTool, geometryType, setGeometryType } = useSimulation()

  return (
    <TooltipProvider>
      <div className="absolute left-4 top-24 flex flex-col space-y-2 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-md border">
        <ToolButton
          icon={<MousePointer className="h-5 w-5" />}
          label="Select"
          active={selectedTool === "SELECT"}
          onClick={() => setSelectedTool("SELECT")}
        />
        <div className="h-px bg-gray-200 dark:bg-gray-700 w-full my-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={geometryType === "STREET_LINE" ? "default" : "outline"}
              size="icon"
              className={`h-10 w-10 ${
                selectedTool === "STREET_LINE" && geometryType === "STREET_LINE" ? "bg-blue-600 hover:bg-blue-700" : ""
              }`}
              onClick={() => {
                setGeometryType("STREET_LINE")
                setSelectedTool("STREET_LINE")
              }}
            >
              <LayoutGrid className="h-5 w-5" />
              <span className="sr-only">Street Lines</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Street Lines (Grid-based walkable areas)</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={geometryType === "FREE_LINE" ? "default" : "outline"}
              size="icon"
              className={`h-10 w-10 ${
                selectedTool === "FREE_LINE" && geometryType === "FREE_LINE" ? "bg-blue-600 hover:bg-blue-700" : ""
              }`}
              onClick={() => {
                setGeometryType("FREE_LINE")
                setSelectedTool("FREE_LINE")
              }}
            >
              <Pencil className="h-5 w-5" />
              <span className="sr-only">Free Lines</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Free Lines (Custom walkable areas)</p>
          </TooltipContent>
        </Tooltip>

        <div className="h-px bg-gray-200 dark:bg-gray-700 w-full my-1" />

        <ToolButton
          icon={<Circle className="h-5 w-5" />}
          label="Start Point"
          active={selectedTool === "START_POINT"}
          onClick={() => setSelectedTool("START_POINT")}
        />

        <ToolButton
          icon={<CornerDownRight className="h-5 w-5" />}
          label="Source Rectangle"
          active={selectedTool === "SOURCE_RECTANGLE"}
          onClick={() => setSelectedTool("SOURCE_RECTANGLE")}
        />

        <ToolButton
          icon={<ArrowRight className="h-5 w-5" />}
          label="Exit Point"
          active={selectedTool === "EXIT_POINT"}
          onClick={() => setSelectedTool("EXIT_POINT")}
        />

        <ToolButton
          icon={<Square className="h-5 w-5" />}
          label="Obstacle"
          active={selectedTool === "OBSTACLE"}
          onClick={() => setSelectedTool("OBSTACLE")}
        />

        <ToolButton
          icon={<MapPin className="h-5 w-5" />}
          label="Waypoint"
          active={selectedTool === "WAYPOINT"}
          onClick={() => setSelectedTool("WAYPOINT")}
        />

        <div className="h-px bg-gray-200 dark:bg-gray-700 w-full my-1" />

        <ToolButton
          icon={<Trash2 className="h-5 w-5" />}
          label="Delete"
          active={selectedTool === "DELETE"}
          onClick={() => setSelectedTool("DELETE")}
        />
      </div>
    </TooltipProvider>
  )
}
