import unittest
from unittest.mock import patch, MagicMock
import sys
import os
import json

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.geometry_service import GeometryService
from models.simulation import Element, Point, ElementProperties

class TestGeometryService(unittest.TestCase):
    def setUp(self):
        self.service = GeometryService()
        
        # Sample elements
        self.walkable_area = Element(
            id="walkable1",
            type="STREET_LINE",
            points=[
                Point(x=0, y=0),
                Point(x=100, y=0),
                Point(x=100, y=100),
                Point(x=0, y=100)
            ]
        )
        
        self.start_point = Element(
            id="start1",
            type="START_POINT",
            points=[Point(x=20, y=20)]
        )
        
        self.exit_point = Element(
            id="exit1",
            type="EXIT_POINT",
            points=[
                Point(x=90, y=50),
                Point(x=100, y=50)
            ]
        )
        
        self.source = Element(
            id="source1",
            type="SOURCE_RECTANGLE",
            points=[
                Point(x=10, y=10),
                Point(x=30, y=30)
            ],
            properties=ElementProperties(agentCount=5)
        )
        
        self.obstacle = Element(
            id="obstacle1",
            type="OBSTACLE",
            points=[
                Point(x=40, y=40),
                Point(x=60, y=40),
                Point(x=60, y=60),
                Point(x=40, y=60)
            ]
        )
        
        self.waypoint1 = Element(
            id="waypoint1",
            type="WAYPOINT",
            points=[Point(x=30, y=50)],
            properties=ElementProperties(connections=["waypoint2"])
        )
        
        self.waypoint2 = Element(
            id="waypoint2",
            type="WAYPOINT",
            points=[Point(x=70, y=50)]
        )
        
        # All elements
        self.elements = [
            self.walkable_area,
            self.start_point,
            self.exit_point,
            self.source,
            self.obstacle,
            self.waypoint1,
            self.waypoint2
        ]
    
    def test_validate_geometry_valid(self):
        """Test that valid geometry passes validation."""
        # This should not raise an exception
        self.service.validate_geometry(self.elements)
    
    def test_validate_geometry_no_walkable(self):
        """Test that geometry without walkable areas fails validation."""
        elements = [el for el in self.elements if el.type != "STREET_LINE" and el.type != "FREE_LINE"]
        
        with self.assertRaises(ValueError):
            self.service.validate_geometry(elements)
    
    def test_validate_geometry_no_start(self):
        """Test that geometry without start points fails validation."""
        elements = [el for el in self.elements if el.type != "START_POINT" and el.type != "SOURCE_RECTANGLE"]
        
        with self.assertRaises(ValueError):
            self.service.validate_geometry(elements)
    
    def test_validate_geometry_no_exit(self):
        """Test that geometry without exit points fails validation."""
        elements = [el for el in self.elements if el.type != "EXIT_POINT"]
        
        with self.assertRaises(ValueError):
            self.service.validate_geometry(elements)
    
    def test_process_geometry(self):
        """Test that geometry is processed correctly."""
        processed = self.service.process_geometry(self.elements)
        
        # Check that all sections are present
        self.assertIn("rooms", processed)
        self.assertIn("obstacles", processed)
        self.assertIn("startPoints", processed)
        self.assertIn("sources", processed)
        self.assertIn("exitPoints", processed)
        self.assertIn("waypoints", processed)
        self.assertIn("agents", processed)
        
        # Check that rooms are processed correctly
        self.assertEqual(len(processed["rooms"]), 1)
        self.assertEqual(processed["rooms"][0]["id"], "walkable1")
        
        # Check that start points are processed correctly
        self.assertEqual(len(processed["startPoints"]), 1)
        self.assertEqual(processed["startPoints"][0]["id"], "start1")
        
        # Check that exit points are processed correctly
        self.assertEqual(len(processed["exitPoints"]), 1)
        self.assertEqual(processed["exitPoints"][0]["id"], "exit1")
        
        # Check that sources are processed correctly
        self.assertEqual(len(processed["sources"]), 1)
        self.assertEqual(processed["sources"][0]["id"], "source1")
        self.assertEqual(processed["sources"][0]["agentCount"], 5)
        
        # Check that obstacles are processed correctly
        self.assertEqual(len(processed["obstacles"]), 1)
        self.assertEqual(processed["obstacles"][0]["id"], "obstacle1")
        
        # Check that waypoints are processed correctly
        self.assertEqual(len(processed["waypoints"]), 2)
        waypoint1 = next(wp for wp in processed["waypoints"] if wp["id"] == "waypoint1")
        self.assertEqual(len(waypoint1["connections"]), 1)
        self.assertEqual(waypoint1["connections"][0]["id"], "waypoint2")
        
        # Check that agents are generated
        self.assertTrue(len(processed["agents"]) > 0)
    
    def test_find_nearest_exit(self):
        """Test finding the nearest exit."""
        exits = [
            {
                "id": "exit1",
                "line": [
                    {"x": 90, "y": 50},
                    {"x": 100, "y": 50}
                ]
            },
            {
                "id": "exit2",
                "line": [
                    {"x": 0, "y": 50},
                    {"x": 10, "y": 50}
                ]
            }
        ]
        
        # Position closer to exit1
        position = {"x": 80, "y": 50}
        nearest = self.service._find_nearest_exit(position, exits)
        self.assertAlmostEqual(nearest["x"], 95)
        self.assertAlmostEqual(nearest["y"], 50)
        
        # Position closer to exit2
        position = {"x": 20, "y": 50}
        nearest = self.service._find_nearest_exit(position, exits)
        self.assertAlmostEqual(nearest["x"], 5)
        self.assertAlmostEqual(nearest["y"], 50)

if __name__ == '__main__':
    unittest.main()
