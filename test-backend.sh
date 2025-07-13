#!/bin/bash

# Test script to verify backend API is working in Docker container

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Backend API Test ===${NC}"

# Configuration
CONTAINER_NAME="weather-synth-app"
PORT="3000"
API_ENDPOINT="http://localhost:${PORT}/api/health"

echo -e "${YELLOW}Testing backend API at: ${API_ENDPOINT}${NC}"

# Check if container is running
if ! docker ps --format "table {{.Names}}" | grep -q "${CONTAINER_NAME}"; then
    echo -e "${RED}❌ Container ${CONTAINER_NAME} is not running!${NC}"
    echo -e "${YELLOW}To start the container:${NC}"
    echo -e "docker run -d --name ${CONTAINER_NAME} -p ${PORT}:80 weather-synth:latest"
    exit 1
fi

echo -e "${GREEN}✅ Container ${CONTAINER_NAME} is running${NC}"

# Test health endpoint
echo -e "${YELLOW}Testing health endpoint...${NC}"
if curl -f -s "${API_ENDPOINT}" > /dev/null; then
    echo -e "${GREEN}✅ Health endpoint is working${NC}"
else
    echo -e "${RED}❌ Health endpoint failed${NC}"
fi

# Test weather API endpoint (if available)
WEATHER_ENDPOINT="http://localhost:${PORT}/api/weather"
echo -e "${YELLOW}Testing weather API endpoint...${NC}"
if curl -f -s "${WEATHER_ENDPOINT}?lat=40.7128&lon=-74.0060" > /dev/null; then
    echo -e "${GREEN}✅ Weather API is working${NC}"
else
    echo -e "${YELLOW}⚠️ Weather API test failed (this might be expected if no API key)${NC}"
fi

# Check container logs for backend startup
echo -e "${YELLOW}Checking container logs for backend startup...${NC}"
if docker logs "${CONTAINER_NAME}" 2>&1 | grep -q "PORT=3001\|listening on port 3001"; then
    echo -e "${GREEN}✅ Backend is running on port 3001${NC}"
else
    echo -e "${RED}❌ Backend port configuration issue detected${NC}"
    echo -e "${YELLOW}Container logs:${NC}"
    docker logs "${CONTAINER_NAME}" | tail -10
fi

# Test direct backend access (if possible)
echo -e "${YELLOW}Testing direct backend access...${NC}"
if docker exec "${CONTAINER_NAME}" wget --quiet --tries=1 --spider http://localhost:3001/api/health; then
    echo -e "${GREEN}✅ Direct backend access on port 3001 is working${NC}"
else
    echo -e "${RED}❌ Direct backend access failed${NC}"
fi

echo -e "${BLUE}=== Test Complete ===${NC}"
echo -e "${YELLOW}If you see any ❌ errors above, the backend configuration needs to be fixed.${NC}"
echo -e "${YELLOW}Make sure the PORT environment variable is set to 3001 in your Docker setup.${NC}" 