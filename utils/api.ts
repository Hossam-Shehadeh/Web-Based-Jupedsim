/**
 * API utility functions for making requests to the backend
 */

// Default timeout for API requests in milliseconds
const DEFAULT_TIMEOUT = 10000

/**
 * Make a GET request to the API with timeout and error handling
 */
export async function apiGet<T>(url: string, options: RequestInit = {}, timeout = DEFAULT_TIMEOUT): Promise<T> {
  try {
    // Create an AbortController to handle timeouts
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    // Make the request
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...options.headers,
      },
      signal: controller.signal,
      ...options,
    })

    // Clear the timeout
    clearTimeout(timeoutId)

    // Check if response is JSON
    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error(`Expected JSON response but got ${contentType}`)
    }

    // Parse the response
    const data = await response.json()

    // Check if the response is OK
    if (!response.ok) {
      throw new Error(data.detail || data.error || `API error: ${response.status}`)
    }

    return data as T
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(`Request timed out after ${timeout}ms`)
    }
    throw error
  }
}

/**
 * Make a POST request to the API with timeout and error handling
 */
export async function apiPost<T>(
  url: string,
  body: any,
  options: RequestInit = {},
  timeout = DEFAULT_TIMEOUT,
): Promise<T> {
  try {
    // Create an AbortController to handle timeouts
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    // Make the request
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...options.headers,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
      ...options,
    })

    // Clear the timeout
    clearTimeout(timeoutId)

    // Check if response is JSON
    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error(`Expected JSON response but got ${contentType}`)
    }

    // Parse the response
    const data = await response.json()

    // Check if the response is OK
    if (!response.ok) {
      throw new Error(data.detail || data.error || `API error: ${response.status}`)
    }

    return data as T
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(`Request timed out after ${timeout}ms`)
    }
    throw error
  }
}
