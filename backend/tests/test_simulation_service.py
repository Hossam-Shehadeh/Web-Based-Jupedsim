import unittest
from unittest.mock import patch, MagicMock
import sys
import os
import json

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.simulation_service import SimulationService
from models.simulation import SimulationModel, Point

class TestSimulationService(unittest.TestCase):
    def setUp(self):
        self.service = SimulationService()
        
        # Sample geometry data
        self.sample_geometry = {
            "rooms": [
                {
                    "id": "room1",
                    "type": "STREET_LINE",
                    "polygon": [
                        {"x": 0, "y": 0},
                        {"x": 100, "y": 0},
                        {"x": 100, "y": 100},
                        {"x": 0, "y": 100}
                    ]
                }
            ],
            "obstacles": [],
            "startPoints": [
                {
                    "id": "start1",
                    "position": {"x": 20, "y": 20}
                }
            ],
            "sources": [],
            "exitPoints": [
                {
                    "id": "exit1",
                    "line": [
                        {"x": 90, "y": 50},
                        {"x": 100, "y": 50}
                    ]
                }
            ],
            "waypoints": []
        }
    
    def test_get_available_models(self):
        """Test that available models are returned correctly."""
        models = self.service.get_available_models()
        self.assertIsInstance(models, list)
        self.assertTrue(len(models) > 0)
        self.assertIsInstance(models[0], SimulationModel)
    
    def test_is_jupedsim_available(self):
        """Test that JuPedSim availability is checked correctly."""
        # This will return True or False depending on whether JuPedSim is installed
        result = self.service.is_jupedsim_available()
        self.assertIsInstance(result, bool)
    
    @patch('services.simulation_service.JUPEDSIM_AVAILABLE', False)
    def test_run_mock_simulation(self):
        """Test that mock simulation runs correctly when JuPedSim is not available."""
        result = self.service.run_simulation(
            geometry=self.sample_geometry,
            model_name="CollisionFreeSpeedModel",
            simulation_time=10.0,
            time_step=0.1,
            simulation_speed=1.4
        )
        
        self.assertIsNotNone(result)
        self.assertTrue(len(result.frames) > 0)
        self.assertEqual(result.simulation_time, 10.0)
        self.assertEqual(result.time_step, 0.1)
        self.assertEqual(result.model_name, "CollisionFreeSpeedModel")
    
    def test_point_to_segment_distance(self):
        """Test the point to segment distance calculation."""
        # Point on the segment
        dist = self.service._point_to_segment_distance(
            {"x": 5, "y": 0},
            {"x": 0, "y": 0},
            {"x": 10, "y": 0}
        )
        self.assertAlmostEqual(dist, 0.0)
        
        # Point not on the segment
        dist = self.service._point_to_segment_distance(
            {"x": 5, "y": 5},
            {"x": 0, "y": 0},
            {"x": 10, "y": 0}
        )
        self.assertAlmostEqual(dist, 5.0)
    
    def test_generate_path(self):
        """Test path generation."""
        start = {"x": 0, "y": 0}
        end = {"x": 100, "y": 100}
        obstacles = []
        num_points = 10
        
        path = self.service._generate_path(start, end, obstacles, num_points)
        
        self.assertEqual(len(path), num_points)
        self.assertAlmostEqual(path[0]["x"], start["x"], delta=10)
        self.assertAlmostEqual(path[0]["y"], start["y"], delta=10)
        self.assertAlmostEqual(path[-1]["x"], end["x"], delta=10)
        self.assertAlmostEqual(path[-1]["y"], end["y"], delta=10)

if __name__ == '__main__':
    unittest.main()
