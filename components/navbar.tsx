"use client"
import { useSimulation } from "./SimulationContext"
import { Button } from "@/components/ui/button"
import { Play, Pause, Loader2, Wifi, WifiOff, Sun, Moon } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { ModelInfoButton } from "./model-info"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { useTheme } from "next-themes"

export function Navbar() {
  const {
    isSimulationRunning,
    runSimulation,
    simulationModels,
    selectedModel,
    setSelectedModel,
    error,
    setError,
    simulationTime,
    setSimulationTime,
    simulationSpeed,
    setSimulationSpeed,
    isLoading,
    backendAvailable,
    stopSimulation,
  } = useSimulation()

  const { theme, setTheme } = useTheme()

  const handleRunSimulation = () => {
    if (isSimulationRunning) {
      stopSimulation()
    } else {
      runSimulation().catch((error) => {
        console.error("Simulation error:", error)
        setError(`Failed to run simulation: ${error instanceof Error ? error.message : String(error)}`)
      })
    }
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white/80 dark:bg-gray-800/80 px-6 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <img
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-e7swAZW8WlZ6odeXFQ4C7Dinsgfbbq.png"
          alt="Jupedsim Logo"
          className="h-8 w-auto"
        />
        <h1 className="text-xl font-semibold">JuPedSim Web</h1>
        <div className="ml-4">
          <ModelInfoButton />
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant={backendAvailable ? "outline" : "secondary"}
                className={`ml-2 ${backendAvailable ? "bg-green-50 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800" : "bg-yellow-50 text-yellow-800 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800"}`}
              >
                {backendAvailable ? (
                  <>
                    <Wifi className="h-3 w-3 mr-1" /> Backend Connected
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 mr-1" /> Demo Mode
                  </>
                )}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              {backendAvailable ? "Connected to JuPedSim backend server" : "Backend unavailable - running in demo mode"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="flex items-center gap-4">
        <Select
          value={selectedModel?.id}
          onValueChange={(value) => {
            const model = simulationModels.find((m) => m.id === value)
            if (model) setSelectedModel(model)
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent>
            {simulationModels.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                {model.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={simulationTime}
            onChange={(e) => setSimulationTime(Number(e.target.value))}
            className="w-24"
            min={1}
            max={60}
          />
          <span className="text-sm">seconds</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm whitespace-nowrap">Speed:</span>
          <Slider
            value={[simulationSpeed]}
            min={0.5}
            max={15}
            step={0.5}
            className="w-24"
            onValueChange={(value) => setSimulationSpeed(value[0])}
          />
          <span className="text-sm">{simulationSpeed.toFixed(1)}</span>
        </div>
        <Button
          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
          onClick={handleRunSimulation}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Simulation...
            </>
          ) : isSimulationRunning ? (
            <>
              <Pause className="mr-2 h-4 w-4" />
              Stop Simulation
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Run Simulation
            </>
          )}
        </Button>

        {/* Theme toggle button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="ml-2"
              >
                {theme === "dark" ? (
                  <Sun className="h-[1.2rem] w-[1.2rem]" />
                ) : (
                  <Moon className="h-[1.2rem] w-[1.2rem]" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Switch to {theme === "dark" ? "light" : "dark"} mode</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      {error && (
        <Alert variant="destructive" className="absolute top-16 left-0 right-0 z-50">
          <AlertDescription>{error}</AlertDescription>
          <Button variant="ghost" size="sm" onClick={() => setError(null)} className="absolute right-2 top-2">
            Dismiss
          </Button>
        </Alert>
      )}
    </header>
  )
}
