import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Get the backend URL from environment variables
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000"

    try {
      // Add a timeout to the fetch request
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

      const response = await fetch(`${backendUrl}/api/health`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        console.warn(`Backend returned status ${response.status}`)
        return NextResponse.json(
          { status: "error", message: "Backend is not available", jupedsim_available: false },
          { status: 200 },
        )
      }

      const data = await response.json()
      return NextResponse.json(data)
    } catch (fetchError) {
      console.warn(`Backend fetch error: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`)
      // Return a successful response with error status to prevent cascading errors
      return NextResponse.json(
        { status: "error", message: "Backend is not available", jupedsim_available: false },
        { status: 200 },
      )
    }
  } catch (error) {
    console.error("Error in health API route:", error)
    // Return a successful response with error status
    return NextResponse.json(
      { status: "error", message: "Backend is not available", jupedsim_available: false },
      { status: 200 },
    )
  }
}
