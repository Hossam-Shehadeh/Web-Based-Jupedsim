from pydantic import BaseModel, Field, validator
from typing import List, Dict, Any, Optional, Union
import uuid

# Element types
class Point(BaseModel):
    x: float
    y: float

class ElementProperties(BaseModel):
    agentCount: Optional[int] = None
    connections: Optional[List[str]] = None
    name: Optional[str] = None
    capacity: Optional[int] = None
    roomId: Optional[str] = None
    targetRoomId: Optional[str] = None
    
    class Config:
        extra = "allow"  # Allow additional properties

class Element(BaseModel):
    id: str
    type: str
    points: List[Point]
    properties: Optional[ElementProperties] = None

# Simulation models based on JuPedSim
class SimulationModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None

class SimulationModels(BaseModel):
    models: List[SimulationModel]

# Social Force Parameters
class SocialForceParameters(BaseModel):
    desiredSpeed: float = 1.4  # m/s
    relaxationTime: float = 0.5  # s
    repulsionStrength: float = 2.0
    repulsionRange: float = 0.4  # m
    attractionStrength: float = 1.0
    obstacleRepulsionStrength: float = 10.0
    obstacleRepulsionRange: float = 0.2  # m
    doorAttractionStrength: float = 3.0
    doorAttractionRange: float = 5.0  # m
    randomForce: float = 0.1

# Agent parameters for different models
class AgentParameters(BaseModel):
    v0: float = 1.4  # Desired speed
    radius: float = 0.3  # Agent radius
    timeGap: Optional[float] = None  # Time gap for collision avoidance
    forceDistance: Optional[float] = None  # Distance for force calculation
    forceAngle: Optional[float] = None  # Angle for force calculation
    strengthNeighbor: Optional[float] = None  # Strength of neighbor repulsion
    strengthWall: Optional[float] = None  # Strength of wall repulsion
    rangeNeighbor: Optional[float] = None  # Range of neighbor repulsion
    rangeWall: Optional[float] = None  # Range of wall repulsion

# Simulation request
class SimulationRequest(BaseModel):
    elements: List[Element]
    simulationSpeed: float = 1.4
    selectedModel: str
    simulationTime: float = 10.0
    timeStep: float = 0.05
    agentParameters: Optional[AgentParameters] = None
    socialForceParams: Optional[SocialForceParameters] = None
    
    @validator('simulationTime')
    def validate_simulation_time(cls, v):
        if v <= 0 or v > 300:  # Max 5 minutes
            raise ValueError("Simulation time must be between 0 and 300 seconds")
        return v
    
    @validator('timeStep')
    def validate_time_step(cls, v):
        if v <= 0 or v > 1:
            raise ValueError("Time step must be between 0 and 1 second")
        return v

# Agent representation
class Agent(BaseModel):
    id: str
    x: float
    y: float
    radius: float = 0.3
    speed: float = 1.0
    waypoints: List[str] = []
    jps_id: Optional[int] = None
    color: Optional[str] = None
    
class Waypoint(BaseModel):
    id: str
    x: float
    y: float
    connections: List[str] = []
    
class Obstacle(BaseModel):
    id: str
    points: List[Dict[str, float]]
    
class SimulationState(BaseModel):
    agents: List[Agent] = []
    waypoints: List[Waypoint] = []
    obstacles: List[Obstacle] = []
    time: float = 0.0
    status: str = "idle"  # idle, initialized, running, completed, error

# Simulation frame
class SimulationFrame(BaseModel):
    time: float
    agents: List[Agent]

# Simulation response
class SimulationResponse(BaseModel):
    frames: List[SimulationFrame]
    metadata: Dict[str, Any]

# Simulation result from service
class SimulationResult:
    def __init__(
        self, 
        frames: List[SimulationFrame], 
        simulation_time: float, 
        time_step: float,
        model_name: str,
        agent_count: int
    ):
        self.frames = frames
        self.simulation_time = simulation_time
        self.time_step = time_step
        self.model_name = model_name
        self.agent_count = agent_count

# Health check response
class HealthResponse(BaseModel):
    status: str
    jupedsim_available: bool
    version: Optional[str] = None

# Error response
class ErrorResponse(BaseModel):
    detail: str
    request_id: Optional[str] = None
