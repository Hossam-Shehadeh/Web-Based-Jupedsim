"use client"

import { useState, useEffect } from "react"
import { useSimulation } from "./simulation-context"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ExternalLink, AlertTriangle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function ModelInfoButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const { simulationModels, backendAvailable, showAlert } = useSimulation()

  useEffect(() => {
    // Reset error state when dialog opens
    if (open) {
      setApiError(null)
    }
  }, [open])

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        About JuPedSim Models
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>JuPedSim Pedestrian Models</DialogTitle>
            <DialogDescription>JuPedSim offers different models for simulating pedestrian dynamics</DialogDescription>
          </DialogHeader>

          {!backendAvailable && (
            <Alert variant="warning" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>Backend connection unavailable. Using local model data.</AlertDescription>
            </Alert>
          )}

          {apiError && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading model information...</span>
            </div>
          ) : (
            <Tabs defaultValue="models" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="models">Models</TabsTrigger>
                <TabsTrigger value="about">About JuPedSim</TabsTrigger>
              </TabsList>
              <TabsContent value="models" className="space-y-4">
                <div className="space-y-4 mt-4">
                  {simulationModels.map((model) => (
                    <div
                      key={model.id}
                      className="p-4 rounded-md border hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors"
                    >
                      <h3 className="font-medium text-lg">{model.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{model.description}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="about">
                <div className="space-y-4 mt-4">
                  <p>
                    JuPedSim is a Python package with a C++ core to simulate pedestrian dynamics. This project
                    originally started in 2010 as a C++ based CLI application.
                  </p>
                  <p>
                    JuPedSim offers a Python interface to set up and conduct pedestrian dynamics simulations. You can
                    simulate small, simple layouts as bottleneck, but you can also simulate large, complex scenarios. In
                    these complex scenarios, different crowd management measures can be modeled with built-in modules.
                  </p>
                  <div className="flex justify-between mt-6">
                    <Button variant="outline" asChild>
                      <a href="https://www.jupedsim.org/" target="_blank" rel="noopener noreferrer">
                        Visit JuPedSim Website
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                    <Button variant="outline" asChild>
                      <a href="https://github.com/jupedsim/jupedsim" target="_blank" rel="noopener noreferrer">
                        GitHub Repository
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button onClick={() => setOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
