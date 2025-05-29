"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { SimulationProvider } from "@/components/simulation-context"
import { AlertNotification } from "@/components/alert-notification"

// Predefined scenarios
const scenarios = [
  {
    id: "bottleneck",
    title: "Bottleneck",
    description: "Simulate pedestrian flow through a narrow passage",
    image: "/scenarios/bottleneck.png",
    difficulty: "Easy",
  },
  {
    id: "room-evacuation",
    title: "Room Evacuation",
    description: "Simulate the evacuation of a room with multiple exits",
    image: "/scenarios/room-evacuation.png",
    difficulty: "Medium",
  },
  {
    id: "crossing-flows",
    title: "Crossing Flows",
    description: "Simulate pedestrian flows crossing each other",
    image: "/scenarios/crossing-flows.png",
    difficulty: "Hard",
  },
  {
    id: "stadium",
    title: "Stadium Exit",
    description: "Simulate the exit of a stadium after an event",
    image: "/scenarios/stadium.png",
    difficulty: "Expert",
  },
  {
    id: "train-station",
    title: "Train Station",
    description: "Simulate pedestrian flow in a train station",
    image: "/scenarios/train-station.png",
    difficulty: "Expert",
  },
  {
    id: "shopping-mall",
    title: "Shopping Mall",
    description: "Simulate pedestrian behavior in a shopping mall",
    image: "/scenarios/shopping-mall.png",
    difficulty: "Hard",
  },
]

export default function ScenariosPage() {
  const router = useRouter()
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null)

  const handleLoadScenario = () => {
    if (selectedScenario) {
      // In a real app, we would load the scenario data
      // For now, just navigate to the simulation page
      router.push(`/simulation?scenario=${selectedScenario}`)
    }
  }

  return (
    <SimulationProvider>
      <div className="flex h-screen flex-col">
        <Navbar />
        <div className="flex-1 overflow-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Predefined Scenarios</h1>
            <p className="text-muted-foreground">
              Choose a predefined scenario to quickly start a simulation with realistic settings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scenarios.map((scenario) => (
              <Card
                key={scenario.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedScenario === scenario.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setSelectedScenario(scenario.id)}
              >
                <CardHeader className="pb-2">
                  <CardTitle>{scenario.title}</CardTitle>
                  <CardDescription>Difficulty: {scenario.difficulty}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-40 bg-muted rounded-md mb-2 flex items-center justify-center">
                    <img
                      src={`/placeholder.svg?height=160&width=320`}
                      alt={scenario.title}
                      className="h-full w-full object-cover rounded-md"
                    />
                  </div>
                  <p className="text-sm">{scenario.description}</p>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setSelectedScenario(scenario.id)
                      handleLoadScenario()
                    }}
                  >
                    Load Scenario
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleLoadScenario}
              disabled={!selectedScenario}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              Load Selected Scenario
            </Button>
          </div>
        </div>
        <AlertNotification />
      </div>
    </SimulationProvider>
  )
}
