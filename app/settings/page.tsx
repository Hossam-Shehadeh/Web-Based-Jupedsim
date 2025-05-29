"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SimulationProvider } from "@/components/simulation-context"
import { AlertNotification } from "@/components/alert-notification"
import { useTheme } from "next-themes"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Sun, Moon, Monitor, Save, RotateCcw, Trash2 } from "lucide-react"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [gridSize, setGridSize] = useState(20)
  const [autoSave, setAutoSave] = useState(true)
  const [showTutorial, setShowTutorial] = useState(true)
  const [defaultModel, setDefaultModel] = useState("CollisionFreeSpeedModel")
  const [defaultSpeed, setDefaultSpeed] = useState(1.4)

  const handleResetSettings = () => {
    setGridSize(20)
    setAutoSave(true)
    setShowTutorial(true)
    setDefaultModel("CollisionFreeSpeedModel")
    setDefaultSpeed(1.4)
    setTheme("system")
  }

  const handleClearData = () => {
    // In a real app, this would clear all user data
    localStorage.clear()
    window.location.reload()
  }

  return (
    <SimulationProvider>
      <div className="flex h-screen flex-col">
        <Navbar />
        <div className="flex-1 overflow-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Customize your JuPedSim Web experience.</p>
          </div>

          <Tabs defaultValue="appearance">
            <TabsList className="mb-6">
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="simulation">Simulation</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="appearance">
              <Card>
                <CardHeader>
                  <CardTitle>Appearance Settings</CardTitle>
                  <CardDescription>Customize how JuPedSim Web looks and feels.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Theme</Label>
                    <div className="flex space-x-4">
                      <Button
                        variant={theme === "light" ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => setTheme("light")}
                      >
                        <Sun className="mr-2 h-4 w-4" />
                        Light
                      </Button>
                      <Button
                        variant={theme === "dark" ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => setTheme("dark")}
                      >
                        <Moon className="mr-2 h-4 w-4" />
                        Dark
                      </Button>
                      <Button
                        variant={theme === "system" ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => setTheme("system")}
                      >
                        <Monitor className="mr-2 h-4 w-4" />
                        System
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="grid-size">Grid Size</Label>
                    <div className="flex items-center space-x-4">
                      <Slider
                        id="grid-size"
                        min={10}
                        max={50}
                        step={5}
                        value={[gridSize]}
                        onValueChange={(value) => setGridSize(value[0])}
                        className="flex-1"
                      />
                      <span className="w-12 text-center">{gridSize}px</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-tutorial">Show Tutorial</Label>
                    <Switch id="show-tutorial" checked={showTutorial} onCheckedChange={setShowTutorial} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="simulation">
              <Card>
                <CardHeader>
                  <CardTitle>Simulation Settings</CardTitle>
                  <CardDescription>Configure default simulation parameters.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="default-model">Default Simulation Model</Label>
                    <Select value={defaultModel} onValueChange={setDefaultModel}>
                      <SelectTrigger id="default-model">
                        <SelectValue placeholder="Select a model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CollisionFreeSpeedModel">Collision Free Speed Model</SelectItem>
                        <SelectItem value="CollisionFreeSpeedModelV2">Collision Free Speed Model V2</SelectItem>
                        <SelectItem value="GeneralizedCentrifugalForceModel">
                          Generalized Centrifugal Force Model
                        </SelectItem>
                        <SelectItem value="SocialForceModel">Social Force Model</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="default-speed">Default Simulation Speed (m/s)</Label>
                    <div className="flex items-center space-x-4">
                      <Slider
                        id="default-speed"
                        min={0.5}
                        max={3}
                        step={0.1}
                        value={[defaultSpeed]}
                        onValueChange={(value) => setDefaultSpeed(value[0])}
                        className="flex-1"
                      />
                      <span className="w-12 text-center">{defaultSpeed.toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-save">Auto-save Simulations</Label>
                    <Switch id="auto-save" checked={autoSave} onCheckedChange={setAutoSave} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>Manage your account and personal information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" placeholder="Your name" defaultValue="Guest User" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="Your email" defaultValue="guest@example.com" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="organization">Organization</Label>
                    <Input id="organization" placeholder="Your organization" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">
                    <Save className="mr-2 h-4 w-4" />
                    Save Account Settings
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="advanced">
              <Card>
                <CardHeader>
                  <CardTitle>Advanced Settings</CardTitle>
                  <CardDescription>Advanced options for JuPedSim Web.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="backend-url">Backend URL</Label>
                    <Input id="backend-url" defaultValue={process.env.BACKEND_URL || "http://localhost:8000"} />
                  </div>

                  <div className="space-y-2">
                    <Label>Reset Settings</Label>
                    <Button variant="outline" className="w-full" onClick={handleResetSettings}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Reset to Default Settings
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Clear Data</Label>
                    <Button variant="destructive" className="w-full" onClick={handleClearData}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Clear All Data
                    </Button>
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
