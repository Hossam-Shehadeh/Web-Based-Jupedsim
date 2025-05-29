import os
from typing import List, Optional
from pydantic import BaseSettings

class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    """
    # API settings
    API_PREFIX: str = "/api"
    DEBUG: bool = os.getenv("DEBUG", "False").lower() in ("true", "1", "t")
    
    # CORS settings
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "https://localhost:3000",
        "https://localhost:8000",
        "*"  # Allow all origins in development
    ]
    
    # JuPedSim settings
    JUPEDSIM_ENABLED: bool = os.getenv("JUPEDSIM_ENABLED", "True").lower() in ("true", "1", "t")
    
    # Simulation settings
    MAX_SIMULATION_TIME: float = 300.0  # 5 minutes
    MAX_AGENTS: int = 1000
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
