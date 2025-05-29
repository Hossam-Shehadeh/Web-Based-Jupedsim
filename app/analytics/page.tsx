"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SimulationProvider } from "@/components/simulation-context"
import { AlertNotification } from "@/components/alert-notification"
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts"

// Mock data for charts
const densityData = [
  { time: 0, density: 0.1 },
  { time: 5, density: 0.3 },
  { time: 10, density: 0.7 },
  { time: 15, density: 1.2 },
  { time: 20, density: 1.8 },
  { time: 25, density: 2.1 },
  { time: 30, density: 1.5 },
  { time: 35, density: 0.9 },
  { time: 40, density: 0.4 },
  { time: 45, density: 0.2 },
  { time: 50, density: 0.1 },
]

const velocityData = [
  { time: 0, velocity: 1.5 },
  { time: 5, velocity: 1.4 },
  { time: 10, velocity: 1.2 },
  { time: 15, velocity: 0.9 },
  { time: 20, velocity: 0.7 },
  { time: 25, velocity: 0.5 },
  { time: 30, velocity: 0.8 },
  { time: 35, velocity: 1.1 },
  { time: 40, velocity: 1.3 },
  { time: 45, velocity: 1.4 },
  { time: 50, velocity: 1.5 },
]

const evacuationData = [
  { time: 0, evacuated: 0 },
  { time: 5, evacuated: 5 },
  { time: 10, evacuated: 15 },
  { time: 15, evacuated: 30 },
  { time: 20, evacuated: 50 },
  { time: 25, evacuated: 75 },
  { time: 30, evacuated: 90 },
  { time: 35, evacuated: 95 },
  { time: 40, evacuated: 98 },
  { time: 45, evacuated: 99 },
  { time: 50, evacuated: 100 },
]

const bottleneckData = [
  { name: "Entrance", value: 120 },
  { name: "Bottleneck", value: 60 },
  { name: "Exit", value: 100 },
]

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"]

export default function AnalyticsPage() {
  const [simulationId, setSimulationId] = useState("latest")

  return (
    <SimulationProvider>
      <div className="flex h-screen flex-col">
        <Navbar />
        <div className="flex-1 overflow-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Simulation Analytics</h1>
            <p className="text-muted-foreground">Analyze the results of your pedestrian dynamics simulations.</p>
          </div>

          <Tabs defaultValue="overview">
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="density">Density</TabsTrigger>
              <TabsTrigger value="velocity">Velocity</TabsTrigger>
              <TabsTrigger value="evacuation">Evacuation</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Density Over Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={densityData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" label={{ value: "Time (s)", position: "insideBottom", offset: -5 }} />
                        <YAxis label={{ value: "Density (ped/m²)", angle: -90, position: "insideLeft" }} />
                        <Tooltip />
                        <Legend />
                        <Area type="monotone" dataKey="density" stroke="#8884d8" fill="#8884d8" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Velocity Over Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={velocityData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" label={{ value: "Time (s)", position: "insideBottom", offset: -5 }} />
                        <YAxis label={{ value: "Velocity (m/s)", angle: -90, position: "insideLeft" }} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="velocity" stroke="#82ca9d" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Evacuation Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={evacuationData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" label={{ value: "Time (s)", position: "insideBottom", offset: -5 }} />
                        <YAxis label={{ value: "Evacuated (%)", angle: -90, position: "insideLeft" }} />
                        <Tooltip />
                        <Legend />
                        <Area type="monotone" dataKey="evacuated" stroke="#ffc658" fill="#ffc658" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Flow Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={bottleneckData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {bottleneckData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="density">
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Density Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={densityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" label={{ value: "Time (s)", position: "insideBottom", offset: -5 }} />
                      <YAxis label={{ value: "Density (ped/m²)", angle: -90, position: "insideLeft" }} />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="density" stroke="#8884d8" fill="#8884d8" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="velocity">
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Velocity Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={velocityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" label={{ value: "Time (s)", position: "insideBottom", offset: -5 }} />
                      <YAxis label={{ value: "Velocity (m/s)", angle: -90, position: "insideLeft" }} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="velocity" stroke="#82ca9d" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="evacuation">
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Evacuation Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={evacuationData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" label={{ value: "Time (s)", position: "insideBottom", offset: -5 }} />
                      <YAxis label={{ value: "Evacuated (%)", angle: -90, position: "insideLeft" }} />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="evacuated" stroke="#ffc658" fill="#ffc658" />
                    </AreaChart>
                  </ResponsiveContainer>
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
