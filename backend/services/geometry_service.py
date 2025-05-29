import logging
from typing import List, Dict, Any, Optional
import math

from models.simulation import Element, Point

logger = logging.getLogger("geometry-service")

class GeometryService:
    """
    Service for processing and validating geometry data for simulations.
    """
    
    def validate_geometry(self, elements: List[Element]) -> None:
        """
        Validate geometry data for simulation.
        
        Args:
            elements: List of geometry elements
            
        Raises:
            ValueError: If geometry is invalid
        """
        # Check if there are any elements
        if not elements:
            raise ValueError("No geometry elements provided")
        
        # Check for required elements
        has_source = False
        has_exit = False
        has_walkable_area = False
        
        for element in elements:
            if element.type in ["SOURCE_RECTANGLE", "START_POINT"]:
                has_source = True
            elif element.type == "EXIT_POINT":
                has_exit = True
            elif element.type in ["STREET_LINE", "FREE_LINE", "ROOM"]:
                has_walkable_area = True
        
        # Validate that we have at least one source and exit
        if not has_source:
            logger.warning("No source elements found in geometry")
        
        if not has_exit:
            logger.warning("No exit points found in geometry")
        
        if not has_walkable_area:
            logger.warning("No walkable areas found in geometry")
    
    def process_geometry(self, elements: List[Element]) -> Dict[str, Any]:
        """
        Process geometry data into a format suitable for simulation.
        
        Args:
            elements: List of geometry elements
            
        Returns:
            Processed geometry data
        """
        logger.info(f"Processing {len(elements)} geometry elements")
        
        # Categorize elements
        walkable_areas = []
        obstacles = []
        start_points = []
        sources = []
        exit_points = []
        waypoints = []
        rooms = []
        doors = []
        
        for element in elements:
            if element.type in ["STREET_LINE", "FREE_LINE"]:
                walkable_areas.append(self._process_walkable_area(element))
            elif element.type == "OBSTACLE":
                obstacles.append(self._process_obstacle(element))
            elif element.type == "START_POINT":
                start_points.append(self._process_start_point(element))
            elif element.type == "SOURCE_RECTANGLE":
                sources.append(self._process_source(element))
            elif element.type == "EXIT_POINT":
                exit_points.append(self._process_exit_point(element))
            elif element.type == "WAYPOINT":
                waypoints.append(self._process_waypoint(element))
            elif element.type == "ROOM":
                rooms.append(self._process_room(element))
            elif element.type == "DOOR":
                doors.append(self._process_door(element))
        
        # Return processed geometry
        return {
            "walkableAreas": walkable_areas,
            "obstacles": obstacles,
            "startPoints": start_points,
            "sources": sources,
            "exitPoints": exit_points,
            "waypoints": waypoints,
            "rooms": rooms,
            "doors": doors
        }
    
    def _process_walkable_area(self, element: Element) -> Dict[str, Any]:
        """Process a walkable area element."""
        return {
            "id": element.id,
            "type": element.type,
            "points": element.points
        }
    
    def _process_obstacle(self, element: Element) -> Dict[str, Any]:
        """Process an obstacle element."""
        return {
            "id": element.id,
            "type": element.type,
            "points": element.points
        }
    
    def _process_start_point(self, element: Element) -> Dict[str, Any]:
        """Process a start point element."""
        return {
            "id": element.id,
            "type": element.type,
            "position": element.points[0] if element.points else {"x": 0, "y": 0}
        }
    
    def _process_source(self, element: Element) -> Dict[str, Any]:
        """Process a source rectangle element."""
        agent_count = element.properties.agentCount if element.properties and element.properties.agentCount else 10
        
        return {
            "id": element.id,
            "type": element.type,
            "rect": element.points[:2] if len(element.points) >= 2 else [{"x": 0, "y": 0}, {"x": 100, "y": 100}],
            "agentCount": agent_count
        }
    
    def _process_exit_point(self, element: Element) -> Dict[str, Any]:
        """Process an exit point element."""
        return {
            "id": element.id,
            "type": element.type,
            "line": element.points[:2] if len(element.points) >= 2 else [{"x": 0, "y": 0}, {"x": 100, "y": 0}]
        }
    
    def _process_waypoint(self, element: Element) -> Dict[str, Any]:
        """Process a waypoint element."""
        connections = element.properties.connections if element.properties and element.properties.connections else []
        
        return {
            "id": element.id,
            "type": element.type,
            "position": element.points[0] if element.points else {"x": 0, "y": 0},
            "connections": connections
        }
    
    def _process_room(self, element: Element) -> Dict[str, Any]:
        """Process a room element."""
        name = element.properties.name if element.properties and hasattr(element.properties, "name") else f"Room {element.id}"
        capacity = element.properties.capacity if element.properties and hasattr(element.properties, "capacity") else 100
        
        return {
            "id": element.id,
            "type": element.type,
            "points": element.points,
            "name": name,
            "capacity": capacity
        }
    
    def _process_door(self, element: Element) -> Dict[str, Any]:
        """Process a door element."""
        room_id = element.properties.roomId if element.properties and hasattr(element.properties, "roomId") else None
        target_room_id = element.properties.targetRoomId if element.properties and hasattr(element.properties, "targetRoomId") else None
        
        return {
            "id": element.id,
            "type": element.type,
            "points": element.points,
            "roomId": room_id,
            "targetRoomId": target_room_id
        }
    
    def calculate_distance(self, p1: Point, p2: Point) -> float:
        """Calculate Euclidean distance between two points."""
        return math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2)
    
    def is_point_in_polygon(self, point: Point, polygon: List[Point]) -> bool:
        """Check if a point is inside a polygon using ray casting algorithm."""
        if len(polygon) < 3:
            return False
        
        inside = False
        j = len(polygon) - 1
        
        for i in range(len(polygon)):
            if ((polygon[i].y > point.y) != (polygon[j].y > point.y)) and \
               (point.x < (polygon[j].x - polygon[i].x) * (point.y - polygon[i].y) / 
                (polygon[j].y - polygon[i].y) + polygon[i].x):
                inside = not inside
            j = i
            
        return inside
    
    def find_room_containing_point(self, point: Point, rooms: List[Element]) -> Optional[Element]:
        """Find the room that contains a point."""
        for room in rooms:
            if self.is_point_in_polygon(point, room.points):
                return room
        return None
    
    def find_nearest_door(self, point: Point, doors: List[Element]) -> Optional[Element]:
        """Find the nearest door to a point."""
        if not doors:
            return None
            
        nearest_door = None
        min_distance = float('inf')
        
        for door in doors:
            if len(door.points) < 2:
                continue
                
            # Calculate door center
            door_center = Point(
                x=(door.points[0].x + door.points[1].x) / 2,
                y=(door.points[0].y + door.points[1].y) / 2
            )
            
            dist = self.calculate_distance(point, door_center)
            if dist < min_distance:
                min_distance = dist
                nearest_door = door
                
        return nearest_door
    
    def find_path_between_rooms(
        self, 
        start_room: Element, 
        end_room: Element, 
        doors: List[Element]
    ) -> List[Tuple[Element, Element]]:
        """
        Find a path between two rooms through doors.
        
        Returns:
            List of (door, room) tuples representing the path
        """
        # Simple BFS to find path
        visited = {start_room.id}
        queue = [(start_room, [])]
        
        while queue:
            current_room, path = queue.pop(0)
            
            # If we've reached the end room, return the path
            if current_room.id == end_room.id:
                return path
            
            # Find doors connected to this room
            connected_doors = [
                door for door in doors 
                if door.properties and (
                    door.properties.roomId == current_room.id or 
                    door.properties.targetRoomId == current_room.id
                )
            ]
            
            for door in connected_doors:
                # Find the room on the other side of the door
                other_room_id = None
                if door.properties.roomId == current_room.id:
                    other_room_id = door.properties.targetRoomId
                else:
                    other_room_id = door.properties.roomId
                
                # Skip if no other room or already visited
                if not other_room_id or other_room_id in visited:
                    continue
                    
                # Find the other room
                other_room = next((r for r in [e for e in elements if e.type == "ROOM"] if r.id == other_room_id), None)
                if not other_room:
                    continue
                    
                # Add to visited and queue
                visited.add(other_room_id)
                queue.append((other_room, path + [(door, other_room)]))
        
        # No path found
        return []
