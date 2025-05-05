"use client"

import { useSimulation } from "@/hooks/useSimulation"
import Navbar from "./Navbar"
import Sidebar from "./Sidebar"
import SimulationCanvas from "@/components/simulation/SimulationCanvas"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/useToast"
import { useEffect } from "react"
import WelcomeDialog from "@/components/simulation/WelcomeDialog"
import LoadingOverlay from "@/components/simulation/LoadingOverlay"

export default function SimulationLayout() {
  const { error, isLoading, backendAvailable } = useSimulation()
  const { toast } = useToast()

  // Show error toast when error changes
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      })
    }
  }, [error, toast])

  // Show notification when backend is not available
  useEffect(() => {
    if (backendAvailable === false) {
      toast({
        title: "Backend Unavailable",
        description: "Running in demo mode. Some features may be limited.",
        variant: "secondary",
      })
    }
  }, [backendAvailable, toast])

  return (
    <div className="flex h-screen flex-col bg-gradient-to-br from-blue-50 to-purple-100 dark:from-gray-900 dark:to-blue-950">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-hidden bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm shadow-inner">
          <SimulationCanvas />
        </main>
      </div>
      <WelcomeDialog />
      {isLoading && <LoadingOverlay />}
      <Toaster />
    </div>
  )
}
