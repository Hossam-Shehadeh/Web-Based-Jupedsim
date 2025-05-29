"use client"

import { useSimulation } from "./simulation-context"
import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { motion, AnimatePresence } from "framer-motion"

export function SimulationStatus() {
  const {
    isSimulationRunning,
    isPlaying,
    setIsPlaying,
    currentFrame,
    simulationFrames,
    setCurrentFrame,
    agents,
    simulationTime,
  } = useSimulation()

  if (!isSimulationRunning) return null

  const totalFrames = simulationFrames.length
  const progress = totalFrames > 0 ? (currentFrame / (totalFrames - 1)) * 100 : 0

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  const resetSimulation = () => {
    setCurrentFrame(0)
  }

  return (
    <AnimatePresence>
      {isSimulationRunning && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg z-10 w-auto min-w-[300px] border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium">Simulation Status</div>
            <div className="text-xs text-muted-foreground">
              Frame {currentFrame + 1} / {totalFrames}
            </div>
          </div>

          <Progress value={progress} className="h-2 mb-3" />

          <div className="flex items-center justify-between">
            <div className="text-xs">
              <span className="font-medium">Time:</span> {simulationTime.toFixed(1)}s<span className="mx-2">|</span>
              <span className="font-medium">Agents:</span> {agents.length}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={togglePlay} className="transition-colors">
                {isPlaying ? <Pause className="h-3 w-3 mr-1" /> : <Play className="h-3 w-3 mr-1" />}
                {isPlaying ? "Pause" : "Play"}
              </Button>
              <Button variant="outline" size="sm" onClick={resetSimulation} className="transition-colors">
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
