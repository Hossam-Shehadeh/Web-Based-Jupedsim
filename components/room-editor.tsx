"use client"

import type React from "react"
import { useState } from "react"
import { useSimulationContext } from "@/components/SimulationContext"
import type { Room, Door } from "@/types/simulationTypes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface RoomEditorProps {
  onClose: () => void
}

export const RoomEditor: React.FC<RoomEditorProps> = ({ onClose }) => {
  const { state, dispatch } = useSimulationContext()
  const [roomName, setRoomName] = useState("")
  const [doorName, setDoorName] = useState("")
  const [selectedRooms, setSelectedRooms] = useState<string[]>([])
  const [doorWidth, setDoorWidth] = useState(30)
  const [doorHeight, setDoorHeight] = useState(10)
  const [doorIsOpen, setDoorIsOpen] = useState(true)

  const handleAddRoom = () => {
    if (!roomName) return

    const newRoom: Room = {
      id: `room-${Date.now()}`,
      position: { x: 100, y: 100 },
      size: { width: 200, height: 200 },
      doorIds: [],
    }

    dispatch({
      type: "ADD_ROOM",
      payload: newRoom,
    })

    setRoomName("")
  }

  const handleAddDoor = () => {
    if (!doorName || selectedRooms.length !== 2) return

    const room1 = state.rooms.find((r) => r.id === selectedRooms[0])
    const room2 = state.rooms.find((r) => r.id === selectedRooms[1])

    if (!room1 || !room2) return

    // Calculate door position (middle of the shared wall)
    const doorPosition = calculateDoorPosition(room1, room2, doorWidth, doorHeight)

    const newDoor: Door = {
      id: `door-${Date.now()}`,
      position: doorPosition,
      size: { width: doorWidth, height: doorHeight },
      connectingRoomIds: [room1.id, room2.id],
      isOpen: doorIsOpen,
    }

    dispatch({
      type: "ADD_DOOR",
      payload: newDoor,
    })

    // Update rooms with new door
    dispatch({
      type: "UPDATE_ROOM",
      payload: {
        ...room1,
        doorIds: [...room1.doorIds, newDoor.id],
      },
    })

    dispatch({
      type: "UPDATE_ROOM",
      payload: {
        ...room2,
        doorIds: [...room2.doorIds, newDoor.id],
      },
    })

    setDoorName("")
    setSelectedRooms([])
  }

  const calculateDoorPosition = (room1: Room, room2: Room, doorWidth: number, doorHeight: number) => {
    // Check if rooms share a horizontal wall
    if (
      room1.position.y <= room2.position.y + room2.size.height &&
      room1.position.y + room1.size.height >= room2.position.y &&
      (room1.position.x + room1.size.width === room2.position.x ||
        room2.position.x + room2.size.width === room1.position.x)
    ) {
      // Horizontal wall
      const sharedY =
        Math.max(room1.position.y, room2.position.y) +
        (Math.min(room1.position.y + room1.size.height, room2.position.y + room2.size.height) -
          Math.max(room1.position.y, room2.position.y)) /
          2

      const x =
        room1.position.x + room1.size.width === room2.position.x
          ? room1.position.x + room1.size.width - doorWidth / 2
          : room2.position.x + room2.size.width - doorWidth / 2

      return { x, y: sharedY - doorHeight / 2 }
    }
    // Check if rooms share a vertical wall
    else if (
      room1.position.x <= room2.position.x + room2.size.width &&
      room1.position.x + room1.size.width >= room2.position.x &&
      (room1.position.y + room1.size.height === room2.position.y ||
        room2.position.y + room2.size.height === room1.position.y)
    ) {
      // Vertical wall
      const sharedX =
        Math.max(room1.position.x, room2.position.x) +
        (Math.min(room1.position.x + room1.size.width, room2.position.x + room2.size.width) -
          Math.max(room1.position.x, room2.position.x)) /
          2

      const y =
        room1.position.y + room1.size.height === room2.position.y
          ? room1.position.y + room1.size.height - doorHeight / 2
          : room2.position.y + room2.size.height - doorHeight / 2

      return { x: sharedX - doorWidth / 2, y }
    }
    // If rooms don't share a wall, place door at midpoint between rooms
    else {
      const room1Center = {
        x: room1.position.x + room1.size.width / 2,
        y: room1.position.y + room1.size.height / 2,
      }

      const room2Center = {
        x: room2.position.x + room2.size.width / 2,
        y: room2.position.y + room2.size.height / 2,
      }

      return {
        x: (room1Center.x + room2Center.x) / 2 - doorWidth / 2,
        y: (room1Center.y + room2Center.y) / 2 - doorHeight / 2,
      }
    }
  }

  const handleRoomSelection = (roomId: string) => {
    if (selectedRooms.includes(roomId)) {
      setSelectedRooms(selectedRooms.filter((id) => id !== roomId))
    } else if (selectedRooms.length < 2) {
      setSelectedRooms([...selectedRooms, roomId])
    }
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Room & Door Editor</h2>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Add Room</h3>
        <div className="flex gap-2 mb-2">
          <Input value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="Room name" />
          <Button onClick={handleAddRoom}>Add Room</Button>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Add Door</h3>
        <div className="grid gap-2 mb-2">
          <Input
            value={doorName}
            onChange={(e) => setDoorName(e.target.value)}
            placeholder="Door name"
            className="mb-2"
          />

          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <Label htmlFor="doorWidth">Width</Label>
              <Input
                id="doorWidth"
                type="number"
                value={doorWidth}
                onChange={(e) => setDoorWidth(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="doorHeight">Height</Label>
              <Input
                id="doorHeight"
                type="number"
                value={doorHeight}
                onChange={(e) => setDoorHeight(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 mb-2">
            <Switch id="doorOpen" checked={doorIsOpen} onCheckedChange={setDoorIsOpen} />
            <Label htmlFor="doorOpen">Door is open</Label>
          </div>

          <div className="mb-2">
            <Label className="mb-1 block">Connect Rooms (select 2)</Label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded p-2">
              {state.rooms.map((room) => (
                <div
                  key={room.id}
                  className={`p-2 border rounded cursor-pointer ${
                    selectedRooms.includes(room.id) ? "bg-blue-100 border-blue-500" : ""
                  }`}
                  onClick={() => handleRoomSelection(room.id)}
                >
                  {room.id}
                </div>
              ))}
            </div>
          </div>

          <Button onClick={handleAddDoor} disabled={selectedRooms.length !== 2 || !doorName}>
            Add Door
          </Button>
        </div>
      </div>

      <Button variant="outline" onClick={onClose} className="w-full">
        Close
      </Button>
    </div>
  )
}

export default RoomEditor
