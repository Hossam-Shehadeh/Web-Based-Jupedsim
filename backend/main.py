from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json
import logging
import asyncio
from services.simulation_service import SimulationService
from models.simulation import SimulationState

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create simulation service
simulation_service = SimulationService()

class SimulationRequest(BaseModel):
    agents: List[Dict[str, Any]]
    waypoints: List[Dict[str, Any]]
    obstacles: List[Dict[str, Any]]
    steps: Optional[int] = 100

@app.get("/")
def read_root():
    return {"message": "JuPedSim Backend API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/simulate")
def simulate(request: SimulationRequest):
    try:
        # Initialize simulation
        simulation_service.initialize_simulation(request.dict())
        
        # Run simulation
        states = simulation_service.run_simulation(request.steps)
        
        # Return the final state
        return {"states": [state.dict() for state in states]}
    
    except Exception as e:
        logger.error(f"Simulation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/initialize")
def initialize_simulation(request: SimulationRequest):
    try:
        state = simulation_service.initialize_simulation(request.dict())
        return state.dict()
    except Exception as e:
        logger.error(f"Initialization error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/step")
def step_simulation():
    try:
        state = simulation_service.step_simulation()
        return state.dict()
    except Exception as e:
        logger.error(f"Step error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/state")
def get_simulation_state():
    try:
        state = simulation_service.get_simulation_state()
        return state.dict()
    except Exception as e:
        logger.error(f"State retrieval error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# WebSocket connection for real-time simulation updates
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            request = json.loads(data)
            
            # Handle different message types
            if request.get("type") == "initialize":
                simulation_service.initialize_simulation(request.get("data", {}))
                state = simulation_service.get_simulation_state()
                await websocket.send_json(state.dict())
            
            elif request.get("type") == "step":
                state = simulation_service.step_simulation()
                await websocket.send_json(state.dict())
            
            elif request.get("type") == "run":
                steps = request.get("steps", 100)
                for _ in range(steps):
                    state = simulation_service.step_simulation()
                    await websocket.send_json(state.dict())
                    await asyncio.sleep(0.05)  # Small delay between steps
                    
                    # Break if simulation is completed or has an error
                    if state.status in ["completed", "error"]:
                        break
            
            else:
                await websocket.send_json({"error": "Unknown message type"})
    
    except WebSocketDisconnect:
        logger.info("Client disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        await websocket.send_json({"error": str(e)})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
