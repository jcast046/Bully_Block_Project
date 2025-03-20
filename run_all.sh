#!/bin/bash

# Start the server
echo "Starting the server..."
cd Backend || { echo "Failed to enter bullyblock-backend directory"; exit 1; }
npm start &
SERVER_PID=$!
echo "Server is running with PID: $SERVER_PID"

# Wait for the server to fully start before proceeding
sleep 10  

# Run PyTorch model training
echo "Running PyTorch model training..."
cd ../ai_algorithms || { echo "Failed to enter bullyblock-ai_algorithms directory"; exit 1; }
python pytorch_model_training.py
echo "Model training completed."

# Start the frontend
echo "Starting the frontend..."
cd ../bullyblock-dashboard || { echo "Failed to enter bullyblock-dashboard directory"; exit 1; }
npm start &
FRONTEND_PID=$!
echo "Frontend is running with PID: $FRONTEND_PID"

# Wait and keep script running so server and frontend remain active
wait $SERVER_PID $FRONTEND_PID
