#!/bin/bash
# Script to start both the JuPedSim backend and frontend

# Start the backend in the background
echo "Starting backend..."
./start-backend.sh &
BACKEND_PID=$!

# Wait for the backend to start
echo "Waiting for backend to start..."
sleep 5

# Start the frontend
echo "Starting frontend..."
./start-frontend.sh

# When the frontend is stopped, also stop the backend
echo "Stopping backend..."
kill $BACKEND_PID
