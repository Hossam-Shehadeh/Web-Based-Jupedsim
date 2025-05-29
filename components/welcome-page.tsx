"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ChevronRight,
  Info,
  Lightbulb,
  Play,
  Settings,
  Users,
  ArrowRight,
  Pencil,
  Square,
  Circle,
  Moon,
  Sun,
} from "lucide-react"
import { useTheme } from "next-themes"

export function WelcomePage() {
  const router = useRouter()
  const [showWelcome, setShowWelcome] = useState(true)
  const [activeTab, setActiveTab] = useState("about")
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    // Check if the user has seen the welcome page before
    const hasSeenWelcome = localStorage.getItem("jupedsim-welcome-seen")
    if (hasSeenWelcome) {
      setShowWelcome(false)
    }
  }, [])

  const handleGetStarted = () => {
    // Mark the welcome page as seen
    localStorage.setItem("jupedsim-welcome-seen", "true")
    setShowWelcome(false)
    router.push("/simulation")
  }

  if (!showWelcome) {
    return null
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100 dark:from-gray-900 dark:to-blue-950 z-50 p-4 overflow-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-5xl"
      >
        <Card className="shadow-2xl border-t-4 border-t-blue-500">
          <CardHeader className="text-center pb-2">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="mx-auto mb-4 relative"
            >
              <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 w-32 h-32 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-lg border-4 border-blue-100 dark:border-blue-900">
                <img src="/placeholder.svg?height=80&width=80" alt="JuPedSim Logo" className="h-20 w-auto" />
              </div>
            </motion.div>
            <div className="h-10"></div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Welcome to JuPedSim Web
            </CardTitle>
            <CardDescription className="text-lg mt-2">
              A powerful web-based pedestrian dynamics simulation platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="about" value={activeTab} onValueChange={setActiveTab} className="mt-6">
              <TabsList className="grid w-full grid-cols-4 mb-8">
                <TabsTrigger
                  value="about"
                  className="data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900"
                >
                  About
                </TabsTrigger>
                <TabsTrigger
                  value="features"
                  className="data-[state=active]:bg-green-100 dark:data-[state=active]:bg-green-900"
                >
                  Features
                </TabsTrigger>
                <TabsTrigger
                  value="models"
                  className="data-[state=active]:bg-amber-100 dark:data-[state=active]:bg-amber-900"
                >
                  Models
                </TabsTrigger>
                <TabsTrigger
                  value="getting-started"
                  className="data-[state=active]:bg-purple-100 dark:data-[state=active]:bg-purple-900"
                >
                  Getting Started
                </TabsTrigger>
              </TabsList>

              <TabsContent value="about">
                <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
                  <motion.div variants={item} className="flex items-start gap-6">
                    <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-4 flex-shrink-0">
                      <Info className="h-8 w-8 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div>
                      <h3 className="text-xl font-medium mb-2">What is JuPedSim?</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        JuPedSim is a Python package with a C++ core designed to simulate pedestrian dynamics with high
                        precision. Originally started in 2010 as a C++ based CLI application, it has evolved into a
                        comprehensive simulation framework used by researchers and urban planners worldwide.
                      </p>
                    </div>
                  </motion.div>

                  <motion.div variants={item} className="flex items-start gap-6">
                    <div className="bg-green-100 dark:bg-green-900 rounded-full p-4 flex-shrink-0">
                      <Users className="h-8 w-8 text-green-600 dark:text-green-300" />
                    </div>
                    <div>
                      <h3 className="text-xl font-medium mb-2">Pedestrian Dynamics</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        JuPedSim offers a sophisticated interface to set up and conduct pedestrian dynamics simulations.
                        You can model everything from simple bottlenecks to complex scenarios with various crowd
                        management measures, making it ideal for evacuation planning, urban design, and event
                        management.
                      </p>
                    </div>
                  </motion.div>

                  <motion.div variants={item} className="flex items-start gap-6">
                    <div className="bg-purple-100 dark:bg-purple-900 rounded-full p-4 flex-shrink-0">
                      <Lightbulb className="h-8 w-8 text-purple-600 dark:text-purple-300" />
                    </div>
                    <div>
                      <h3 className="text-xl font-medium mb-2">Research & Applications</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        JuPedSim is used in research institutions and industry for analyzing pedestrian flow, optimizing
                        building layouts, planning emergency evacuations, and designing public spaces. The web interface
                        makes these powerful simulation capabilities accessible to everyone.
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              </TabsContent>

              <TabsContent value="features">
                <motion.div
                  variants={container}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  <motion.div
                    variants={item}
                    className="border rounded-lg p-6 bg-white/50 dark:bg-gray-800/50 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center mb-4">
                      <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full mr-4">
                        <Pencil className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                      </div>
                      <h3 className="text-lg font-medium">Interactive Drawing Tools</h3>
                    </div>
                    <p className="text-muted-foreground">
                      Create walkable areas, obstacles, start points, and exits with intuitive drawing tools. Design
                      complex environments with precision and ease.
                    </p>
                  </motion.div>

                  <motion.div
                    variants={item}
                    className="border rounded-lg p-6 bg-white/50 dark:bg-gray-800/50 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center mb-4">
                      <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full mr-4">
                        <Play className="h-6 w-6 text-green-600 dark:text-green-300" />
                      </div>
                      <h3 className="text-lg font-medium">Real-time Simulation</h3>
                    </div>
                    <p className="text-muted-foreground">
                      Run simulations in real-time and visualize pedestrian movement with different models. Watch as
                      agents navigate your environment and respond to obstacles.
                    </p>
                  </motion.div>

                  <motion.div
                    variants={item}
                    className="border rounded-lg p-6 bg-white/50 dark:bg-gray-800/50 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center mb-4">
                      <div className="bg-amber-100 dark:bg-amber-900 p-3 rounded-full mr-4">
                        <Settings className="h-6 w-6 text-amber-600 dark:text-amber-300" />
                      </div>
                      <h3 className="text-lg font-medium">Customizable Parameters</h3>
                    </div>
                    <p className="text-muted-foreground">
                      Adjust simulation speed, agent count, and other parameters to fit your specific needs. Fine-tune
                      your simulations for different scenarios and conditions.
                    </p>
                  </motion.div>

                  <motion.div
                    variants={item}
                    className="border rounded-lg p-6 bg-white/50 dark:bg-gray-800/50 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center mb-4">
                      <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full mr-4">
                        <ArrowRight className="h-6 w-6 text-purple-600 dark:text-purple-300" />
                      </div>
                      <h3 className="text-lg font-medium">Waypoint System</h3>
                    </div>
                    <p className="text-muted-foreground">
                      Create complex agent paths using waypoints to guide pedestrian movement. Design realistic movement
                      patterns and test different routing strategies.
                    </p>
                  </motion.div>
                </motion.div>
              </TabsContent>

              <TabsContent value="models">
                <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
                  <motion.div
                    variants={item}
                    className="border rounded-lg p-6 bg-white/50 dark:bg-gray-800/50 shadow-sm"
                  >
                    <h3 className="text-xl font-medium mb-3 flex items-center">
                      <div className="bg-red-100 dark:bg-red-900 p-2 rounded-full mr-3">
                        <div className="w-4 h-4 rounded-full bg-red-500"></div>
                      </div>
                      Collision Free Speed Model
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      A speed-based model that avoids collisions between agents by adjusting their velocity. This model
                      is computationally efficient and works well for simulating normal pedestrian flow in open spaces.
                      Agents follow direct paths to their destinations while avoiding collisions.
                    </p>
                  </motion.div>

                  <motion.div
                    variants={item}
                    className="border rounded-lg p-6 bg-white/50 dark:bg-gray-800/50 shadow-sm"
                  >
                    <h3 className="text-xl font-medium mb-3 flex items-center">
                      <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full mr-3">
                        <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                      </div>
                      Collision Free Speed Model V2
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      An improved version with better acceleration and deceleration behavior. This model creates more
                      realistic movement patterns with smoother transitions between different speeds. It's ideal for
                      simulating pedestrian behavior in areas with varying density.
                    </p>
                  </motion.div>

                  <motion.div
                    variants={item}
                    className="border rounded-lg p-6 bg-white/50 dark:bg-gray-800/50 shadow-sm"
                  >
                    <h3 className="text-xl font-medium mb-3 flex items-center">
                      <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full mr-3">
                        <div className="w-4 h-4 rounded-full bg-green-500"></div>
                      </div>
                      Generalized Centrifugal Force Model
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      A force-based model that simulates repulsive forces between agents and obstacles. This
                      physics-based approach creates realistic crowd dynamics, especially in high-density situations.
                      It's particularly effective for simulating emergency evacuations and congested areas.
                    </p>
                  </motion.div>

                  <motion.div
                    variants={item}
                    className="border rounded-lg p-6 bg-white/50 dark:bg-gray-800/50 shadow-sm"
                  >
                    <h3 className="text-xl font-medium mb-3 flex items-center">
                      <div className="bg-amber-100 dark:bg-amber-900 p-2 rounded-full mr-3">
                        <div className="w-4 h-4 rounded-full bg-amber-500"></div>
                      </div>
                      Social Force Model
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      A model based on social forces between pedestrians, considering psychological factors. This model
                      accounts for personal space preferences and social interactions, creating more human-like
                      behavior. It's excellent for simulating realistic crowd behavior in social settings.
                    </p>
                  </motion.div>
                </motion.div>
              </TabsContent>

              <TabsContent value="getting-started">
                <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
                  <motion.div variants={item} className="flex items-start gap-6">
                    <div className="bg-blue-100 dark:bg-blue-900 rounded-full h-12 w-12 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-xl flex-shrink-0">
                      1
                    </div>
                    <div>
                      <h3 className="text-xl font-medium mb-2">Create Walkable Areas</h3>
                      <p className="text-muted-foreground mb-4">
                        Start by drawing walkable areas using the Street Lines or Free Lines tool. These define where
                        pedestrians can move in your simulation.
                      </p>
                      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md flex items-center">
                        <Pencil className="h-5 w-5 mr-3 text-blue-500" />
                        <span>
                          Select the <strong>Street Lines</strong> or <strong>Free Lines</strong> tool from the sidebar
                          and draw on the canvas.
                        </span>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div variants={item} className="flex items-start gap-6">
                    <div className="bg-green-100 dark:bg-green-900 rounded-full h-12 w-12 flex items-center justify-center text-green-600 dark:text-green-300 font-bold text-xl flex-shrink-0">
                      2
                    </div>
                    <div>
                      <h3 className="text-xl font-medium mb-2">Add Start Points and Exits</h3>
                      <p className="text-muted-foreground mb-4">
                        Place start points or source rectangles to define where agents will spawn. Add exit points to
                        define destinations.
                      </p>
                      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md flex items-center">
                        <Circle className="h-5 w-5 mr-3 text-green-500" />
                        <span>
                          Use <strong>Start Point</strong> or <strong>Source Rectangle</strong> tools to add agent
                          origins.
                        </span>
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md flex items-center mt-2">
                        <ArrowRight className="h-5 w-5 mr-3 text-red-500" />
                        <span>
                          Add <strong>Exit Points</strong> to define where agents should go.
                        </span>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div variants={item} className="flex items-start gap-6">
                    <div className="bg-amber-100 dark:bg-amber-900 rounded-full h-12 w-12 flex items-center justify-center text-amber-600 dark:text-amber-300 font-bold text-xl flex-shrink-0">
                      3
                    </div>
                    <div>
                      <h3 className="text-xl font-medium mb-2">Add Obstacles (Optional)</h3>
                      <p className="text-muted-foreground mb-4">
                        Add obstacles to create more complex environments that agents must navigate around.
                      </p>
                      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md flex items-center">
                        <Square className="h-5 w-5 mr-3" />
                        <span>
                          Use the <strong>Obstacle</strong> tool to draw barriers and walls.
                        </span>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div variants={item} className="flex items-start gap-6">
                    <div className="bg-purple-100 dark:bg-purple-900 rounded-full h-12 w-12 flex items-center justify-center text-purple-600 dark:text-purple-300 font-bold text-xl flex-shrink-0">
                      4
                    </div>
                    <div>
                      <h3 className="text-xl font-medium mb-2">Run the Simulation</h3>
                      <p className="text-muted-foreground mb-4">
                        Click the "Run Simulation" button to start the simulation. You can pause, play, and reset the
                        simulation using the controls.
                      </p>
                      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md flex items-center">
                        <Play className="h-5 w-5 mr-3 text-green-500" />
                        <span>
                          Click <strong>Run Simulation</strong> in the top navigation bar to start.
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between pt-6 border-t">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="mr-2"
              >
                {theme === "dark" ? (
                  <Sun className="h-[1.2rem] w-[1.2rem]" />
                ) : (
                  <Moon className="h-[1.2rem] w-[1.2rem]" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open("https://www.jupedsim.org/", "_blank")}
                className="gap-2"
              >
                Learn More
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M3 2C2.44772 2 2 2.44772 2 3V12C2 12.5523 2.44772 13 3 13H12C12.5523 13 13 12.5523 13 12V8.5C13 8.22386 12.7761 8 12.5 8C12.2239 8 12 8.22386 12 8.5V12H3V3H6.5C6.77614 3 7 2.77614 7 2.5C7 2.22386 6.77614 2 6.5 2H3ZM12.8536 2.14645C12.9015 2.19439 12.9377 2.24964 12.9621 2.30861C12.9861 2.36669 12.9996 2.4303 13 2.497L13 2.5V2.50049V5.5C13 5.77614 12.7761 6 12.5 6C12.2239 6 12 5.77614 12 5.5V3.70711L6.85355 8.85355C6.65829 9.04882 6.34171 9.04882 6.14645 8.85355C5.95118 8.65829 5.95118 8.34171 6.14645 8.14645L11.2929 3H9.5C9.22386 3 9 2.77614 9 2.5C9 2.22386 9.22386 2 9.5 2H12.4999H12.5C12.5678 2 12.6324 2.01349 12.6914 2.03794C12.7504 2.06234 12.8056 2.09851 12.8536 2.14645Z"
                    fill="currentColor"
                    fillRule="evenodd"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </Button>
            </div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white gap-2"
              >
                Get Started
                <ChevronRight className="h-4 w-4" />
              </Button>
            </motion.div>
          </CardFooter>
        </Card>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>JuPedSim Web Interface • Version 1.0.0 • © 2023 JuPedSim Team</p>
        </div>
      </motion.div>
    </div>
  )
}
