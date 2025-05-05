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
    
    class Config:
        extra = "allow"  # Allow additional properties

class Element(BaseModel):
    id: str
    type: str
    points: List[Point]
    properties: Optional[ElementProperties] = None

# Simulation models
class SimulationModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None

class SimulationModels(BaseModel):
    models: List[SimulationModel]

# Agent parameters for different models
class AgentParameters(BaseModel):
    v0: float = 1.4  # Desired speed
    radius: float = 0.3  # Agent radius
    
    class Config:
        extra = "allow"  # Allow additional properties

# Simulation request
class SimulationRequest(BaseModel):
    elements: List[Element]
    simulationSpeed: float = 1.4
    selectedModel: str
    simulationTime: float = 10.0
    timeStep: float = 0.05
    agentParameters: Optional[AgentParameters] = None
    
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
    
    @validator('simulationSpeed')
    def validate_simulation_speed(cls, v):
        if v < 0 or v > 10:
            raise ValueError("Simulation speed must be between 0 and 10 m/s")
        return v

# Agent representation
class Agent(BaseModel):
    id: str
    position: Point
    radius: float
    velocity: Optional[Point] = None

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
    build_info: Optional[Dict[str, str]] = None

# Error response
class ErrorResponse(BaseModel):
    detail: str
    request_id: Optional[str] = None
