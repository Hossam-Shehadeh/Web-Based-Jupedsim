import { NextResponse } from "next/server"
import { getJuPedSimInfo } from "@/utils/simulation-api"

export async function GET() {
  try {
    const info = await getJuPedSimInfo()

    return NextResponse.json(info)
  } catch (error) {
    console.error("JuPedSim info error:", error)

    return NextResponse.json(
      {
        available: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
