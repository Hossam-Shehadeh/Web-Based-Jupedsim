"use client"

import { useCallback, useEffect, useState } from "react"
import { useSimulationContext } from "@/components/SimulationContext"
import type { Agent, Point, SimulationConfig } from "@/types/simulationTypes"
import {
  calculateTotalForce,
  updateAgentVelocity,
  determineAgentRoom,
  isPassingThroughDoor,
} from "@/utils/socialForceModel"

// Default simulation configuration
const DEFAULT_CONFIG: SimulationConfig = {
  socialForce: {
    desiredForce: 1.0,
    repulsionForce: 2.0,
    obstacleForce: 10.0,
    doorAttractionForce: 1.5,
  },
  timeLimit: 300, // 5 minutes
  agentDefaults: {
    radius: 10,
    maxSpeed: 50,
  },
}

export const useSimulationLogic = () => {
  const { state, dispatch, setSimulationRunning, setSimulationTime } = useSimulationContext()

  const [config, setConfig] = useState<SimulationConfig>(DEFAULT_CONFIG)
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0)
  const [animationFrameId, setAnimationFrameId] = useState<number | null>(null)

  // Find target position for an agent
  const getTargetPosition = useCallback(
    (agent: Agent): Point | null => {
      if (!agent.route || agent.route.length === 0) return null

      const targetId = agent.route[agent.currentRouteIndex]

      // Check if target is a waypoint
      const waypoint = state.waypoints.find((w) => w.id === targetId)
      if (waypoint) return waypoint.position

      // Check if target is an exit
      const exit = state.exits.find((e) => e.id === targetId)
      if (exit) {
        return {
          x: exit.position.x + exit.size.width / 2,
          y: exit.position.y + exit.size.height / 2,
        }
      }

      // Check if target is a door
      const door = state.doors.find((d) => d.id === targetId)
      if (door) {
        return {
          x: door.position.x + door.size.width / 2,
          y: door.position.y + door.size.height / 2,
        }
      }

      return null
    },
    [state.waypoints, state.exits, state.doors],
  )

  // Check if agent has reached its current target
  const hasReachedTarget = useCallback(
    (agent: Agent, targetPosition: Point): boolean => {
      if (!targetPosition) return false

      const dist = Math.sqrt(
        Math.pow(agent.position.x - targetPosition.x, 2) + Math.pow(agent.position.y - targetPosition.y, 2),
      )

      // Check if target is an exit
      if (agent.currentRouteIndex === agent.route.length - 1) {
        const targetId = agent.route[agent.currentRouteIndex]
        const exit = state.exits.find((e) => e.id === targetId)
        if (exit) {
          // Check if agent is inside exit area
          return (
            agent.position.x >= exit.position.x &&
            agent.position.x <= exit.position.x + exit.size.width &&
            agent.position.y >= exit.position.y &&
            agent.position.y <= exit.position.y + exit.size.height
          )
        }
      }

      // For waypoints and doors, use distance check
      return dist < agent.radius
    },
    [state.exits],
  )

  // Spawn agents from sources
  const spawnAgents = useCallback(
    (currentTime: number) => {
      state.sources.forEach((source) => {
        // Check if source has reached its maximum number of agents
        if (source.spawnedAgents >= source.maxAgents) return

        // Check if it's time to spawn a new agent
        const timeSinceLastSpawn = currentTime - source.lastSpawnTime
        if (timeSinceLastSpawn < 1000 / source.spawnRate) return

        // Create a new agent
        const newAgent: Agent = {
          id: `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          position: {
            x: source.position.x + Math.random() * source.size.width,
            y: source.position.y + Math.random() * source.size.height,
          },
          velocity: { x: 0, y: 0 },
          speed: 0,
          maxSpeed: config.agentDefaults.maxSpeed * (0.8 + Math.random() * 0.4), // Randomize speed a bit
          radius: config.agentDefaults.radius,
          route: source.route || (source.targetId ? [source.targetId] : []),
          currentRouteIndex: 0,
          roomId: determineAgentRoom({ ...newAgent, roomId: undefined }, state.rooms),
          hasReachedExit: false,
        }

        // Update source
        dispatch({
          type: "UPDATE_SOURCE",
          payload: {
            ...source,
            spawnedAgents: source.spawnedAgents + 1,
            lastSpawnTime: currentTime,
          },
        })

        // Add agent to simulation
        dispatch({
          type: "ADD_AGENT",
          payload: newAgent,
        })
      })
    },
    [state.sources, state.rooms, config, dispatch],
  )

  // Update agent positions based on social forces
  const updateAgents = useCallback(
    (deltaTime: number) => {
      const updatedAgents = state.agents.map((agent) => {
        // Skip agents that have reached an exit
        if (agent.hasReachedExit) return agent

        // Get target position
        const targetPosition = getTargetPosition(agent)
        if (!targetPosition) return agent

        // Calculate social forces
        const force = calculateTotalForce(
          agent,
          targetPosition,
          state.agents,
          state.obstacles,
          state.doors,
          state.rooms,
          config,
        )

        // Update velocity
        const newVelocity = updateAgentVelocity(agent, force, deltaTime)

        // Update position
        const newPosition = {
          x: agent.position.x + newVelocity.x * deltaTime,
          y: agent.position.y + newVelocity.y * deltaTime,
        }

        // Calculate new speed
        const newSpeed = Math.sqrt(Math.pow(newVelocity.x, 2) + Math.pow(newVelocity.y, 2))

        // Check if agent has reached its target
        let currentRouteIndex = agent.currentRouteIndex
        let hasReachedExit = agent.hasReachedExit

        if (hasReachedTarget(agent, targetPosition)) {
          // If this is the last target and it's an exit, mark agent as having reached exit
          if (currentRouteIndex === agent.route.length - 1) {
            const targetId = agent.route[currentRouteIndex]
            const exit = state.exits.find((e) => e.id === targetId)
            if (exit) {
              hasReachedExit = true

              // Update exit count
              dispatch({
                type: "UPDATE_EXIT",
                payload: {
                  ...exit,
                  count: exit.count + 1,
                },
              })
            }
          } else {
            // Move to next target in route
            currentRouteIndex++
          }
        }

        // Check if agent is passing through a door
        let roomId = agent.roomId
        for (const door of state.doors) {
          if (door.isOpen && isPassingThroughDoor({ ...agent, position: newPosition }, door)) {
            // Agent is passing through a door, update room
            const currentRoom = state.rooms.find((r) => r.id === roomId)
            if (currentRoom) {
              // Find the other room connected by this door
              const otherRoomId = door.connectingRoomIds.find((id) => id !== roomId)
              if (otherRoomId) {
                roomId = otherRoomId
              }
            }
          }
        }

        // If no room was found through doors, determine room based on position
        if (!roomId) {
          roomId = determineAgentRoom({ ...agent, position: newPosition, roomId: undefined }, state.rooms)
        }

        return {
          ...agent,
          position: newPosition,
          velocity: newVelocity,
          speed: newSpeed,
          currentRouteIndex,
          roomId,
          hasReachedExit,
        }
      })

      // Remove agents that have reached an exit
      const activeAgents = updatedAgents.filter((agent) => !agent.hasReachedExit)

      // Update agents in state
      dispatch({
        type: "SET_AGENTS",
        payload: activeAgents,
      })

      return activeAgents.length
    },
    [
      state.agents,
      state.obstacles,
      state.doors,
      state.rooms,
      state.exits,
      config,
      getTargetPosition,
      hasReachedTarget,
      dispatch,
    ],
  )

  // Check if simulation should end
  const checkSimulationEnd = useCallback(
    (activeAgentCount: number, elapsedTime: number) => {
      // End simulation if all agents have reached exits
      if (activeAgentCount === 0 && state.sources.every((s) => s.spawnedAgents >= s.maxAgents)) {
        setSimulationRunning(false)
        return true
      }

      // End simulation if time limit is reached
      if (elapsedTime >= config.timeLimit * 1000) {
        setSimulationRunning(false)
        return true
      }

      return false
    },
    [state.sources, config.timeLimit, setSimulationRunning],
  )

  // Main simulation loop
  const simulationLoop = useCallback(
    (timestamp: number) => {
      if (!state.simulationRunning) return

      // Calculate time delta
      const deltaTime = lastUpdateTime === 0 ? 0 : (timestamp - lastUpdateTime) / 1000
      setLastUpdateTime(timestamp)

      // Skip first frame to initialize lastUpdateTime
      if (deltaTime === 0) {
        setAnimationFrameId(requestAnimationFrame(simulationLoop))
        return
      }

      // Apply simulation speed
      const scaledDeltaTime = deltaTime * state.simulationSpeed

      // Update simulation time
      const newSimulationTime = state.simulationTime + scaledDeltaTime
      setSimulationTime(newSimulationTime)

      // Spawn new agents
      spawnAgents(timestamp)

      // Update agent positions
      const activeAgentCount = updateAgents(scaledDeltaTime)

      // Check if simulation should end
      const shouldEnd = checkSimulationEnd(activeAgentCount, newSimulationTime)

      // Continue simulation loop if not ended
      if (!shouldEnd) {
        setAnimationFrameId(requestAnimationFrame(simulationLoop))
      }
    },
    [
      state.simulationRunning,
      state.simulationSpeed,
      state.simulationTime,
      lastUpdateTime,
      spawnAgents,
      updateAgents,
      checkSimulationEnd,
      setSimulationTime,
    ],
  )

  // Start simulation
  useEffect(() => {
    if (state.simulationRunning && !animationFrameId) {
      // Reset simulation time if starting from beginning
      if (state.simulationTime === 0) {
        // Reset exit counts
        state.exits.forEach((exit) => {
          dispatch({
            type: "UPDATE_EXIT",
            payload: {
              ...exit,
              count: 0,
            },
          })
        })

        // Reset source spawn counts
        state.sources.forEach((source) => {
          dispatch({
            type: "UPDATE_SOURCE",
            payload: {
              ...source,
              spawnedAgents: 0,
              lastSpawnTime: 0,
            },
          })
        })
      }

      setLastUpdateTime(0)
      setAnimationFrameId(requestAnimationFrame(simulationLoop))
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
        setAnimationFrameId(null)
      }
    }
  }, [
    state.simulationRunning,
    state.simulationTime,
    state.exits,
    state.sources,
    animationFrameId,
    simulationLoop,
    dispatch,
  ])

  // Update config
  const updateConfig = useCallback((newConfig: Partial<SimulationConfig>) => {
    setConfig((prevConfig) => ({
      ...prevConfig,
      ...newConfig,
    }))
  }, [])

  return {
    config,
    updateConfig,
  }
}
