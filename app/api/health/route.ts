import { NextResponse } from "next/server"
import { checkBackendHealth } from "@/utils/simulation-api"

export async function GET() {
  try {
    const health = await checkBackendHealth()

    return NextResponse.json({
      status: "ok",
      backendAvailable: health.available,
      backendVersion: health.version,
    })
  } catch (error) {
    console.error("Health check error:", error)

    return NextResponse.json(
      {
        status: "error",
        backendAvailable: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
