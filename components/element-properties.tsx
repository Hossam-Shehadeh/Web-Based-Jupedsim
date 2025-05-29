"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useSimulationContext } from "@/components/SimulationContext"

export const ElementProperties: React.FC = () => {
  const { state, dispatch } = useSimulationContext();
  const { selectedElement } = state;
  
  const [properties, setProperties] = useState<Record<string, any>>({});
  
  useEffect(() => {
    if (!selectedElement) {
      setProperties({});
      return;
    }
    
    const { type, id } = selectedElement;
    let element;
    
    switch (type) {
      case 'agent':
        element = state.agents.find(a => a.id === id);
        if (element) {
          setProperties({
            position: element.position,
            velocity: element.velocity,
            speed: element.speed,
            maxSpeed: element.maxSpeed,
            radius: element.radius,
            targetId: element.targetId,
            route: element.route,
            currentRouteIndex: element.currentRouteIndex,
            roomId: element.roomId
          });
        }
        break;
        
      case 'source':
        element = state.sources.find(s => s.id === id);
        if (element) {
          setProperties({
            position: element.position,
            size: element.size,
            spawnRate: element.spawnRate,
            maxAgents: element.maxAgents,
            spawnedAgents: element.spawnedAgents,
            targetId: element.targetId,
            route: element.route
          });
        }
        break;
        
      case 'exit':
        element = state.exits.find(e => e.id === id);
        if (element) {
          setProperties({
            position: element.position,
            size: element.size,
            count: element.count
          });
        }
        break;
        
      case 'obstacle':
        element = state.obstacles.find(o => o.id === id);
        if (element) {
          setProperties({
            position: element.position,
            size: element.size
          });
        }
        break;
        
      case 'waypoint':
        element = state.waypoints.find(w => w.id === id);
        if (element) {
          setProperties({
            position: element.position,
            radius: element.radius,
            connections: element.connections,
            isBidirectional: element.isBidirectional
          });
        }
        break;
        
      case 'room':
        element = state.rooms.find(r => r.id === id);
        if (element) {
          setProperties({
            position: element.position,
            size: element.size,
            doorIds: element.doorIds
          });
        }
        break;
        
      case 'door':
        element = state.doors.find(d => d.id === id);
        if (element) {
          setProperties({
            position: element.position,
            size: element.size,
            connectingRoomIds: element.connectingRoomIds,
            isOpen: element.isOpen
          });
        }
        break;
        
      default:
        setProperties({});
    }
  }, [selectedElement, state]);
  
  const handlePropertyChange = (key: string, value: any) => {
    setProperties(prev => ({
      ...\
