"use client"

import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { SimulationProvider } from "@/components/simulation-context"
import { AlertNotification } from "@/components/alert-notification"
import { Book, HelpCircle, Code, Lightbulb, Pencil, Circle, ArrowRight, Square } from "lucide-react"

export default function HelpPage() {
  return (
    <SimulationProvider>
      <div className="flex h-screen flex-col">
        <Navbar />
        <div className="flex-1 overflow-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Help & Documentation</h1>
            <p className="text-muted-foreground">Learn how to use JuPedSim Web effectively.</p>
          </div>

          <Tabs defaultValue="getting-started">
            <TabsList className="mb-6">
              <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
              <TabsTrigger value="tutorials">Tutorials</TabsTrigger>
              <TabsTrigger value="faq">FAQ</TabsTrigger>
              <TabsTrigger value="api">API</TabsTrigger>
            </TabsList>

            <TabsContent value="getting-started">
              <Card>
                <CardHeader>
                  <CardTitle>Getting Started with JuPedSim Web</CardTitle>
                  <CardDescription>
                    Learn the basics of pedestrian dynamics simulation with JuPedSim Web.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold flex items-center">
                      <Book className="mr-2 h-5 w-5 text-blue-500" />
                      What is JuPedSim?
                    </h3>
                    <p>
                      JuPedSim is a Python package with a C++ core to simulate pedestrian dynamics. Originally started
                      in 2010 as a C++ based CLI application, it has been rewritten as a Python package for easier use.
                    </p>
                    <p>
                      JuPedSim Web is a web-based interface for JuPedSim that allows you to create, run, and analyze
                      pedestrian dynamics simulations directly in your browser.
                    </p>

                    <h3 className="text-xl font-semibold flex items-center">
                      <Lightbulb className="mr-2 h-5 w-5 text-amber-500" />
                      Key Concepts
                    </h3>
                    <p>Before diving into simulations, it's important to understand some key concepts:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>
                        <strong>Walkable Areas</strong>: Spaces where pedestrians can move.
                      </li>
                      <li>
                        <strong>Agents</strong>: Individual pedestrians in the simulation.
                      </li>
                      <li>
                        <strong>Start Points</strong>: Locations where agents begin.
                      </li>
                      <li>
                        <strong>Exit Points</strong>: Destinations where agents are trying to reach.
                      </li>
                      <li>
                        <strong>Obstacles</strong>: Barriers that agents must navigate around.
                      </li>
                      <li>
                        <strong>Waypoints</strong>: Optional points that guide agent movement.
                      </li>
                    </ul>

                    <h3 className="text-xl font-semibold flex items-center">
                      <HelpCircle className="mr-2 h-5 w-5 text-green-500" />
                      Basic Workflow
                    </h3>
                    <ol className="list-decimal pl-6 space-y-2">
                      <li>Create walkable areas using the Street Lines or Free Lines tool.</li>
                      <li>Add start points or source rectangles to define where agents will spawn.</li>
                      <li>Add exit points to define where agents should go.</li>
                      <li>Optionally add obstacles and waypoints to create more complex scenarios.</li>
                      <li>Select a simulation model and set the simulation speed.</li>
                      <li>Run the simulation and analyze the results.</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tutorials">
              <Card>
                <CardHeader>
                  <CardTitle>Step-by-Step Tutorials</CardTitle>
                  <CardDescription>Learn how to use JuPedSim Web through practical examples.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="tutorial-1">
                      <AccordionTrigger>
                        <div className="flex items-center">
                          <Pencil className="mr-2 h-5 w-5 text-blue-500" />
                          Tutorial 1: Creating Walkable Areas
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <p>
                          Walkable areas define where pedestrians can move in your simulation. Follow these steps to
                          create walkable areas:
                        </p>
                        <ol className="list-decimal pl-6 space-y-2">
                          <li>Select the "Street Lines" or "Free Lines" tool from the sidebar.</li>
                          <li>Click on the canvas to place the first point of your walkable area.</li>
                          <li>Continue clicking to add more points, forming the boundary of the area.</li>
                          <li>
                            To complete the area, connect back to the first point or double-click on the last point.
                          </li>
                        </ol>
                        <p>Tips:</p>
                        <ul className="list-disc pl-6">
                          <li>Street Lines snap to the grid, making it easier to create regular shapes.</li>
                          <li>Free Lines allow for more organic shapes but require more precision.</li>
                          <li>You can create multiple walkable areas in a single simulation.</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="tutorial-2">
                      <AccordionTrigger>
                        <div className="flex items-center">
                          <Circle className="mr-2 h-5 w-5 text-green-500" />
                          Tutorial 2: Adding Agents
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <p>Agents are the pedestrians in your simulation. There are two ways to add agents:</p>
                        <h4 className="font-semibold">Using Start Points:</h4>
                        <ol className="list-decimal pl-6 space-y-2">
                          <li>Select the "Start Point" tool from the sidebar.</li>
                          <li>Click on the canvas within a walkable area to place a start point.</li>
                          <li>Each start point represents a single agent.</li>
                        </ol>
                        <h4 className="font-semibold">Using Source Rectangles:</h4>
                        <ol className="list-decimal pl-6 space-y-2">
                          <li>Select the "Source Rectangle" tool from the sidebar.</li>
                          <li>Click and drag on the canvas to create a rectangle within a walkable area.</li>
                          <li>
                            Adjust the "Agent Count" property to specify how many agents will spawn from this source.
                          </li>
                        </ol>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="tutorial-3">
                      <AccordionTrigger>
                        <div className="flex items-center">
                          <ArrowRight className="mr-2 h-5 w-5 text-red-500" />
                          Tutorial 3: Creating Exits
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <p>
                          Exit points define where agents are trying to reach. Follow these steps to create exit points:
                        </p>
                        <ol className="list-decimal pl-6 space-y-2">
                          <li>Select the "Exit Point" tool from the sidebar.</li>
                          <li>
                            Click and drag on the canvas to create an exit line, typically at the edge of a walkable
                            area.
                          </li>
                          <li>You can create multiple exits in a single simulation.</li>
                        </ol>
                        <p>Tips:</p>
                        <ul className="list-disc pl-6">
                          <li>Agents will automatically find the nearest exit and move toward it.</li>
                          <li>The width of the exit affects how many agents can pass through simultaneously.</li>
                          <li>Place exits strategically to study different evacuation scenarios.</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="tutorial-4">
                      <AccordionTrigger>
                        <div className="flex items-center">
                          <Square className="mr-2 h-5 w-5 text-gray-700" />
                          Tutorial 4: Adding Obstacles
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <p>
                          Obstacles are barriers that agents must navigate around. Follow these steps to add obstacles:
                        </p>
                        <ol className="list-decimal pl-6 space-y-2">
                          <li>Select the "Obstacle" tool from the sidebar.</li>
                          <li>Click on the canvas to place the first point of your obstacle.</li>
                          <li>Continue clicking to add more points, forming the boundary of the obstacle.</li>
                          <li>
                            To complete the obstacle, connect back to the first point or double-click on the last point.
                          </li>
                        </ol>
                        <p>Tips:</p>
                        <ul className="list-disc pl-6">
                          <li>Obstacles can be used to create complex environments like bottlenecks or corridors.</li>
                          <li>Agents will automatically find paths around obstacles.</li>
                          <li>You can create multiple obstacles in a single simulation.</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="faq">
              <Card>
                <CardHeader>
                  <CardTitle>Frequently Asked Questions</CardTitle>
                  <CardDescription>Common questions and answers about JuPedSim Web.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="faq-1">
                      <AccordionTrigger>What is the difference between the simulation models?</AccordionTrigger>
                      <AccordionContent>
                        <p>JuPedSim offers several simulation models with different characteristics:</p>
                        <ul className="list-disc pl-6 space-y-2">
                          <li>
                            <strong>Collision Free Speed Model</strong>: A speed-based model that avoids collisions by
                            adjusting agent velocities. It's computationally efficient and works well for normal
                            pedestrian flow.
                          </li>
                          <li>
                            <strong>Collision Free Speed Model V2</strong>: An improved version with better acceleration
                            and deceleration behavior, creating more realistic movement patterns.
                          </li>
                          <li>
                            <strong>Generalized Centrifugal Force Model</strong>: A force-based model that simulates
                            repulsive forces between agents and obstacles. It's particularly effective for high-density
                            situations.
                          </li>
                          <li>
                            <strong>Social Force Model</strong>: A model based on social forces between pedestrians,
                            considering psychological factors like personal space preferences.
                          </li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="faq-2">
                      <AccordionTrigger>How do I save my simulation?</AccordionTrigger>
                      <AccordionContent>
                        <p>
                          JuPedSim Web automatically saves your simulation as you work. You can also manually save your
                          simulation by clicking the "Save" button in the top navigation bar. To load a saved
                          simulation, go to the "Saved Simulations" page and select the simulation you want to load.
                        </p>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="faq-3">
                      <AccordionTrigger>Can I export simulation results?</AccordionTrigger>
                      <AccordionContent>
                        <p>Yes, you can export simulation results in various formats:</p>
                        <ul className="list-disc pl-6 space-y-2">
                          <li>
                            <strong>CSV</strong>: Export raw data for further analysis in spreadsheet software.
                          </li>
                          <li>
                            <strong>JSON</strong>: Export structured data for use in other applications.
                          </li>
                          <li>
                            <strong>PNG/SVG</strong>: Export visualizations as images.
                          </li>
                          <li>
                            <strong>MP4</strong>: Export animations of the simulation.
                          </li>
                        </ul>
                        <p>
                          To export results, run a simulation and then click the "Export" button in the simulation
                          controls.
                        </p>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="faq-4">
                      <AccordionTrigger>How accurate are the simulations?</AccordionTrigger>
                      <AccordionContent>
                        <p>
                          JuPedSim is based on well-established pedestrian dynamics models that have been validated
                          against real-world data. The accuracy of simulations depends on several factors:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                          <li>The chosen simulation model</li>
                          <li>The quality of the input geometry</li>
                          <li>The realism of agent parameters</li>
                          <li>The complexity of the scenario</li>
                        </ul>
                        <p>
                          For research purposes, we recommend validating simulation results against empirical data
                          whenever possible.
                        </p>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="faq-5">
                      <AccordionTrigger>Can I use JuPedSim Web offline?</AccordionTrigger>
                      <AccordionContent>
                        <p>
                          JuPedSim Web requires an internet connection to access the web interface. However, the core
                          JuPedSim library can be installed locally and used offline through its Python API. Visit the{" "}
                          <a
                            href="https://www.jupedsim.org/"
                            className="text-blue-500 hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            JuPedSim website
                          </a>{" "}
                          for more information on the Python package.
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="api">
              <Card>
                <CardHeader>
                  <CardTitle>API Documentation</CardTitle>
                  <CardDescription>Technical documentation for developers.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold flex items-center">
                      <Code className="mr-2 h-5 w-5 text-purple-500" />
                      REST API Endpoints
                    </h3>
                    <p>
                      JuPedSim Web provides a REST API for programmatic access to simulations. The base URL for all API
                      endpoints is:
                    </p>
                    <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                      {process.env.BACKEND_URL || "http://localhost:8000"}/api
                    </pre>

                    <h4 className="font-semibold mt-4">Available Endpoints:</h4>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>
                        <code>/api/health</code> - Check if the API is running
                      </li>
                      <li>
                        <code>/api/models</code> - Get available simulation models
                      </li>
                      <li>
                        <code>/api/simulate</code> - Run a simulation
                      </li>
                      <li>
                        <code>/api/simulations</code> - List saved simulations
                      </li>
                      <li>
                        <code>/api/simulations/{"{id}"}</code> - Get, update, or delete a specific simulation
                      </li>
                    </ul>

                    <h3 className="text-xl font-semibold flex items-center mt-6">
                      <Code className="mr-2 h-5 w-5 text-purple-500" />
                      Python API
                    </h3>
                    <p>JuPedSim also provides a Python API for more advanced usage. Here's a simple example:</p>
                    <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                      {`import jupedsim as jps

# Create a simulation
simulation = jps.Simulation(
    geometry_file="geometry.xml",
    trajectory_file="trajectory.xml",
    model_name="CollisionFreeSpeedModel",
    dt=0.05
)

# Add agents
simulation.add_agent(
    position=(10, 10),
    destination=(90, 90),
    v0=1.4,
    radius=0.3
)

# Run simulation
for i in range(100):
    simulation.step()
    
# Get results
results = simulation.get_agent_states()`}
                    </pre>

                    <p className="mt-4">
                      For more information on the Python API, visit the{" "}
                      <a
                        href="https://www.jupedsim.org/"
                        className="text-blue-500 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        JuPedSim documentation
                      </a>
                      .
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        <AlertNotification />
      </div>
    </SimulationProvider>
  )
}
