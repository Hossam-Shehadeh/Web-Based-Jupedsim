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
    JUPEDSIM_VERSION = jps.__version__
except ImportError:
    JUPEDSIM_AVAILABLE = False
    JUPEDSIM_VERSION = None
    logging.warning("JuPedSim not available, using mock implementation")

from models.simulation import (
    SimulationModel,
    SimulationFrame,
    Agent,
    Point,
    SimulationResult,
    AgentParameters,
    SocialForceParameters
)

logger = logging.getLogger("simulation-service")

import numpy as np
import jupedsim as jps
from typing import List, Dict, Any, Tuple, Optional
import logging
import time
from models.simulation import SimulationState, Agent, Obstacle, Waypoint

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SimulationService:
    def __init__(self):
        self.simulation = None
        self.geometry = None
        self.agents = []
        self.waypoints = []
        self.obstacles = []
        self.simulation_state = SimulationState()
        self.dt = 0.05  # simulation time step in seconds
        
    def initialize_simulation(self, data: Dict[str, Any]) -> SimulationState:
        """Initialize the JuPedSim simulation with the provided data"""
        try:
            # Extract data from request
            self.agents = [Agent(**agent) for agent in data.get('agents', [])]
            self.waypoints = [Waypoint(**wp) for wp in data.get('waypoints', [])]
            self.obstacles = [Obstacle(**obs) for obs in data.get('obstacles', [])]
            
            # Create JuPedSim geometry
            self.geometry = jps.Geometry()
            
            # Add obstacles to geometry
            for obstacle in self.obstacles:
                points = [(p['x'], p['y']) for p in obstacle.points]
                if len(points) >= 3:  # Need at least 3 points for a polygon
                    self.geometry.add_obstacle(points)
            
            # Initialize JuPedSim simulation
            self.simulation = jps.Simulation(self.geometry)
            
            # Add agents to simulation
            for agent in self.agents:
                position = (agent.x, agent.y)
                
                # Create waypoint routes for each agent
                waypoint_ids = agent.waypoints if hasattr(agent, 'waypoints') and agent.waypoints else []
                route = []
                
                if waypoint_ids:
                    for wp_id in waypoint_ids:
                        wp = next((w for w in self.waypoints if w.id == wp_id), None)
                        if wp:
                            route.append((wp.x, wp.y))
                
                # Use JuPedSim's operational model (social force)
                operational_model = jps.OperationalModel()
                
                # Add agent with route
                agent_id = self.simulation.add_agent(
                    position=position,
                    operational_model=operational_model,
                    journey=jps.Journey(route) if route else None,
                    radius=agent.radius if hasattr(agent, 'radius') else 0.3
                )
                
                # Store the JuPedSim agent ID with our agent
                agent.jps_id = agent_id
            
            # Initialize simulation state
            self.simulation_state = SimulationState(
                agents=self.agents,
                waypoints=self.waypoints,
                obstacles=self.obstacles,
                time=0.0,
                status="initialized"
            )
            
            logger.info(f"Simulation initialized with {len(self.agents)} agents, {len(self.waypoints)} waypoints, and {len(self.obstacles)} obstacles")
            return self.simulation_state
            
        except Exception as e:
            logger.error(f"Error initializing simulation: {str(e)}")
            raise
    
    def step_simulation(self) -> SimulationState:
        """Advance the simulation by one time step using JuPedSim"""
        if not self.simulation:
            raise ValueError("Simulation not initialized")
        
        try:
            # Step the JuPedSim simulation
            self.simulation.iterate(self.dt)
            
            # Update agent positions from JuPedSim
            for agent in self.agents:
                if hasattr(agent, 'jps_id'):
                    # Get agent position from JuPedSim
                    jps_agent = self.simulation.get_agent(agent.jps_id)
                    position = jps_agent.get_position()
                    
                    # Update our agent model
                    agent.x = position[0]
                    agent.y = position[1]
                    
                    # Check if agent has reached its current waypoint
                    if hasattr(agent, 'waypoints') and agent.waypoints:
                        current_wp_id = agent.waypoints[0]
                        wp = next((w for w in self.waypoints if w.id == current_wp_id), None)
                        
                        if wp:
                            # Calculate distance to waypoint
                            dx = agent.x - wp.x
                            dy = agent.y - wp.y
                            distance = (dx**2 + dy**2)**0.5
                            
                            # If agent has reached waypoint, move to next waypoint
                            if distance < agent.radius + 0.1:  # Small buffer
                                agent.waypoints.pop(0)
                                
                                # If there are more waypoints, update journey
                                if agent.waypoints:
                                    next_wp_id = agent.waypoints[0]
                                    next_wp = next((w for w in self.waypoints if w.id == next_wp_id), None)
                                    
                                    if next_wp:
                                        # Update agent's journey in JuPedSim
                                        new_journey = jps.Journey([(next_wp.x, next_wp.y)])
                                        jps_agent.set_journey(new_journey)
            
            # Update simulation state
            self.simulation_state.time += self.dt
            self.simulation_state.agents = self.agents
            self.simulation_state.status = "running"
            
            # Check if all agents have reached their final waypoints
            all_finished = all(
                not hasattr(agent, 'waypoints') or not agent.waypoints 
                for agent in self.agents
            )
            
            if all_finished:
                self.simulation_state.status = "completed"
            
            return self.simulation_state
            
        except Exception as e:
            logger.error(f"Error stepping simulation: {str(e)}")
            self.simulation_state.status = "error"
            return self.simulation_state
    
    def run_simulation(self, steps: int = 100) -> List[SimulationState]:
        """Run the simulation for a specified number of steps"""
        if not self.simulation:
            raise ValueError("Simulation not initialized")
        
        simulation_states = []
        
        try:
            for _ in range(steps):
                state = self.step_simulation()
                simulation_states.append(state)
                
                # Break if simulation is completed or has an error
                if state.status in ["completed", "error"]:
                    break
                    
            return simulation_states
            
        except Exception as e:
            logger.error(f"Error running simulation: {str(e)}")
            raise
    
    def get_simulation_state(self) -> SimulationState:
        """Get the current state of the simulation"""
        return self.simulation_state
    """
    Service for running pedestrian dynamics simulations using JuPedSim.
    """
    
    def __init__(self):
        # Define available models based on JuPedSim documentation
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
                description="Anticipation Velocity Model (AVM) that predicts future positions"
            )
        ]
    
    def is_jupedsim_available(self) -> bool:
        """Check if JuPedSim is available."""
        return JUPEDSIM_AVAILABLE
    
    def get_jupedsim_version(self) -> Optional[str]:
        """Get the JuPedSim version if available."""
        return JUPEDSIM_VERSION
    
    def get_available_models(self) -> List[SimulationModel]:
        """Get available simulation models."""
        return self.available_models
    
    def run_simulation(
        self,
        geometry: Dict[str, Any],
        model_name: str,
        simulation_time: float,
        time_step: float,
        simulation_speed: float,
        agent_parameters: Optional[AgentParameters] = None,
        social_force_parameters: Optional[SocialForceParameters] = None
    ) -> SimulationResult:
        """
        Run a pedestrian dynamics simulation.
        
        Args:
            geometry: Processed geometry data
            model_name: Name of the simulation model to use
            simulation_time: Total simulation time in seconds
            time_step: Time step for the simulation in seconds
            simulation_speed: Speed factor for the simulation
            agent_parameters: Optional parameters for agent behavior
            social_force_parameters: Optional parameters for social force model
            
        Returns:
            SimulationResult object containing frames and metadata
        """
        logger.info(f"Running simulation with model {model_name} for {simulation_time}s")
        
        start_time = time.time()
        
        if not JUPEDSIM_AVAILABLE:
            logger.warning("JuPedSim not available, using fallback implementation")
            frames = self._run_fallback_simulation(
                geometry, model_name, simulation_time, time_step, simulation_speed, 
                agent_parameters, social_force_parameters
            )
        else:
            frames = self._run_jupedsim_simulation(
                geometry, model_name, simulation_time, time_step, simulation_speed, 
                agent_parameters, social_force_parameters
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
    
    def _run_jupedsim_simulation(
        self,
        geometry: Dict[str, Any],
        model_name: str,
        simulation_time: float,
        time_step: float,
        simulation_speed: float,
        agent_parameters: Optional[AgentParameters] = None,
        social_force_parameters: Optional[SocialForceParameters] = None
    ) -> List[SimulationFrame]:
        """
        Run a simulation using the JuPedSim library.
        """
        try:
            logger.info("Starting JuPedSim simulation")
            
            # Create a temporary directory for JuPedSim files if needed
            with tempfile.TemporaryDirectory() as temp_dir:
                # Initialize JuPedSim simulation with the selected model
                simulation = self._create_simulation(model_name, time_step, social_force_parameters)
                
                # Create walkable area from geometry
                walkable_area = self._create_walkable_area(geometry)
                simulation.set_geometry(walkable_area)
                
                # Add agents based on geometry
                agents_data = self._add_agents_to_simulation(
                    simulation, 
                    geometry, 
                    simulation_speed, 
                    agent_parameters
                )
                
                # Run simulation
                frames = []
                current_time = 0.0
                
                logger.info(f"Starting simulation loop for {simulation_time}s with step {time_step}s")
                
                while current_time <= simulation_time:
                    # Get agent positions and states
                    agents = []
                    agent_states = simulation.get_agent_states()
                    
                    for agent_id, agent_state in agent_states.items():
                        agent_id_str = str(agent_id)
                        position = agent_state.position
                        velocity = agent_state.velocity if hasattr(agent_state, "velocity") else (0, 0)
                        radius = agent_state.radius
                        
                        # Determine agent state based on position and velocity
                        state = "moving"
                        speed = math.sqrt(velocity[0]**2 + velocity[1]**2)
                        
                        # Check if agent is near a door
                        for door in geometry.get("doors", []):
                            if len(door["points"]) >= 2:
                                door_center_x = (door["points"][0]["x"] + door["points"][1]["x"]) / 2
                                door_center_y = (door["points"][0]["y"] + door["points"][1]["y"]) / 2
                                
                                dist_to_door = math.sqrt(
                                    (position[0] - door_center_x)**2 + 
                                    (position[1] - door_center_y)**2
                                )
                                
                                if dist_to_door < radius * 3:
                                    state = "exiting"
                                    break
                        
                        # Check if agent has reached an exit
                        for exit_point in geometry.get("exitPoints", []):
                            if len(exit_point["line"]) >= 2:
                                exit_center_x = (exit_point["line"][0]["x"] + exit_point["line"][1]["x"]) / 2
                                exit_center_y = (exit_point["line"][0]["y"] + exit_point["line"][1]["y"]) / 2
                                
                                dist_to_exit = math.sqrt(
                                    (position[0] - exit_center_x)**2 + 
                                    (position[1] - exit_center_y)**2
                                )
                                
                                if dist_to_exit < radius * 2:
                                    state = "arrived"
                                    break
                        
                        # If agent is barely moving, mark as waiting
                        if speed < 0.05:
                            state = "waiting"
                        
                        agents.append(Agent(
                            id=agent_id_str,
                            position=Point(x=position[0], y=position[1]),
                            radius=radius,
                            velocity=Point(x=velocity[0], y=velocity[1]),
                            state=state
                        ))
                    
                    frames.append(SimulationFrame(
                        time=current_time,
                        agents=agents
                    ))
                    
                    # Step simulation
                    simulation.step()
                    current_time += time_step
                
                logger.info(f"Simulation completed with {len(frames)} frames")
                return frames
                
        except Exception as e:
            logger.error(f"Error in JuPedSim simulation: {str(e)}", exc_info=True)
            raise ValueError(f"JuPedSim simulation failed: {str(e)}")
    
    def _create_simulation(
        self, 
        model_name: str, 
        time_step: float,
        social_force_parameters: Optional[SocialForceParameters] = None
    ) -> "jps.Simulation":
        """
        Create a JuPedSim simulation with the specified model.
        """
        import jupedsim as jps
        
        logger.info(f"Creating JuPedSim simulation with model: {model_name}")
        
        # Create a simulation with the selected model
        if model_name == "CollisionFreeSpeedModel":
            model = jps.CollisionFreeSpeedModel()
        elif model_name == "CollisionFreeSpeedModelV2":
            model = jps.CollisionFreeSpeedModelV2()
        elif model_name == "GeneralizedCentrifugalForceModel":
            model = jps.GeneralizedCentrifugalForceModel()
        elif model_name == "SocialForceModel":
            # Apply social force parameters if provided
            if social_force_parameters:
                logger.info(f"Using custom social force parameters: {social_force_parameters}")
                model = jps.SocialForceModel(
                    strength_neighbor=social_force_parameters.repulsionStrength,
                    range_neighbor=social_force_parameters.repulsionRange,
                    strength_wall=social_force_parameters.obstacleRepulsionStrength,
                    range_wall=social_force_parameters.obstacleRepulsionRange
                )
            else:
                model = jps.SocialForceModel()
        elif model_name == "AnticipationVelocityModel":
            model = jps.AnticipationVelocityModel()
        else:
            # Default to SocialForceModel if model not recognized
            logger.warning(f"Unknown model: {model_name}, defaulting to SocialForceModel")
            model = jps.SocialForceModel()
            
        # Create simulation with the model and time step
        simulation = jps.Simulation(model=model, delta_t=time_step)
        return simulation
    
    def _create_walkable_area(self, geometry: Dict[str, Any]) -> "jps.Geometry":
        """
        Create a JuPedSim walkable area from geometry data.
        """
        import jupedsim as jps
        
        logger.info("Creating walkable area for JuPedSim")
        
        # Extract walkable areas (ROOMS, STREET_LINE, FREE_LINE)
        walkable_areas = []
        
        # Add rooms
        for element in geometry.get("rooms", []):
            if len(element["points"]) >= 3:  # Need at least 3 points for a polygon
                # Convert points to the format expected by JuPedSim
                polygon = [(p["x"], p["y"]) for p in element["points"]]
                walkable_areas.append(polygon)
        
        # Add street lines and free lines
        for element in geometry.get("walkableAreas", []):
            if len(element["points"]) >= 3:  # Need at least 3 points for a polygon
                # Convert points to the format expected by JuPedSim
                polygon = [(p["x"], p["y"]) for p in element["points"]]
                walkable_areas.append(polygon)
        
        # If no walkable areas defined, create a default one
        if not walkable_areas:
            logger.warning("No walkable areas found, creating default area")
            walkable_areas = [[(0, 0), (0, 500), (500, 500), (500, 0)]]
        
        # Extract obstacles
        obstacles = []
        for element in geometry.get("obstacles", []):
            if len(element["points"]) >= 3:  # Need at least 3 points for a polygon
                # Convert points to the format expected by JuPedSim
                polygon = [(p["x"], p["y"]) for p in element["points"]]
                obstacles.append(polygon)
        
        # Create geometry with walkable areas and obstacles
        geometry_obj = jps.Geometry()
        
        # Add walkable areas
        for area in walkable_areas:
            logger.debug(f"Adding walkable area: {area}")
            geometry_obj.add_walkable_area(area)
        
        # Add obstacles
        for obstacle in obstacles:
            logger.debug(f"Adding obstacle: {obstacle}")
            geometry_obj.add_obstacle(obstacle)
        
        # Add doors as transitions
        for element in geometry.get("doors", []):
            if len(element["points"]) >= 2:
                # Create a transition line for the door
                p1 = element["points"][0]
                p2 = element["points"][1]
                transition_line = [(p1["x"], p1["y"]), (p2["x"], p2["y"])]
                
                # Add transition to geometry
                try:
                    logger.debug(f"Adding transition (door): {transition_line}")
                    geometry_obj.add_transition(transition_line)
                except Exception as e:
                    logger.warning(f"Could not add transition: {str(e)}")
        
        return geometry_obj
    
    def _add_agents_to_simulation(
        self, 
        simulation: "jps.Simulation", 
        geometry: Dict[str, Any],
        simulation_speed: float,
        agent_parameters: Optional[AgentParameters] = None
    ) -> List[Dict[str, Any]]:
        """
        Add agents to the simulation based on geometry data.
        """
        import jupedsim as jps
        
        logger.info("Adding agents to JuPedSim simulation")
        
        agents_data = []
        
        # Extract start points and sources
        start_positions = []
        
        # Add start points
        for element in geometry.get("startPoints", []):
            start_positions.append({
                "position": element["position"],
                "radius": 0.3  # Default radius
            })
        
        # Add sources
        for source in geometry.get("sources", []):
            agent_count = source.get("agentCount", 10)
            
            # Generate positions within source rectangle
            if len(source["rect"]) >= 2:
                x_min = min(source["rect"][0]["x"], source["rect"][1]["x"])
                x_max = max(source["rect"][0]["x"], source["rect"][1]["x"])
                y_min = min(source["rect"][0]["y"], source["rect"][1]["y"])
                y_max = max(source["rect"][0]["y"], source["rect"][1]["y"])
                
                # Use JuPedSim's distribute_by_number function to place agents
                try:
                    logger.debug(f"Distributing {agent_count} agents in rectangle: ({x_min}, {y_min}), ({x_max}, {y_max})")
                    positions = jps.distribute_by_number(
                        polygon=[(x_min, y_min), (x_max, y_min), (x_max, y_max), (x_min, y_max)],
                        number=agent_count,
                        distance=0.6  # Minimum distance between agents
                    )
                    
                    for pos in positions:
                        start_positions.append({
                            "position": {"x": pos[0], "y": pos[1]},
                            "radius": random.uniform(0.25, 0.35)
                        })
                except Exception as e:
                    logger.warning(f"Error using distribute_by_number: {str(e)}")
                    # Fallback to manual distribution
                    for _ in range(agent_count):
                        x = random.uniform(x_min, x_max)
                        y = random.uniform(y_min, y_max)
                        start_positions.append({
                            "position": {"x": x, "y": y},
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
            logger.warning("No exit points found, creating default exit")
            exit_positions.append({"x": 400, "y": 300})
        
        # Extract waypoints for path planning
        waypoints = []
        for element in geometry.get("waypoints", []):
            if element.get("position"):
                waypoints.append({
                    "id": element.get("id", str(uuid.uuid4())),
                    "position": element["position"],
                    "connections": element.get("connections", [])
                })
        
        # Add agents to simulation
        for i, start_pos in enumerate(start_positions):
            # Assign random exit or use waypoint path if available
            exit_pos = random.choice(exit_positions)
            
            # Try to find a path through waypoints if available
            intermediate_points = []
            if waypoints:
                path = self._find_waypoint_path(
                    start_pos["position"], 
                    exit_pos, 
                    waypoints, 
                    geometry.get("obstacles", [])
                )
                
                if path:
                    intermediate_points = path[1:-1]  # Skip start and end points
            
            # Set agent parameters
            v0 = agent_parameters.v0 if agent_parameters else simulation_speed
            radius = agent_parameters.radius if agent_parameters else start_pos["radius"]
            
            # Create agent parameters based on the model
            agent_params = self._create_agent_parameters(simulation, agent_parameters)
            
            # Add agent to simulation
            try:
                logger.debug(f"Adding agent at position: ({start_pos['position']['x']}, {start_pos['position']['y']})")
                
                # If we have intermediate points, use them for the journey
                if intermediate_points:
                    # Add the agent with the first intermediate point as destination
                    agent_id = simulation.add_agent(
                        position=(start_pos["position"]["x"], start_pos["position"]["y"]),
                        destination=(intermediate_points[0]["x"], intermediate_points[0]["y"]),
                        v0=v0,
                        radius=radius,
                        parameters=agent_params
                    )
                    
                    # Set up the journey with all intermediate points and final exit
                    journey_waypoints = [(p["x"], p["y"]) for p in intermediate_points]
                    journey_waypoints.append((exit_pos["x"], exit_pos["y"]))
                    
                    # Set the journey for the agent
                    simulation.set_agent_journey(agent_id, journey_waypoints)
                else:
                    # Add agent with direct path to exit
                    agent_id = simulation.add_agent(
                        position=(start_pos["position"]["x"], start_pos["position"]["y"]),
                        destination=(exit_pos["x"], exit_pos["y"]),
                        v0=v0,
                        radius=radius,
                        parameters=agent_params
                    )
                
                agents_data.append({
                    "id": str(agent_id),
                    "position": start_pos["position"],
                    "destination": exit_pos,
                    "radius": radius
                })
            except Exception as e:
                logger.warning(f"Failed to add agent: {str(e)}")
        
        logger.info(f"Added {len(agents_data)} agents to simulation")
        return agents_data
    
    def _create_agent_parameters(
        self, 
        simulation: "jps.Simulation", 
        agent_parameters: Optional[AgentParameters]
    ) -> Optional[Any]:
        """
        Create model-specific agent parameters.
        """
        import jupedsim as jps
        
        if not agent_parameters:
            return None
        
        # Determine the model type from the simulation
        model_type = type(simulation.model).__name__
        
        if model_type == "CollisionFreeSpeedModel":
            params = jps.CollisionFreeSpeedModelAgentParameters()
            if agent_parameters.timeGap is not None:
                params.time_gap = agent_parameters.timeGap
            return params
            
        elif model_type == "CollisionFreeSpeedModelV2":
            params = jps.CollisionFreeSpeedModelV2AgentParameters()
            if agent_parameters.timeGap is not None:
                params.time_gap = agent_parameters.timeGap
            return params
            
        elif model_type == "GeneralizedCentrifugalForceModel":
            params = jps.GeneralizedCentrifugalForceModelAgentParameters()
            if agent_parameters.strengthNeighbor is not None:
                params.strength_neighbor = agent_parameters.strengthNeighbor
            if agent_parameters.strengthWall is not None:
                params.strength_wall = agent_parameters.strengthWall
            if agent_parameters.rangeNeighbor is not None:
                params.range_neighbor = agent_parameters.rangeNeighbor
            if agent_parameters.rangeWall is not None:
                params.range_wall = agent_parameters.rangeWall
            return params
            
        elif model_type == "SocialForceModel":
            params = jps.SocialForceModelAgentParameters()
            if agent_parameters.strengthNeighbor is not None:
                params.strength_neighbor = agent_parameters.strengthNeighbor
            if agent_parameters.strengthWall is not None:
                params.strength_wall = agent_parameters.strengthWall
            if agent_parameters.rangeNeighbor is not None:
                params.range_neighbor = agent_parameters.rangeNeighbor
            if agent_parameters.rangeWall is not None:
                params.range_wall = agent_parameters.rangeWall
            return params
            
        elif model_type == "AnticipationVelocityModel":
            params = jps.AnticipationVelocityModelAgentParameters()
            if agent_parameters.timeGap is not None:
                params.time_gap = agent_parameters.timeGap
            return params
        
        return None
    
    def _find_waypoint_path(
        self, 
        start: Dict[str, float], 
        end: Dict[str, float], 
        waypoints: List[Dict[str, Any]], 
        obstacles: List[Dict[str, Any]]
    ) -> Optional[List[Dict[str, float]]]:
        """
        Find a path through waypoints from start to end.
        """
        if not waypoints:
            return None
        
        # Find nearest waypoints to start and end
        start_waypoint = None
        end_waypoint = None
        min_start_dist = float('inf')
        min_end_dist = float('inf')
        
        for waypoint in waypoints:
            pos = waypoint["position"]
            
            # Calculate distance to start
            start_dist = math.sqrt(
                (start["x"] - pos["x"])**2 + 
                (start["y"] - pos["y"])**2
            )
            
            # Calculate distance to end
            end_dist = math.sqrt(
                (end["x"] - pos["x"])**2 + 
                (end["y"] - pos["y"])**2
            )
            
            # Check if path to/from waypoint is clear
            start_clear = not self._path_intersects_obstacle(start, pos, obstacles)
            end_clear = not self._path_intersects_obstacle(pos, end, obstacles)
            
            if start_clear and start_dist < min_start_dist:
                min_start_dist = start_dist
                start_waypoint = waypoint
                
            if end_clear and end_dist < min_end_dist:
                min_end_dist = end_dist
                end_waypoint = waypoint
        
        if not start_waypoint or not end_waypoint:
            return None
            
        # If start and end waypoints are the same, return direct path
        if start_waypoint["id"] == end_waypoint["id"]:
            return [start, start_waypoint["position"], end]
            
        # Find path through waypoint graph
        path = self._find_waypoint_graph_path(start_waypoint, end_waypoint, waypoints, obstacles)
        
        if path:
            # Convert path to list of positions
            result = [start]
            for waypoint in path:
                result.append(waypoint["position"])
            result.append(end)
            return result
            
        return None
    
    def _path_intersects_obstacle(
        self, 
        p1: Dict[str, float], 
        p2: Dict[str, float], 
        obstacles: List[Dict[str, Any]]
    ) -> bool:
        """
        Check if a path between two points intersects any obstacle.
        """
        for obstacle in obstacles:
            points = obstacle.get("points", [])
            if len(points) < 3:
                continue
                
            # Check each edge of the obstacle
            for i in range(len(points)):
                j = (i + 1) % len(points)
                
                if self._line_segments_intersect(
                    p1, p2, 
                    points[i], points[j]
                ):
                    return True
                    
        return False
    
    def _line_segments_intersect(
        self, 
        p1: Dict[str, float], 
        p2: Dict[str, float], 
        p3: Dict[str, float], 
        p4: Dict[str, float]
    ) -> bool:
        """
        Check if two line segments intersect.
        """
        # Calculate direction vectors
        dx1 = p2["x"] - p1["x"]
        dy1 = p2["y"] - p1["y"]
        dx2 = p4["x"] - p3["x"]
        dy2 = p4["y"] - p3["y"]
        
        # Calculate determinant
        det = dx1 * dy2 - dy1 * dx2
        
        # If determinant is zero, lines are parallel
        if abs(det) < 1e-10:
            return False
            
        # Calculate parameters
        t = ((p3["x"] - p1["x"]) * dy2 - (p3["y"] - p1["y"]) * dx2) / det
        u = ((p3["x"] - p1["x"]) * dy1 - (p3["y"] - p1["y"]) * dx1) / det
        
        # Check if intersection is within both line segments
        return 0 <= t <= 1 and 0 <= u <= 1
    
    def _find_waypoint_graph_path(
        self, 
        start_waypoint: Dict[str, Any], 
        end_waypoint: Dict[str, Any], 
        waypoints: List[Dict[str, Any]], 
        obstacles: List[Dict[str, Any]]
    ) -> Optional[List[Dict[str, Any]]]:
        """
        Find a path through the waypoint graph using BFS.
        """
        # Create a map of waypoints by ID
        waypoint_map = {wp["id"]: wp for wp in waypoints}
        
        # Queue for BFS
        queue = [(start_waypoint, [start_waypoint])]
        visited = {start_waypoint["id"]}
        
        while queue:
            current, path = queue.pop(0)
            
            # Check if we've reached the end waypoint
            if current["id"] == end_waypoint["id"]:
                return path
                
            # Check all connections
            for conn_id in current.get("connections", []):
                if conn_id in visited:
                    continue
                    
                # Get the connected waypoint
                if conn_id not in waypoint_map:
                    continue
                    
                next_wp = waypoint_map[conn_id]
                
                # Check if the connection is clear of obstacles
                if not self._path_intersects_obstacle(
                    current["position"], 
                    next_wp["position"], 
                    obstacles
                ):
                    visited.add(conn_id)
                    queue.append((next_wp, path + [next_wp]))
                    
        return None
    
    def _run_fallback_simulation(
        self,
        geometry: Dict[str, Any],
        model_name: str,
        simulation_time: float,
        time_step: float,
        simulation_speed: float,
        agent_parameters: Optional[AgentParameters] = None,
        social_force_parameters: Optional[SocialForceParameters] = None
    ) -> List[SimulationFrame]:
        """
        Run a fallback simulation when JuPedSim is not available.
        This is a simplified implementation that mimics JuPedSim behavior.
        """
        logger.info("Running fallback simulation")
        
        # Extract rooms, obstacles, sources, and exits
        rooms = geometry.get("rooms", [])
        obstacles = geometry.get("obstacles", [])
        sources = geometry.get("sources", [])
        exits = geometry.get("exitPoints", [])
        waypoints = geometry.get("waypoints", [])
        
        # Generate initial agents
        agents = []
        agent_id = 0
        
        # Add agents from sources
        for source in sources:
            if len(source.get("rect", [])) >= 2:
                agent_count = source.get("agentCount", 10)
                x_min = min(source["rect"][0]["x"], source["rect"][1]["x"])
                x_max = max(source["rect"][0]["x"], source["rect"][1]["x"])
                y_min = min(source["rect"][0]["y"], source["rect"][1]["y"])
                y_max = max(source["rect"][0]["y"], source["rect"][1]["y"])
                
                for _ in range(agent_count):
                    # Create a position within the source rectangle
                    position = {
                        "x": random.uniform(x_min, x_max),
                        "y": random.uniform(y_min, y_max)
                    }
                    
                    # Find which room contains this position
                    room_id = None
                    for room in rooms:
                        if self._is_point_in_polygon(position, room["points"]):
                            room_id = room["id"]
                            break
                    
                    # Create agent
                    agents.append({
                        "id": f"agent-{agent_id}",
                        "position": position,
                        "radius": random.uniform(0.25, 0.35),
                        "room_id": room_id,
                        "state": "moving",
                        "velocity": {"x": 0, "y": 0},
                        "target_exit": None,
                        "path": None
                    })
                    agent_id += 1
        
        # If no agents were created, create some default ones
        if not agents and rooms:
            room = rooms[0]
            for _ in range(10):
                position = self._generate_random_point_in_polygon(room["points"])
                agents.append({
                    "id": f"agent-{agent_id}",
                    "position": position,
                    "radius": random.uniform(0.25, 0.35),
                    "room_id": room["id"],
                    "state": "moving",
                    "velocity": {"x": 0, "y": 0},
                    "target_exit": None,
                    "path": None
                })
                agent_id += 1
        
        # Extract exit positions
        exit_positions = []
        for exit_point in exits:
            if len(exit_point.get("line", [])) >= 2:
                exit_positions.append({
                    "x": (exit_point["line"][0]["x"] + exit_point["line"][1]["x"]) / 2,
                    "y": (exit_point["line"][0]["y"] + exit_point["line"][1]["y"]) / 2
                })
        
        # If no exits, create a default one
        if not exit_positions:
            exit_positions.append({"x": 400, "y": 300})
        
        # Assign targets and calculate paths for agents
        for agent in agents:
            # Assign random exit
            agent["target_exit"] = random.choice(exit_positions)
            
            # Calculate path using waypoints if available
            if waypoints:
                path = self._find_waypoint_path(
                    agent["position"],
                    agent["target_exit"],
                    waypoints,
                    obstacles
                )
                
                if path:
                    agent["path"] = path
                else:
                    # Fallback to direct path with obstacle avoidance
                    agent["path"] = self._generate_path_with_obstacle_avoidance(
                        agent["position"],
                        agent["target_exit"],
                        obstacles,
                        20
                    )
            else:
                # Direct path with obstacle avoidance
                agent["path"] = self._generate_path_with_obstacle_avoidance(
                    agent["position"],
                    agent["target_exit"],
                    obstacles,
                    20
                )
        
        # Set up social force parameters
        sf_params = social_force_parameters or SocialForceParameters(
            desiredSpeed=1.4,
            relaxationTime=0.5,
            repulsionStrength=2.0,
            repulsionRange=0.4,
            attractionStrength=1.0,
            obstacleRepulsionStrength=10.0,
            obstacleRepulsionRange=0.2,
            doorAttractionStrength=3.0,
            doorAttractionRange=5.0,
            randomForce=0.1
        )
        
        # Generate frames
        frames = []
        current_time = 0.0
        
        while current_time <= simulation_time:
            # Update agent positions using social forces
            self._update_agents_with_social_forces(
                agents,
                obstacles,
                sf_params,
                time_step
            )
            
            # Create frame with current agent states
            frame_agents = []
            for agent in agents:
                frame_agents.append(Agent(
                    id=agent["id"],
                    position=Point(x=agent["position"]["x"], y=agent["position"]["y"]),
                    radius=agent["radius"],
                    velocity=Point(x=agent["velocity"]["x"], y=agent["velocity"]["y"]),
                    state=agent["state"]
                ))
            
            frames.append(SimulationFrame(
                time=current_time,
                agents=frame_agents
            ))
            
            current_time += time_step
        
        return frames
    
    def _is_point_in_polygon(self, point: Dict[str, float], polygon: List[Dict[str, float]]) -> bool:
        """
        Check if a point is inside a polygon using ray casting algorithm.
        """
        if len(polygon) < 3:
            return False
        
        inside = False
        j = len(polygon) - 1
        
        for i in range(len(polygon)):
            if ((polygon[i]["y"] > point["y"]) != (polygon[j]["y"] > point["y"])) and \
               (point["x"] < (polygon[j]["x"] - polygon[i]["x"]) * (point["y"] - polygon[i]["y"]) / 
                (polygon[j]["y"] - polygon[i]["y"]) + polygon[i]["x"]):
                inside = not inside
            j = i
            
        return inside
    
    def _generate_random_point_in_polygon(self, polygon: List[Dict[str, float]]) -> Dict[str, float]:
        """
        Generate a random point inside a polygon.
        """
        # Find bounding box
        min_x = min(p["x"] for p in polygon)
        min_y = min(p["y"] for p in polygon)
        max_x = max(p["x"] for p in polygon)
        max_y = max(p["y"] for p in polygon)
        
        # Try random points until we find one inside the polygon
        for _ in range(100):
            point = {
                "x": random.uniform(min_x, max_x),
                "y": random.uniform(min_y, max_y)
            }
            
            if self._is_point_in_polygon(point, polygon):
                return point
        
        # Fallback to center if we can't find a point
        return {
            "x": sum(p["x"] for p in polygon) / len(polygon),
            "y": sum(p["y"] for p in polygon) / len(polygon)
        }
    
    def _generate_path_with_obstacle_avoidance(
        self,
        start: Dict[str, float],
        end: Dict[str, float],
        obstacles: List[Dict[str, Any]],
        num_points: int
    ) -> List[Dict[str, float]]:
        """
        Generate a path from start to end with obstacle avoidance.
        """
        # Check if direct path is clear
        if not self._path_intersects_obstacle(start, end, obstacles):
            return self._generate_straight_path(start, end, num_points)
        
        # Try to find a path with intermediate points
        path = [start]
        
        # Calculate direct vector
        dx = end["x"] - start["x"]
        dy = end["y"] - start["y"]
        dist = math.sqrt(dx*dx + dy*dy)
        
        # Try perpendicular directions
        perp_x = -dy / dist
        perp_y = dx / dist
        
        # Try different detour distances
        for detour_dist in [dist * 0.3, dist * 0.5, dist * 0.7]:
            for sign in [-1, 1]:
                detour_point = {
                    "x": start["x"] + dx * 0.5 + sign * perp_x * detour_dist,
                    "y": start["y"] + dy * 0.5 + sign * perp_y * detour_dist
                }
                
                # Check if detour is clear
                if not self._path_intersects_obstacle(start, detour_point, obstacles) and \
                   not self._path_intersects_obstacle(detour_point, end, obstacles):
                    # Generate path through detour
                    first_half = self._generate_straight_path(start, detour_point, num_points // 2)
                    second_half = self._generate_straight_path(detour_point, end, num_points // 2)
                    
                    # Combine paths (skip duplicate point)
                    return first_half + second_half[1:]
        
        # If no clear detour found, try random points
        for _ in range(20):
            detour_point = {
                "x": start["x"] + dx * 0.5 + random.uniform(-0.5, 0.5) * dist,
                "y": start["y"] + dy * 0.5 + random.uniform(-0.5, 0.5) * dist
            }
            
            if not self._path_intersects_obstacle(start, detour_point, obstacles) and \
                   not self._path_intersects_obstacle(detour_point, end, obstacles):
                # Generate path through detour
                first_half = self._generate_straight_path(start, detour_point, num_points // 2)
                second_half = self._generate_straight_path(detour_point, end, num_points // 2)
                
                # Combine paths (skip duplicate point)
                return first_half + second_half[1:]
        
        # If all else fails, return direct path
        return self._generate_straight_path(start, end, num_points)
    
    def _generate_straight_path(
        self,
        start: Dict[str, float],
        end: Dict[str, float],
        num_points: int
    ) -> List[Dict[str, float]]:
        """
        Generate a straight path from start to end with the given number of points.
        """
        path = [start]
        
        for i in range(1, num_points):
            t = i / num_points
            path.append({
                "x": start["x"] + t * (end["x"] - start["x"]),
                "y": start["y"] + t * (end["y"] - start["y"])
            })
        
        path.append(end)
        return path
    
    def _update_agents_with_social_forces(
        self,
        agents: List[Dict[str, Any]],
        obstacles: List[Dict[str, Any]],
        sf_params: SocialForceParameters,
        time_step: float
    ) -> None:
        """
        Update agent positions using social forces.
        """
        # Calculate forces for each agent
        for agent in agents:
            # Skip agents that have arrived
            if agent["state"] == "arrived":
                continue
            
            # Get current position and path
            pos = agent["position"]
            path = agent["path"]
            
            # If no path or already at target, mark as arrived
            if not path or (
                math.sqrt(
                    (pos["x"] - agent["target_exit"]["x"])**2 + 
                    (pos["y"] - agent["target_exit"]["y"])**2
                ) < agent["radius"] * 2
            ):
                agent["state"] = "arrived"
                agent["velocity"] = {"x": 0, "y": 0}
                continue
            
            # Find next target point in path
            target_idx = 0
            min_dist = float('inf')
            
            for i, point in enumerate(path):
                dist = math.sqrt((pos["x"] - point["x"])**2 + (pos["y"] - point["y"])**2)
                if dist < min_dist:
                    min_dist = dist
                    target_idx = i
            
            # Move to next point in path
            target_idx = min(target_idx + 1, len(path) - 1)
            target = path[target_idx]
            
            # Calculate desired force (attraction to target)
            dx = target["x"] - pos["x"]
            dy = target["y"] - pos["y"]
            dist = math.sqrt(dx*dx + dy*dy)
            
            # If very close to target, move to next point
            if dist < agent["radius"]:
                if target_idx < len(path) - 1:
                    target = path[target_idx + 1]
                    dx = target["x"] - pos["x"]
                    dy = target["y"] - pos["y"]
                    dist = math.sqrt(dx*dx + dy*dy)
                else:
                    # Reached end of path
                    agent["state"] = "arrived"
                    agent["velocity"] = {"x": 0, "y": 0}
                    continue
            
            # Normalize direction
            if dist > 0:
                dx /= dist
                dy /= dist
            
            # Calculate desired force
            desired_force_x = (dx * sf_params.desiredSpeed) / sf_params.relaxationTime
            desired_force_y = (dy * sf_params.desiredSpeed) / sf_params.relaxationTime
            
            # Calculate repulsion from other agents
            repulsion_x = 0
            repulsion_y = 0
            
            for other in agents:
                if other["id"] == agent["id"] or other["state"] == "arrived":
                    continue
                
                other_dx = other["position"]["x"] - pos["x"]
                other_dy = other["position"]["y"] - pos["y"]
                other_dist = math.sqrt(other_dx*other_dx + other_dy*other_dy)
                
                # Skip if too far
                if other_dist > sf_params.repulsionRange * 5:
                    continue
                
                # Calculate minimum separation distance
                min_dist = agent["radius"] + other["radius"] + 0.2  # Extra buffer
                
                if other_dist < min_dist * 3:
                    # Strong repulsion to prevent overlap
                    repulsion_strength = sf_params.repulsionStrength * 2 * math.exp(-(other_dist - min_dist) / sf_params.repulsionRange)
                    
                    # Normalize direction
                    if other_dist > 0:
                        norm_x = -other_dx / other_dist
                        norm_y = -other_dy / other_dist
                        
                        repulsion_x += norm_x * repulsion_strength
                        repulsion_y += norm_y * repulsion_strength
            
            # Calculate repulsion from obstacles
            obstacle_force_x = 0
            obstacle_force_y = 0
            
            for obstacle in obstacles:
                points = obstacle.get("points", [])
                if len(points) < 3:
                    continue
                
                # Check each edge of the obstacle
                for i in range(len(points)):
                    j = (i + 1) % len(points)
                    p1 = points[i]
                    p2 = points[j]
                    
                    # Calculate distance to line segment
                    dist = self._distance_to_line_segment(pos, p1, p2)
                    
                    # Apply strong repulsion to prevent touching obstacles
                    if dist < sf_params.obstacleRepulsionRange * 5:
                        repulsion_strength = sf_params.obstacleRepulsionStrength * 3 * math.exp(-(dist - agent["radius"]) / sf_params.obstacleRepulsionRange)
                        
                        # Calculate normal vector from line segment
                        line_x = p2["x"] - p1["x"]
                        line_y = p2["y"] - p1["y"]
                        line_length = math.sqrt(line_x*line_x + line_y*line_y)
                        
                        if line_length > 0:
                            # Normal points away from the line
                            normal_x = -line_y / line_length
                            normal_y = line_x / line_length
                            
                            # Make sure normal points away from agent
                            dot_product = (pos["x"] - p1["x"]) * normal_x + (pos["y"] - p1["y"]) * normal_y
                            if dot_product < 0:
                                normal_x = -normal_x
                                normal_y = -normal_y
                            
                            obstacle_force_x += normal_x * repulsion_strength
                            obstacle_force_y += normal_y * repulsion_strength
            
            # Add random force for natural movement
            random_force_x = (random.random() * 2 - 1) * sf_params.randomForce
            random_force_y = (random.random() * 2 - 1) * sf_params.randomForce
            
            # Calculate total force
            total_force_x = desired_force_x + repulsion_x + obstacle_force_x + random_force_x
            total_force_y = desired_force_y + repulsion_y + obstacle_force_y + random_force_y
            
            # Update velocity (simple Euler integration)
            agent["velocity"]["x"] += total_force_x * time_step
            agent["velocity"]["y"] += total_force_y * time_step
            
            # Cap velocity at desired speed
            speed = math.sqrt(agent["velocity"]["x"]**2 + agent["velocity"]["y"]**2)
            if speed > sf_params.desiredSpeed:
                agent["velocity"]["x"] *= sf_params.desiredSpeed / speed
                agent["velocity"]["y"] *= sf_params.desiredSpeed / speed
            
            # Update position
            agent["position"]["x"] += agent["velocity"]["x"] * time_step
            agent["position"]["y"] += agent["velocity"]["y"] * time_step
            
            # Update agent state
            if speed < 0.05:
                agent["state"] = "waiting"
            else:
                agent["state"] = "moving"
    
    def _distance_to_line_segment(
        self,
        point: Dict[str, float],
        line_start: Dict[str, float],
        line_end: Dict[str, float]
    ) -> float:
        """
        Calculate the distance from a point to a line segment.
        """
        a = point["x"] - line_start["x"]
        b = point["y"] - line_start["y"]
        c = line_end["x"] - line_start["x"]
        d = line_end["y"] - line_start["y"]
        
        dot = a * c + b * d
        len_sq = c * c + d * d
        param = -1
        
        if len_sq != 0:
            param = dot / len_sq
        
        if param < 0:
            xx = line_start["x"]
            yy = line_start["y"]
        elif param > 1:
            xx = line_end["x"]
            yy = line_end["y"]
        else:
            xx = line_start["x"] + param * c
            yy = line_start["y"] + param * d
        
        dx = point["x"] - xx
        dy = point["y"] - yy
        
        return math.sqrt(dx * dx + dy * dy)
