export type ElementType =
  | "STREET_LINE"
  | "FREE_LINE"
  | "START_POINT"
  | "SOURCE_RECTANGLE"
  | "OBSTACLE"
  | "EXIT_POINT"
  | "WAYPOINT"

export type GeometryType = "STREET_LINE" | "FREE_LINE"

export type Point = {
  x: number
  y: number
}

export type Element = {
  id: string
  type: ElementType
  points: Point[]
  properties?: {
    agentCount?: number
    connections?: string[]
    [key: string]: any
  }
}

export type SimulationModel = {
  id: string
  name:
    | "CollisionFreeSpeedModel"
    | "CollisionFreeSpeedModelV2"
    | "GeneralizedCentrifugalForceModel"
    | "SocialForceModel"
  description?: string
}

export type Agent = {
  id: string
  position: Point
  radius: number
  velocity?: Point
}

export type SimulationFrame = {
  time: number
  agents: Agent[]
}
