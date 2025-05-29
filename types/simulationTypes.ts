export type Point = {
  x: number
  y: number
}

export type ElementType =
  | "STREET_LINE"
  | "FREE_LINE"
  | "START_POINT"
  | "SOURCE_RECTANGLE"
  | "OBSTACLE"
  | "EXIT_POINT"
  | "WAYPOINT"
  | "ROOM"
  | "DOOR"

export interface Element {
  id: string
  type: ElementType
  points: Point[]
  properties?: any
}

export interface SimulationModel {
  id: string
  name: string
  description?: string
}

export interface SimulationFrame {
  time: number
  agents: Agent[]
}

export interface SocialForceParameters {
  desiredSpeed: number
  relaxationTime: number
  repulsionStrength: number
  repulsionRange: number
  attractionStrength: number
  obstacleRepulsionStrength: number
  obstacleRepulsionRange: number
  randomForce: number
}

export interface Agent {
  id: string
  position: Point
  radius: number
  velocity: Point
  speed: number
  targetId?: string
  route: string[]
  currentRouteIndex: number
  roomId?: string
  hasReachedExit: boolean
}

export interface Door {
  id: string
  position: Point
  size: { width: number; height: number }
  connectingRoomIds: string[]
  isOpen: boolean
}

export interface Room {
  id: string
  position: Point
  size: { width: number; height: number }
  doorIds: string[]
}

export interface SimulationConfig {
  socialForce: {
    desiredForce: number
    repulsionForce: number
    obstacleForce: number
    doorAttractionForce: number
  }
  timeLimit: number
  agentDefaults: {
    radius: number
    maxSpeed: number
  }
}

export interface RoomGraph {
  rooms: Map<string, Element>
  doors: Map<string, Element>
  connections: Map<string, string[]>
}
