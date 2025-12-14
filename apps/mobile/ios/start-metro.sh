#!/usr/bin/env bash

# Script to start Metro bundler if it's not already running
# This is used as an Xcode build phase to ensure Metro is available

# Check if Metro is already running on port 8081
if lsof -Pi :8081 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "Metro bundler is already running on port 8081"
    exit 0
fi

echo "Starting Metro bundler..."

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
# Navigate to the mobile app directory (one level up from ios/)
MOBILE_DIR="$(dirname "$SCRIPT_DIR")"

# Change to mobile directory
cd "$MOBILE_DIR"

# Start Metro in the background, redirecting output to avoid blocking the build
nohup npm start > /dev/null 2>&1 &

# Give Metro a moment to start (non-blocking wait)
for i in {1..10}; do
    sleep 0.5
    if lsof -Pi :8081 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo "Metro bundler started successfully"
        exit 0
    fi
done

# If we get here, Metro didn't start in time, but that's okay
# The app will retry connecting when it runs
echo "Metro bundler is starting in the background..."
