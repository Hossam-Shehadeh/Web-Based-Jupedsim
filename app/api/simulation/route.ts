import { type NextRequest, NextResponse } from "next/server"
import { generateMockSimulationFrames } from "./mock-data"

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json()

    // Forward the request to the backend
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000"

    // Add error handling and timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout for simulations

    try {
      const response = await fetch(`${backendUrl}/api/simulate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Check if the response is OK
      if (!response.ok) {
        let errorData
        try {
          errorData = await response.json()
        } catch (e) {
          errorData = { detail: await response.text() }
        }

        console.warn(`Backend simulation failed with status: ${response.status}`, errorData)

        // Generate mock simulation data as fallback
        const mockFrames = generateMockSimulationFrames(body.elements, body.simulationTime, body.timeStep || 0.05)

        // Return a response with mock data
        return NextResponse.json({
          frames: mockFrames,
          metadata: {
            simulationTime: body.simulationTime,
            timeStep: body.timeStep || 0.05,
            modelName: body.selectedModel,
            agentCount: mockFrames[0]?.agents.length || 0,
            isMockData: true,
          },
          warning: "Using mock data due to backend error",
        })
      }

      // Return the response from the backend
      const data = await response.json()
      return NextResponse.json(data)
    } catch (fetchError) {
      console.warn(`Backend fetch error: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`)

      // Generate mock simulation data as fallback
      const mockFrames = generateMockSimulationFrames(body.elements, body.simulationTime, body.timeStep || 0.05)

      // Return a response with mock data
      return NextResponse.json({
        frames: mockFrames,
        metadata: {
          simulationTime: body.simulationTime,
          timeStep: body.timeStep || 0.05,
          modelName: body.selectedModel,
          agentCount: mockFrames[0]?.agents.length || 0,
          isMockData: true,
        },
        warning: "Using mock data due to backend connection failure",
      })
    }
  } catch (error) {
    console.error("Error in simulation API route:", error)
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
