from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import time
from typing import List, Dict, Any, Optional
import uuid

from models.simulation import (
    SimulationRequest,
    SimulationResponse,
    SimulationModels,
    HealthResponse,
    ErrorResponse
)
from services.simulation_service import SimulationService
from services.geometry_service import GeometryService
from config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("jupedsim-backend")

# Initialize FastAPI app
app = FastAPI(
    title="JuPedSim Backend API",
    description="Backend API for JuPedSim pedestrian dynamics simulation",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
simulation_service = SimulationService()
geometry_service = GeometryService()

# Global request ID middleware for tracking
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = str(uuid.uuid4())
    start_time = time.time()
    
    # Add request ID to request state
    request.state.request_id = request_id
    logger.info(f"Request started: {request_id} - {request.method} {request.url.path}")
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    logger.info(f"Request completed: {request_id} - Took {process_time:.3f}s")
    
    # Add request ID to response headers
    response.headers["X-Request-ID"] = request_id
    return response

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception in request {request.state.request_id}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            detail="An unexpected error occurred",
            request_id=request.state.request_id
        ).dict(),
    )

# Health check endpoint
@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint to verify the API is running.
    """
    jupedsim_available = simulation_service.is_jupedsim_available()
    
    response = {
        "status": "ok",
        "jupedsim_available": jupedsim_available
    }
    
    # Add JuPedSim version info if available
    if jupedsim_available:
        try:
            import jupedsim as jps
            response["version"] = jps.__version__
            response["build_info"] = {
                "commit": jps.__commit__,
                "compiler": jps.__compiler__
            }
        except ImportError:
            pass
    
    return HealthResponse(**response)

# Get available simulation models
@app.get("/api/models", response_model=SimulationModels)
async def get_models():
    """
    Get available simulation models.
    """
    try:
        models = simulation_service.get_available_models()
        return SimulationModels(models=models)
    except Exception as e:
        logger.error(f"Error getting models: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get models: {str(e)}")

# Run simulation endpoint
@app.post("/api/simulate", response_model=SimulationResponse)
async def run_simulation(request: SimulationRequest):
    """
    Run a pedestrian dynamics simulation with the provided parameters.
    """
    try:
        logger.info(f"Received simulation request with {len(request.elements)} elements")
        
        # Validate geometry
        geometry_service.validate_geometry(request.elements)
        
        # Process geometry into JuPedSim format
        geometry = geometry_service.process_geometry(request.elements)
        
        # Run simulation
        simulation_result = simulation_service.run_simulation(
            geometry=geometry,
            model_name=request.selectedModel,
            simulation_time=request.simulationTime,
            time_step=request.timeStep,
            simulation_speed=request.simulationSpeed
        )
        
        return SimulationResponse(
            frames=simulation_result.frames,
            metadata={
                "simulationTime": simulation_result.simulation_time,
                "timeStep": simulation_result.time_step,
                "modelName": simulation_result.model_name,
                "agentCount": simulation_result.agent_count
            }
        )
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error running simulation: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to run simulation: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
