import jupedsim as jps
from typing import Optional
from dataclasses import dataclass

@dataclass
class SocialForceParameters:
    repulsionStrength: float
    repulsionRange: float
    obstacleRepulsionStrength: float
    obstacleRepulsionRange: float

class SimulationService:
    def __init__(self):
        pass

    def _create_simulation(
        self, 
        model_name: str, 
        time_step: float,
        social_force_parameters: Optional[SocialForceParameters] = None
    ) -> "jps.Simulation":
        """
        Create a JuPedSim simulation with the specified model.
        """
        
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
                model = jps.SocialForceModel(
                    strength_neighbor=social_force_parameters.repulsionStrength * 1.5,  # Increase strength
                    range_neighbor=social_force_parameters.repulsionRange * 1.2,        # Increase range
                    strength_wall=social_force_parameters.obstacleRepulsionStrength * 2.0,  # Double wall repulsion
                    range_wall=social_force_parameters.obstacleRepulsionRange * 1.5     # Increase wall range
                )
            else:
                # Use stronger default values
                model = jps.SocialForceModel(
                    strength_neighbor=3.0,  # Default is usually around 2.0
                    range_neighbor=0.5,     # Default is usually around 0.4
                    strength_wall=15.0,     # Default is usually around 10.0
                    range_wall=0.3          # Default is usually around 0.2
                )
        elif model_name == "AnticipationVelocityModel":
            model = jps.AnticipationVelocityModel()
        else:
            # Default to SocialForceModel if model not recognized
            model = jps.SocialForceModel(
                strength_neighbor=3.0,
                range_neighbor=0.5,
                strength_wall=15.0,
                range_wall=0.3
            )
            
        # Create simulation with the model and time step
        simulation = jps.Simulation(model=model, delta_t=time_step)
        return simulation
