import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Get the backend URL from environment variables
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000"

    try {
      // Add a timeout to the fetch request
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

      const response = await fetch(`${backendUrl}/api/models`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        console.warn(`Backend returned status ${response.status}`)
        // Return default models
        return NextResponse.json({
          models: getDefaultModels(),
        })
      }

      const data = await response.json()
      return NextResponse.json(data)
    } catch (fetchError) {
      console.warn(`Backend fetch error: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`)
      // Return default models
      return NextResponse.json({
        models: getDefaultModels(),
      })
    }
  } catch (error) {
    console.error("Error in models API route:", error)
    // Return default models
    return NextResponse.json({
      models: getDefaultModels(),
    })
  }
}

// Helper function to get default models
function getDefaultModels() {
  return [
    {
      id: "1",
      name: "CollisionFreeSpeedModel",
      description: "A speed model that avoids collisions between agents",
    },
    {
      id: "2",
      name: "CollisionFreeSpeedModelV2",
      description: "An improved version of the Collision Free Speed Model",
    },
    {
      id: "3",
      name: "GeneralizedCentrifugalForceModel",
      description: "A force-based model that simulates repulsive forces between agents",
    },
    {
      id: "4",
      name: "SocialForceModel",
      description: "A model based on social forces between pedestrians",
    },
  ]
}
