import { NextResponse } from "next/server"
import { getSimulationModels } from "@/utils/simulation-api"

export async function GET() {
  try {
    const models = await getSimulationModels()

    return NextResponse.json({ models })
  } catch (error) {
    console.error("Models fetch error:", error)

    // Return default models if backend is not available
    return NextResponse.json({
      models: [
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
        { id: "4", name: "SocialForceModel", description: "A model based on social forces between pedestrians" },
      ],
      warning: "Using default models due to backend connection failure",
    })
  }
}
