import logging
from typing import List, Dict, Any, Optional, Tuple
import math

from models.simulation import Element, Point

logger = logging.getLogger("geometry-service")

class GeometryService:
    """
    Service for processing and validating geometry data for simulations.
    """
    
    def validate_geometry(self, elements: List[Element]) -> None:
        """
        Validate the geometry data from the frontend.
        
        Args:
            elements: List of elements from the frontend
            
        Raises:
            ValueError: If the geometry is invalid
        """
        # Check if we have necessary elements
        has_walkable_areas = any(el.type in ["STREET_LINE", "FREE_LINE"] for el in elements)
        has_start_points = any(el.type in ["START_POINT", "SOURCE_RECTANGLE"] for el in elements)
        has_exit_points = any(el.type == "EXIT_POINT" for el in elements)
        
        if not has_walkable_areas:
            raise ValueError("No walkable areas defined. Please add street lines or free lines.")
        
        if not has_start_points:
            raise ValueError("No start points or sources defined. Please add at least one start point or source.")
        
        if not has_exit_points:
            raise ValueError("No exit points defined. Please add at least one exit point.")
        
        # Validate individual elements
        for element in elements:
            if element.type in ["STREET_LINE", "FREE_LINE", "OBSTACLE"] and len(element.points) < 2:
                raise ValueError(f"{element.type} must have at least 2 points")
            
            if element.type in ["SOURCE_RECTANGLE", "EXIT_POINT"] and len(element.points) != 2:
                raise ValueError(f"{element.type} must have exactly 2 points")
            
            if element.type == "START_POINT" and len(element.points) != 1:
                raise ValueError("Start point must have exactly 1 point")
            
            if element.type == "WAYPOINT" and len(element.points) != 1:
                raise ValueError("Waypoint must have exactly 1 point")
        
        # Validate that walkable areas form closed polygons
        for element in elements:
            if element.type in ["STREET_LINE", "FREE_LINE"]:
                if len(element.points) < 3:
                    raise ValueError(f"{element.type} must have at least 3 points to form a closed polygon")
                
                # Check if first and last points are the same (closed polygon)
                first_point = element.points[0]
                last_point = element.points[-1]
                
                if abs(first_point.x - last_point.x) > 0.001 or abs(first_point.y - last_point.y) > 0.001:
                    raise ValueError(f"{element.type} must form a closed polygon (first and last points must be the same)")
        
        logger.info(f"Geometry validation passed for {len(elements)} elements")
    
    def process_geometry(self, elements: List[Element]) -> Dict[str, Any]:
        """
        Process the geometry data from the frontend into a format suitable for simulation.
        
        Args:
            elements: List of elements from the frontend
            
        Returns:
            Processed geometry data
        """
        logger.info(f"Processing {len(elements)} elements")
        
        # Extract walkable areas
        walkable_areas = [el for el in elements if el.type in ["STREET_LINE", "FREE_LINE"]]
        
        # Extract obstacles
        obstacles = [el for el in elements if el.type == "OBSTACLE"]
        
        # Extract start points and sources
        start_points = [el for el in elements if el.type == "START_POINT"]
        sources = [el for el in elements if el.type == "SOURCE_RECTANGLE"]
        
        # Extract exit points
        exit_points = [el for el in elements if el.type == "EXIT_POINT"]
        
        # Extract waypoints
        waypoints = [el for el in elements if el.type == "WAYPOINT"]
        
        # Process into simulation-ready format
        processed_geometry = {
            "rooms": self._process_walkable_areas(walkable_areas),
            "obstacles": self._process_obstacles(obstacles),
            "startPoints": self._process_start_points(start_points),
            "sources": self._process_sources(sources),
            "exitPoints": self._process_exit_points(exit_points),
            "waypoints": self._process_waypoints(waypoints, elements)
        }
        
        # Generate agents data
        processed_geometry["agents"] = self._generate_agents(processed_geometry)
        
        return processed_geometry
    
    def _process_walkable_areas(self, walkable_areas: List[Element]) -> List[Dict[str, Any]]:
        """
        Process walkable areas into rooms for JuPedSim.
        """
        rooms = []
        
        for area in walkable_areas:
            rooms.append({
                "id": area.id,
                "type": area.type,
                "polygon": [{"x": p.x, "y": p.y} for p in area.points]
            })
        
        return rooms
    
    def _process_obstacles(self, obstacles: List[Element]) -> List[Dict[str, Any]]:
        """
        Process obstacles for JuPedSim.
        """
        processed_obstacles = []
        
        for obstacle in obstacles:
            # Ensure obstacle forms a closed polygon
            points = [{"x": p.x, "y": p.y} for p in obstacle.points]
            
            # If first and last points are not the same, close the polygon
            if len(points) > 1:
                first_point = points[0]
                last_point = points[-1]
                
                if abs(first_point["x"] - last_point["x"]) > 0.001 or abs(first_point["y"] - last_point["y"]) > 0.001:
                    points.append(first_point)
            
            processed_obstacles.append({
                "id": obstacle.id,
                "polygon": points
            })
        
        return processed_obstacles
    
    def _process_start_points(self, start_points: List[Element]) -> List[Dict[str, Any]]:
        """
        Process start points for JuPedSim.
        """
        processed_start_points = []
        
        for point in start_points:
            if point.points:
                processed_start_points.append({
                    "id": point.id,
                    "position": {"x": point.points[0].x, "y": point.points[0].y}
                })
        
        return processed_start_points
    
    def _process_sources(self, sources: List[Element]) -> List[Dict[str, Any]]:
        """
        Process source rectangles for JuPedSim.
        """
        processed_sources = []
        
        for source in sources:
            if len(source.points) == 2:
                agent_count = source.properties.agentCount if source.properties and source.properties.agentCount else 10
                
                processed_sources.append({
                    "id": source.id,
                    "rect": [
                        {"x": source.points[0].x, "y": source.points[0].y},
                        {"x": source.points[1].x, "y": source.points[1].y}
                    ],
                    "agentCount": agent_count
                })
        
        return processed_sources
    
    def _process_exit_points(self, exit_points: List[Element]) -> List[Dict[str, Any]]:
        """
        Process exit points for JuPedSim.
        """
        processed_exits = []
        
        for exit_point in exit_points:
            if len(exit_point.points) == 2:
                processed_exits.append({
                    "id": exit_point.id,
                    "line": [
                        {"x": exit_point.points[0].x, "y": exit_point.points[0].y},
                        {"x": exit_point.points[1].x, "y": exit_point.points[1].y}
                    ]
                })
        
        return processed_exits
    
    def _process_waypoints(self, waypoints: List[Element], all_elements: List[Element]) -> List[Dict[str, Any]]:
        """
        Process waypoints and their connections.
        """
        processed_waypoints = []
        
        for waypoint in waypoints:
            if waypoint.points:
                connections = []
                
                # Get connections if they exist
                if waypoint.properties and waypoint.properties.connections:
                    for target_id in waypoint.properties.connections:
                        # Find target waypoint
                        target = next((el for el in all_elements if el.id == target_id), None)
                        if target and target.type == "WAYPOINT" and target.points:
                            connections.append({
                                "id": target_id,
                                "position": {"x": target.points[0].x, "y": target.points[0].y}
                            })
                
                processed_waypoints.append({
                    "id": waypoint.id,
                    "position": {"x": waypoint.points[0].x, "y": waypoint.points[0].y},
                    "connections": connections
                })
        
        return processed_waypoints
    
    def _generate_agents(self, geometry: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Generate agent data from start points, sources, and exit points.
        """
        agents = []
        
        # Process start points
        for start_point in geometry["startPoints"]:
            # Find nearest exit
            nearest_exit = self._find_nearest_exit(start_point["position"], geometry["exitPoints"])
            
            agents.append({
                "position": start_point["position"],
                "destination": nearest_exit,
                "radius": 0.3  # Default radius
            })
        
        # Process sources
        for source in geometry["sources"]:
            agent_count = source.get("agentCount", 10)
            
            for i in range(agent_count):
                # Generate random position within source rectangle
                x = self._random_between(
                    min(source["rect"][0]["x"], source["rect"][1]["x"]),
                    max(source["rect"][0]["x"], source["rect"][1]["x"])
                )
                y = self._random_between(
                    min(source["rect"][0]["y"], source["rect"][1]["y"]),
                    max(source["rect"][0]["y"], source["rect"][1]["y"])
                )
                
                # Find nearest exit
                nearest_exit = self._find_nearest_exit({"x": x, "y": y}, geometry["exitPoints"])
                
                agents.append({
                    "position": {"x": x, "y": y},
                    "destination": nearest_exit,
                    "radius": self._random_between(0.25, 0.35)  # Random radius
                })
        
        return agents
    
    def _find_nearest_exit(self, position: Dict[str, float], exits: List[Dict[str, Any]]) -> Dict[str, float]:
        """
        Find the nearest exit point to a given position.
        """
        if not exits:
            return {"x": 400, "y": 300}  # Default if no exits
        
        nearest_exit = None
        min_distance = float('inf')
        
        for exit_point in exits:
            # Calculate midpoint of exit line
            if "line" in exit_point and len(exit_point["line"]) >= 2:
                exit_x = (exit_point["line"][0]["x"] + exit_point["line"][1]["x"]) / 2
                exit_y = (exit_point["line"][0]["y"] + exit_point["line"][1]["y"]) / 2
                
                # Calculate distance
                dx = exit_x - position["x"]
                dy = exit_y - position["y"]
                distance = math.sqrt(dx*dx + dy*dy)
                
                if distance < min_distance:
                    min_distance = distance
                    nearest_exit = {"x": exit_x, "y": exit_y}
        
        return nearest_exit or {"x": exits[0]["line"][0]["x"], "y": exits[0]["line"][0]["y"]}
    
    def _random_between(self, min_val: float, max_val: float) -> float:
        """
        Generate a random float between min_val and max_val.
        """
        import random
        return min_val + random.random() * (max_val - min_val)
