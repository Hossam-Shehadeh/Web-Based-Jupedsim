import { type NextRequest, NextResponse } from "next/server"

// Get the backend URL from environment variables
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Prepare the simulation data for the backend
    const simulationData = {
      agents: data.agents || [],
      waypoints: data.waypoints || [],
      obstacles: data.obstacles || [],
      steps: data.steps || 100,
    }

    console.log(`Sending simulation request to backend: ${BACKEND_URL}/simulate`)

    // Send the simulation data to the JuPedSim backend
    const response = await fetch(`${BACKEND_URL}/simulate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(simulationData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Backend simulation error: ${response.status} - ${errorText}`)
      return NextResponse.json(
        { error: `Backend simulation error: ${response.status} - ${errorText}` },
        { status: response.status },
      )
    }

    // Get the simulation results from the backend
    const simulationResults = await response.json()

    // Return the simulation results
    return NextResponse.json(simulationResults)
  } catch (error) {
    console.error("Simulation API error:", error)
    return NextResponse.json(
      { error: `Simulation API error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    )
  }
}
