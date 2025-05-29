"use client"

import { useSimulation } from "./simulation-context"
import { Button } from "@/components/ui/button"
import { Play, Pause, RefreshCw, Loader2 } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

export function RunButton() {
  const { isSimulationRunning, runSimulation, stopSimulation, deleteSimulation, isLoading } = useSimulation()

  const [isPulsing, setIsPulsing] = useState(true)
  const [isRestarting, setIsRestarting] = useState(false)

  useEffect(() => {
    // Stop pulsing when simulation is running or loading
    if (isSimulationRunning || isLoading) {
      setIsPulsing(false)
    } else {
      // Start pulsing again when simulation stops
      setIsPulsing(true)
    }
  }, [isSimulationRunning, isLoading])

  const handleRunSimulation = () => {
    if (isSimulationRunning) {
      stopSimulation()
    } else {
      runSimulation()
    }
  }

  const handleRestartSimulation = () => {
    setIsRestarting(true)
    // First stop the current simulation
    stopSimulation()

    // Then start a new one after a short delay
    setTimeout(() => {
      deleteSimulation()
      setTimeout(() => {
        runSimulation()
        setIsRestarting(false)
      }, 500)
    }, 500)
  }

  return (
    <TooltipProvider>
      <div className="fixed bottom-6 right-6 flex flex-col space-y-2">
        {isSimulationRunning && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="h-12 w-12 rounded-full shadow-lg transition-all duration-200 hover:scale-110 bg-yellow-500 hover:bg-yellow-600"
                onClick={handleRestartSimulation}
                disabled={isLoading || isRestarting}
                size="icon"
              >
                {isRestarting ? (
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                ) : (
                  <RefreshCw className="h-6 w-6 text-white" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Restart Simulation</p>
            </TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className={cn(
                "h-14 w-14 rounded-full shadow-lg transition-all duration-200 hover:scale-110",
                isSimulationRunning
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600",
                isPulsing && !isLoading && !isSimulationRunning && "animate-pulse",
              )}
              onClick={handleRunSimulation}
              disabled={isLoading || isRestarting}
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              ) : isSimulationRunning ? (
                <Pause className="h-6 w-6 text-white" />
              ) : (
                <Play className="h-6 w-6 text-white ml-1" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>{isSimulationRunning ? "Stop Simulation" : "Run Simulation"}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
