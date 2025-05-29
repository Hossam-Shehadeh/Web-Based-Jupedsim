"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ChevronRight, ChevronLeft, Pencil, Circle, ArrowRight, Square, Code } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type TutorialStep = {
  title: string
  description: string
  image?: string
  icon?: React.ReactNode
}

export function Tutorial() {
  const [open, setOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  const tutorialSteps: TutorialStep[] = [
    {
      title: "Welcome to JuPedSim Web",
      description:
        "JuPedSim is a Python package with a C++ core to simulate pedestrian dynamics. Originally started in 2010 as a C++ based CLI application, it has been rewritten as a Python package for easier use.",
      icon: <img src="/placeholder.svg?height=64&width=64" alt="JuPedSim Logo" className="h-16 w-auto" />,
    },
    {
      title: "Pedestrian Dynamics Simulation",
      description:
        "JuPedSim offers a Python interface to set up and conduct pedestrian dynamics simulations. You can simulate both simple layouts like bottlenecks and complex scenarios with crowd management measures.",
      icon: (
        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        </div>
      ),
    },
    {
      title: "Simulation Models",
      description:
        "JuPedSim offers two different microscopic models: the Collision Free Speed Model (a speed model) and the Generalized Centrifugal Force Model (a force model). In our web interface, you can select between these models.",
      icon: <div className="text-2xl font-bold">M</div>,
    },
    {
      title: "Drawing Walkable Areas",
      description:
        "Start by creating walkable areas using the Street Lines or Free Lines tool. These define where pedestrians can move in your simulation.",
      icon: <Pencil className="h-12 w-12 text-blue-500" />,
    },
    {
      title: "Adding Agents",
      description:
        "Add agents to your simulation using Start Points or Source Rectangles. Agents will spawn from these locations and move toward exit points.",
      icon: <Circle className="h-12 w-12 text-green-500" />,
    },
    {
      title: "Creating Exits",
      description:
        "Add Exit Points to define where agents should move toward. Agents will automatically find the nearest exit and move toward it.",
      icon: <ArrowRight className="h-12 w-12 text-red-500" />,
    },
    {
      title: "Adding Obstacles",
      description:
        "Use the Obstacle tool to create barriers that agents must navigate around. Obstacles can be used to create complex environments like bottlenecks.",
      icon: <Square className="h-12 w-12 text-gray-700" />,
    },
    {
      title: "Running Simulations",
      description:
        "Once you've set up your environment, click the 'Run Simulation' button. The simulation will be processed by the JuPedSim backend and the results will be displayed on the canvas.",
      icon: (
        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white">
          ▶
        </div>
      ),
    },
    {
      title: "Learn More",
      description:
        "To learn more about JuPedSim, visit the official website at www.jupedsim.org. You can also install JuPedSim directly with 'pip install jupedsim' or check out the GitHub repository.",
      icon: <Code className="h-12 w-12 text-purple-500" />,
    },
  ]

  useEffect(() => {
    // Check if the tutorial has been shown before
    const tutorialShown = localStorage.getItem("jupedsim-tutorial-shown")
    if (!tutorialShown) {
      setOpen(true)
    }
  }, [])

  const handleClose = () => {
    // Mark the tutorial as shown
    localStorage.setItem("jupedsim-tutorial-shown", "true")
    setOpen(false)
  }

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleClose()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{tutorialSteps[currentStep].title}</DialogTitle>
          <DialogDescription>
            Step {currentStep + 1} of {tutorialSteps.length}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center p-4 space-y-4">
          <div className="flex items-center justify-center h-24 w-24 rounded-full bg-gray-100 dark:bg-gray-800">
            {tutorialSteps[currentStep].icon}
          </div>
          <p className="text-center">{tutorialSteps[currentStep].description}</p>
        </div>
        <DialogFooter className="flex justify-between">
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleClose}>
              Skip Tutorial
            </Button>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={prevStep} disabled={currentStep === 0}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            <Button onClick={nextStep}>
              {currentStep === tutorialSteps.length - 1 ? "Finish" : "Next"}
              {currentStep < tutorialSteps.length - 1 && <ChevronRight className="ml-1 h-4 w-4" />}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
