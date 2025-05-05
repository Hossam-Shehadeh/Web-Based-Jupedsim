import logging
import numpy as np
import uuid
from typing import List, Dict, Any, Optional, Tuple
import time
import random
import math
from pathlib import Path
import tempfile
import os
import json

# Import JuPedSim if available
try:
    import jupedsim as jps
    JUPEDSIM_AVAILABLE = True
    logging.info(f"JuPedSim version {jps.__version__} loaded successfully")
except ImportError:
    JUPEDSIM_AVAILABLE = False
    logging.warning("JuPedSim not available, using mock implementation")

from models.simulation import (
    SimulationModel,
    SimulationFrame,
    Agent,
    Point,
    SimulationResult
)

logger = logging.getLogger("simulation-service")

class SimulationService:
    """
    Service for running pedestrian dynamics simulations using JuPedSim.
    """
    
    def __init__(self):
        self.available_models = [
            SimulationModel(
                id="1",
                name="CollisionFreeSpeedModel",
                description="A speed model that avoids collisions between agents"
            ),
            SimulationModel(
                id="2",
                name="CollisionFreeSpeedModelV2",
                description="An improved version of the Collision Free Speed Model"
            ),
            SimulationModel(
                id="3",
                name="GeneralizedCentrifugalForceModel",
                description="A force-based model that simulates repulsive forces between agents"
            ),
            SimulationModel(
                id="4",
                name="SocialForceModel",
                description="A model based on social forces between pedestrians"
            ),
            SimulationModel(
                id="5",
                name="AnticipationVelocityModel",
                description="Anticipation Velocity Model (AVM) that predicts and avoids collisions"
            )
        ]
        
        # Set up JuPedSim logging callbacks if available
        if JUPEDSIM_AVAILABLE:
            jps.set_info_callback(lambda msg: logger.info(f"JuPedSim: {msg}"))
            jps.set_warning_callback(lambda msg: logger.warning(f"JuPedSim: {msg}"))
            jps.set_error_callback(lambda msg: logger.error(f"JuPedSim: {msg}"))
            jps.set_debug_callback(lambda msg: logger.debug(f"JuPedSim: {msg}"))
            
            # Log JuPedSim build info
            build_info = jps.get_build_info()
            logger.info(f"JuPedSim build info: version={jps.__version__}, commit={jps.__commit__}, compiler={jps.__compiler__}")
    
    def is_jupedsim_available(self) -> bool:
        """Check if JuPedSim is available."""
        return JUPEDSIM_AVAILABLE
    
    def get_available_models(self) -> List[SimulationModel]:
        """Get available simulation models."""
        return self.available_models
    
    def run_simulation(
        self,
        geometry: Dict[str, Any],
        model_name: str,
        simulation_time: float,
        time_step: float,
        simulation_speed: float
    ) -> SimulationResult:
        """
        Run a pedestrian dynamics simulation.
        
        Args:
            geometry: Processed geometry data
            model_name: Name of the simulation model to use
            simulation_time: Total simulation time in seconds
            time_step: Time step for the simulation in seconds
            simulation_speed: Speed factor for the simulation
            
        Returns:
            SimulationResult object containing frames and metadata
        """
        logger.info(f"Running simulation with model {model_name} for {simulation_time}s")
        
        start_time = time.time()
        
        if JUPEDSIM_AVAILABLE:
            frames = self._run_jupedsim_simulation(
                geometry, model_name, simulation_time, time_step, simulation_speed
            )
        else:
            frames = self._run_mock_simulation(
                geometry, model_name, simulation_time, time_step, simulation_speed
            )
        
        end_time = time.time()
        logger.info(f"Simulation completed in {end_time - start_time:.2f}s")
        
        # Count total agents
        agent_count = len(frames[0].agents) if frames else 0
        
        return SimulationResult(
            frames=frames,
            simulation_time=simulation_time,
            time_step=time_step,
            model_name=model_name,
            agent_count=agent_count
        )
    
    def _create_geometry_from_elements(self, geometry_data: Dict[str, Any]) -> jps.Geometry:
        """
        Create a JuPedSim Geometry object from the processed geometry data.
        
        Args:
            geometry_data: Processed geometry data
            
        Returns:
            JuPedSim Geometry object
        """
        # Create a temporary directory for geometry files
        with tempfile.TemporaryDirectory() as temp_dir:
            # Write geometry to XML file
            geometry_file = Path(temp_dir) / "geometry.xml"
            with open(geometry_file, "w") as f:
                f.write(self._generate_jupedsim_geometry_xml(geometry_data))
            
            # Create JuPedSim Geometry object
            return jps.Geometry(str(geometry_file))
    
    def _create_model(self, model_name: str, geometry: jps.Geometry):
        """
        Create the appropriate JuPedSim model based on the model name.
        
        Args:
            model_name: Name of the model to create
            geometry: JuPedSim Geometry object
            
        Returns:
            JuPedSim model object
        """
        if model_name == "CollisionFreeSpeedModel":
            return jps.CollisionFreeSpeedModel(geometry)
        elif model_name == "CollisionFreeSpeedModelV2":
            return jps.CollisionFreeSpeedModelV2(geometry)
        elif model_name == "GeneralizedCentrifugalForceModel":
            return jps.GeneralizedCentrifugalForceModel(geometry)
        elif model_name == "SocialForceModel":
            return jps.SocialForceModel(geometry)
        elif model_name == "AnticipationVelocityModel":
            return jps.AnticipationVelocityModel(geometry)
        else:
            # Default to CollisionFreeSpeedModel
            logger.warning(f"Unknown model {model_name}, using CollisionFreeSpeedModel")
            return jps.CollisionFreeSpeedModel(geometry)
    
    def _setup_agent_parameters(self, model_name: str, simulation_speed: float):
        """
        Create the appropriate agent parameters based on the model name.
        
        Args:
            model_name: Name of the model
            simulation_speed: Desired speed for agents
            
        Returns:
            JuPedSim agent parameters object
        """
        if model_name == "CollisionFreeSpeedModel":
            params = jps.CollisionFreeSpeedModelAgentParameters()
            params.v0 = simulation_speed
            return params
        elif model_name == "CollisionFreeSpeedModelV2":
            params = jps.CollisionFreeSpeedModelV2AgentParameters()
            params.v0 = simulation_speed
            return params
        elif model_name == "GeneralizedCentrifugalForceModel":
            params = jps.GeneralizedCentrifugalForceModelAgentParameters()
            params.v0 = simulation_speed
            return params
        elif model_name == "SocialForceModel":
            params = jps.SocialForceModelAgentParameters()
            params.v0 = simulation_speed
            return params
        elif model_name == "AnticipationVelocityModel":
            params = jps.AnticipationVelocityModelAgentParameters()
            params.v0 = simulation_speed
            return params
        else:
            # Default to CollisionFreeSpeedModel
            params = jps.CollisionFreeSpeedModelAgentParameters()
            params.v0 = simulation_speed
            return params
    
    def _run_jupedsim_simulation(
        self,
        geometry: Dict[str, Any],
        model_name: str,
        simulation_time: float,
        time_step: float,
        simulation_speed: float
    ) -> List[SimulationFrame]:
        """
        Run a simulation using the actual JuPedSim library.
        """
        try:
            # Create a temporary directory for output files
            with tempfile.TemporaryDirectory() as temp_dir:
                # Create JuPedSim geometry
                jps_geometry = self._create_geometry_from_elements(geometry)
                
                # Create routing engine
                routing_engine = jps.RoutingEngine(jps_geometry)
                
                # Create model
                model = self._create_model(model_name, jps_geometry)
                
                # Create simulation
                simulation = jps.Simulation(model, routing_engine)
                
                # Set up trajectory writer (optional)
                trajectory_file = Path(temp_dir) / "trajectory.sqlite"
                writer = jps.SqliteTrajectoryWriter(str(trajectory_file))
                simulation.add_trajectory_writer(writer)
                
                # Add agents
                agent_parameters = self._setup_agent_parameters(model_name, simulation_speed)
                
                # Process start points and sources
                for start_point in geometry.get("startPoints", []):
                    position = (start_point["position"]["x"], start_point["position"]["y"])
                    
                    # Find nearest exit for destination
                    nearest_exit = self._find_nearest_exit(start_point["position"], geometry.get("exitPoints", []))
                    destination = (nearest_exit["x"], nearest_exit["y"])
                    
                    # Create journey description
                    journey = jps.JourneyDescription()
                    journey.add_waypoint(destination)
                    
                    # Add agent
                    simulation.add_agent(position, journey, agent_parameters)
                
                # Process sources (areas with multiple agents)
                for source in geometry.get("sources", []):
                    agent_count = source.get("agentCount", 10)
                    
                    # Define the rectangle for agent distribution
                    rect_min_x = min(source["rect"][0]["x"], source["rect"][1]["x"])
                    rect_max_x = max(source["rect"][0]["x"], source["rect"][1]["x"])
                    rect_min_y = min(source["rect"][0]["y"], source["rect"][1]["y"])
                    rect_max_y = max(source["rect"][0]["y"], source["rect"][1]["y"])
                    
                    # Create polygon for distribution
                    polygon = [
                        (rect_min_x, rect_min_y),
                        (rect_max_x, rect_min_y),
                        (rect_max_x, rect_max_y),
                        (rect_min_x, rect_max_y)
                    ]
                    
                    # Distribute agents by number
                    positions = jps.distribute_by_number(
                        polygon=polygon,
                        number=agent_count,
                        distance_to_agents=0.5,
                        distance_to_polygon=0.5
                    )
                    
                    # Find nearest exit for destination
                    exit_midpoint = self._find_nearest_exit(
                        {"x": (rect_min_x + rect_max_x) / 2, "y": (rect_min_y + rect_max_y) / 2},
                        geometry.get("exitPoints", [])
                    )
                    destination = (exit_midpoint["x"], exit_midpoint["y"])
                    
                    # Add agents
                    for position in positions:
                        # Create journey description
                        journey = jps.JourneyDescription()
                        journey.add_waypoint(destination)
                        
                        # Add agent
                        simulation.add_agent(position, journey, agent_parameters)
                
                # Run simulation and collect frames
                frames = []
                current_time = 0.0
                
                # Initialize first frame
                agents = []
                for agent_id, agent in simulation.get_agents().items():
                    state = agent.get_state()
                    position = state.position
                    velocity = state.velocity
                    
                    agents.append(Agent(
                        id=str(agent_id),
                        position=Point(x=position[0], y=position[1]),
                        radius=agent_parameters.radius,
                        velocity=Point(x=velocity[0], y=velocity[1])
                    ))
                
                frames.append(SimulationFrame(
                    time=current_time,
                    agents=agents
                ))
                
                # Step through simulation
                while current_time < simulation_time:
                    # Step simulation
                    simulation.iterate(time_step)
                    current_time += time_step
                    
                    # Collect agent data
                    agents = []
                    for agent_id, agent in simulation.get_agents().items():
                        state = agent.get_state()
                        position = state.position
                        velocity = state.velocity
                        
                        agents.append(Agent(
                            id=str(agent_id),
                            position=Point(x=position[0], y=position[1]),
                            radius=agent_parameters.radius,
                            velocity=Point(x=velocity[0], y=velocity[1])
                        ))
                    
                    frames.append(SimulationFrame(
                        time=current_time,
                        agents=agents
                    ))
                
                return frames
                
        except Exception as e:
            logger.error(f"Error in JuPedSim simulation: {str(e)}", exc_info=True)
            # Fall back to mock simulation
            logger.info("Falling back to mock simulation")
            return self._run_mock_simulation(
                geometry, model_name, simulation_time, time_step, simulation_speed
            )
    
    def _generate_jupedsim_geometry_xml(self, geometry: Dict[str, Any]) -> str:
        """
        Generate JuPedSim geometry XML from processed geometry data.
        """
        xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
        xml += '<geometry version="0.8">\n'
        
        # Add rooms
        xml += '  <rooms>\n'
        for room_id, room in enumerate(geometry.get("rooms", [])):
            xml += f'    <room id="{room_id}" caption="Room {room_id}">\n'
            
            # Add subrooms
            xml += '      <subroom id="0" caption="Subroom 0" class="subroom">\n'
            
            # Add polygons
            xml += '        <polygon caption="wall">\n'
            for point in room["polygon"]:
                xml += f'          <vertex px="{point["x"]}" py="{point["y"]}"/>\n'
            xml += '        </polygon>\n'
            
            # Add obstacles
            for obstacle_id, obstacle in enumerate(geometry.get("obstacles", [])):
                xml += f'        <obstacle id="{obstacle_id}">\n'
                xml += '          <polygon>\n'
                for point in obstacle["polygon"]:
                    xml += f'            <vertex px="{point["x"]}" py="{point["y"]}"/>\n'
                xml += '          </polygon>\n'
                xml += '        </obstacle>\n'
            
            # Add crossings (exits)
            for crossing_id, exit_point in enumerate(geometry.get("exitPoints", [])):
                if "line" in exit_point and len(exit_point["line"]) >= 2:
                    xml += f'        <crossing id="{crossing_id}" caption="Exit {crossing_id}">\n'
                    for point in exit_point["line"]:
                        xml += f'          <vertex px="{point["x"]}" py="{point["y"]}"/>\n'
                    xml += '        </crossing>\n'
            
            xml += '      </subroom>\n'
            xml += '    </room>\n'
        
        xml += '  </rooms>\n'
        xml += '</geometry>'
        
        return xml
    
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
    
    def _run_mock_simulation(
        self,
        geometry: Dict[str, Any],
        model_name: str,
        simulation_time: float,
        time_step: float,
        simulation_speed: float
    ) -> List[SimulationFrame]:
        """
        Run a mock simulation when JuPedSim is not available.
        This generates realistic-looking pedestrian movement data.
        """
        logger.info("Running mock simulation")
        
        # Extract start points and sources
        start_positions = []
        
        # Add start points
        for element in geometry.get("startPoints", []):
            start_positions.append({
                "position": element["position"],
                "radius": random.uniform(0.25, 0.35)
            })
        
        # Add sources
        for source in geometry.get("sources", []):
            agent_count = source.get("agentCount", 10)
            for _ in range(agent_count):
                # Generate random position within source rectangle
                x = random.uniform(
                    min(source["rect"][0]["x"], source["rect"][1]["x"]),
                    max(source["rect"][0]["x"], source["rect"][1]["x"])
                )
                y = random.uniform(
                    min(source["rect"][0]["y"], source["rect"][1]["y"]),
                    max(source["rect"][0]["y"], source["rect"][1]["y"])
                )
                
                start_positions.append({
                    "position": {"x": x, "y": y},
                    "radius": random.uniform(0.25, 0.35)
                })
        
        # If no start positions, create some default ones
        if not start_positions:
            for _ in range(10):
                start_positions.append({
                    "position": {"x": random.uniform(100, 300), "y": random.uniform(100, 300)},
                    "radius": random.uniform(0.25, 0.35)
                })
        
        # Extract exit points
        exit_positions = []
        for exit_point in geometry.get("exitPoints", []):
            # Use midpoint of exit line
            if len(exit_point["line"]) >= 2:
                x = (exit_point["line"][0]["x"] + exit_point["line"][1]["x"]) / 2
                y = (exit_point["line"][0]["y"] + exit_point["line"][1]["y"]) / 2
                exit_positions.append({"x": x, "y": y})
        
        # If no exit positions, create a default one
        if not exit_positions:
            exit_positions.append({"x": 400, "y": 300})
        
        # Generate agent paths
        agents = []
        agent_paths = {}
        
        for i, start_pos in enumerate(start_positions):
            agent_id = f"agent-{i}"
            
            # Assign random exit
            exit_pos = random.choice(exit_positions)
            
            # Generate path with some randomness
            path = self._generate_path(
                start_pos["position"], 
                exit_pos, 
                obstacles=geometry.get("obstacles", []),
                waypoints=geometry.get("waypoints", []),
                num_points=int(simulation_time / time_step)
            )
            
            agents.append(Agent(
                id=agent_id,
                position=Point(x=start_pos["position"]["x"], y=start_pos["position"]["y"]),
                radius=start_pos["radius"]
            ))
            
            agent_paths[agent_id] = path
        
        # Generate frames
        frames = []
        num_frames = int(simulation_time / time_step)
        
        for frame_idx in range(num_frames):
            current_time = frame_idx * time_step
            frame_agents = []
            
            for agent in agents:
                # Get current position from path
                if frame_idx < len(agent_paths[agent.id]):
                    current_pos = agent_paths[agent.id][frame_idx]
                    
                    # Calculate velocity if not the last point
                    velocity = None
                    if frame_idx < len(agent_paths[agent.id]) - 1:
                        next_pos = agent_paths[agent.id][frame_idx + 1]
                        velocity = Point(
                            x=(next_pos["x"] - current_pos["x"]) / time_step,
                            y=(next_pos["y"] - current_pos["y"]) / time_step
                        )
                    
                    frame_agents.append(Agent(
                        id=agent.id,
                        position=Point(x=current_pos["x"], y=current_pos["y"]),
                        radius=agent.radius,
                        velocity=velocity
                    ))
            
            frames.append(SimulationFrame(
                time=current_time,
                agents=frame_agents
            ))
        
        return frames
    
    def _generate_path(
        self, 
        start: Dict[str, float], 
        end: Dict[str, float],
        obstacles: List[Dict[str, Any]],
        waypoints: List[Dict[str, Any]],
        num_points: int
    ) -> List[Dict[str, float]]:
        """
        Generate a path from start to end with waypoints, obstacle avoidance, and some randomness.
        """
        # Check if we have waypoints to use
        waypoint_path = self._get_waypoint_path(start, end, waypoints)
        if waypoint_path:
            return self._interpolate_path(waypoint_path, num_points, obstacles)
        
        # Simple direct path with noise
        path = []
        
        # Calculate distance and direction
        dx = end["x"] - start["x"]
        dy = end["y"] - start["y"]
        distance = math.sqrt(dx*dx + dy*dy)
        
        # Normalize direction
        if distance > 0:
            dx /= distance
            dy /= distance
        
        # Generate path points
        for i in range(num_points):
            # Linear interpolation with noise
            progress = i / (num_points - 1) if num_points > 1 else 0
            
            # Add some randomness
            noise_x = random.uniform(-5, 5) * (1 - progress)  # Less noise as we approach the target
            noise_y = random.uniform(-5, 5) * (1 - progress)
            
            # Calculate position
            x = start["x"] + dx * distance * progress + noise_x
            y = start["y"] + dy * distance * progress + noise_y
            
            # Simple obstacle avoidance
            for obstacle in obstacles:
                # Check if point is too close to any obstacle segment
                for j in range(len(obstacle["polygon"]) - 1):
                    p1 = obstacle["polygon"][j]
                    p2 = obstacle["polygon"][j + 1]
                    
                    # Calculate distance to line segment
                    dist = self._point_to_segment_distance(
                        {"x": x, "y": y}, p1, p2
                    )
                    
                    # If too close, push away from obstacle
                    if dist < 10:
                        # Calculate normal vector to line
                        nx = -(p2["y"] - p1["y"])
                        ny = p2["x"] - p1["x"]
                        
                        # Normalize
                        norm = math.sqrt(nx*nx + ny*ny)
                        if norm > 0:
                            nx /= norm
                            ny /= norm
                        
                        # Push away
                        push_distance = 10 - dist
                        x += nx * push_distance
                        y += ny * push_distance
            
            path.append({"x": x, "y": y})
        
        return path
    
    def _get_waypoint_path(
        self,
        start: Dict[str, float],
        end: Dict[str, float],
        waypoints: List[Dict[str, Any]]
    ) -> List[Dict[str, float]]:
        """
        Find a path through waypoints from start to end.
        Returns None if no suitable path is found.
        """
        if not waypoints:
            return None
        
        # Create a graph of waypoints
        graph = {}
        for wp in waypoints:
            connections = []
            if "connections" in wp:
                for conn in wp["connections"]:
                    connections.append(conn["id"])
            graph[wp["id"]] = {
                "position": wp["position"],
                "connections": connections
            }
        
        # Find closest waypoint to start
        start_wp = None
        min_dist_start = float('inf')
        for wp_id, wp_data in graph.items():
            dist = self._distance(start, wp_data["position"])
            if dist < min_dist_start:
                min_dist_start = dist
                start_wp = wp_id
        
        # Find closest waypoint to end
        end_wp = None
        min_dist_end = float('inf')
        for wp_id, wp_data in graph.items():
            dist = self._distance(end, wp_data["position"])
            if dist < min_dist_end:
                min_dist_end = dist
                end_wp = wp_id
        
        if not start_wp or not end_wp:
            return None
        
        # Find path using BFS
        queue = [(start_wp, [start_wp])]
        visited = set([start_wp])
        
        while queue:
            (node, path) = queue.pop(0)
            
            # Check if we reached the end
            if node == end_wp:
                # Convert path of waypoint IDs to positions
                position_path = [start]
                for wp_id in path:
                    position_path.append(graph[wp_id]["position"])
                position_path.append(end)
                return position_path
            
            # Add neighbors to queue
            for neighbor in graph[node]["connections"]:
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append((neighbor, path + [neighbor]))
        
        # No path found
        return None
    
    def _interpolate_path(
        self,
        waypoint_path: List[Dict[str, float]],
        num_points: int,
        obstacles: List[Dict[str, Any]]
    ) -> List[Dict[str, float]]:
        """
        Interpolate a path through waypoints with the desired number of points.
        """
        if len(waypoint_path) < 2:
            return waypoint_path
        
        # Calculate total path length
        total_length = 0
        for i in range(len(waypoint_path) - 1):
            total_length += self._distance(waypoint_path[i], waypoint_path[i + 1])
        
        # Generate interpolated path
        path = []
        current_length = 0
        target_length = 0
        
        for i in range(num_points):
            # Calculate target length along path
            target_length = (i / (num_points - 1)) * total_length if num_points > 1 else 0
            
            # Find segment containing target length
            segment_start = 0
            segment_length = 0
            current_length = 0
            
            for j in range(len(waypoint_path) - 1):
                segment_length = self._distance(waypoint_path[j], waypoint_path[j + 1])
                if current_length + segment_length >= target_length:
                    segment_start = j
                    break
                current_length += segment_length
            
            # Interpolate within segment
            segment_progress = (target_length - current_length) / segment_length if segment_length > 0 else 0
            p1 = waypoint_path[segment_start]
            p2 = waypoint_path[segment_start + 1]
            
            x = p1["x"] + (p2["x"] - p1["x"]) * segment_progress
            y = p1["y"] + (p2["y"] - p1["y"]) * segment_progress
            
            # Add some randomness
            noise_scale = 5.0 * (1 - i / num_points)  # Less noise as we progress
            noise_x = random.uniform(-noise_scale, noise_scale)
            noise_y = random.uniform(-noise_scale, noise_scale)
            
            x += noise_x
            y += noise_y
            
            # Simple obstacle avoidance
            for obstacle in obstacles:
                # Check if point is too close to any obstacle segment
                for j in range(len(obstacle["polygon"]) - 1):
                    o1 = obstacle["polygon"][j]
                    o2 = obstacle["polygon"][j + 1]
                    
                    # Calculate distance to line segment
                    dist = self._point_to_segment_distance({"x": x, "y": y}, o1, o2)
                    
                    # If too close, push away from obstacle
                    if dist < 10:
                        # Calculate normal vector to line
                        nx = -(o2["y"] - o1["y"])
                        ny = o2["x"] - o1["x"]
                        
                        # Normalize
                        norm = math.sqrt(nx*nx + ny*ny)
                        if norm > 0:
                            nx /= norm
                            ny /= norm
                        
                        # Push away
                        push_distance = 10 - dist
                        x += nx * push_distance
                        y += ny * push_distance
            
            path.append({"x": x, "y": y})
        
        return path
    
    def _distance(self, p1: Dict[str, float], p2: Dict[str, float]) -> float:
        """
        Calculate Euclidean distance between two points.
        """
        dx = p2["x"] - p1["x"]
        dy = p2["y"] - p1["y"]
        return math.sqrt(dx*dx + dy*dy)
    
    def _point_to_segment_distance(
        self, 
        p: Dict[str, float], 
        v: Dict[str, float], 
        w: Dict[str, float]
    ) -> float:
        """
        Calculate the distance from point p to line segment [v,w].
        """
        # Calculate squared length of segment
        l2 = (v["x"] - w["x"])**2 + (v["y"] - w["y"])**2
        
        # If segment is a point, return distance to that point
        if l2 == 0:
            return math.sqrt((p["x"] - v["x"])**2 + (p["y"] - v["y"])**2)
        
        # Calculate projection of p onto line containing segment
        t = ((p["x"] - v["x"]) * (w["x"] - v["x"]) + (p["y"] - v["y"]) * (w["y"] - v["y"])) / l2
        
        # Clamp t to segment
        t = max(0, min(1, t))
        
        # Calculate closest point on segment
        closest_x = v["x"] + t * (w["x"] - v["x"])
        closest_y = v["y"] + t * (w["y"] - v["y"])
        
        # Return distance to closest point
        return math.sqrt((p["x"] - closest_x)**2 + (p["y"] - closest_y)**2)
