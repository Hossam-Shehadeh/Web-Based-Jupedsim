"use client"

import { Loader2 } from "lucide-react"

export default function LoadingOverlay() {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl flex flex-col items-center">
        <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
        <h3 className="text-xl font-medium mb-2">Running Simulation</h3>
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
          Please wait while JuPedSim processes your simulation. This may take a few moments depending on the complexity.
        </p>
      </div>
    </div>
  )
}
