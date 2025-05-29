"use client"

import { SimulationProvider } from "@/components/simulation-context"
import { Canvas } from "@/components/canvas"
import Sidebar from "@/components/sidebar"
import { Navbar } from "@/components/navbar"
import { SimulationControls } from "@/components/simulation-controls"
import { PropertiesPanel } from "@/components/properties-panel"
import { AlertNotification } from "@/components/alert-notification"
import { RunButton } from "@/components/run-button"

export default function SimulationPage() {
  return (
    <SimulationProvider>
      <div className="flex h-screen flex-col">
        <Navbar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <div className="flex-1 p-4 overflow-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Canvas />
              </div>
              <div className="space-y-4">
                <SimulationControls />
                <PropertiesPanel />
              </div>
            </div>
          </div>
        </div>
        <AlertNotification />
        <RunButton />
      </div>
    </SimulationProvider>
  )
}
