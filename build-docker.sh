#!/bin/bash

# Weather Synth Docker Build Script
# This script builds and optionally runs the Docker image

set -e

# Configuration
IMAGE_NAME="weather-synth"
TAG="latest"
CONTAINER_NAME="weather-synth-app"
PORT="3000"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Building Weather Synth Docker Image...${NC}"

# Build the Docker image
echo -e "${YELLOW}Building image: ${IMAGE_NAME}:${TAG}${NC}"
docker build -t ${IMAGE_NAME}:${TAG} .

# Check if build was successful
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Docker image built successfully!${NC}"
    
    # Show image size
    echo -e "${YELLOW}Image size:${NC}"
    docker images ${IMAGE_NAME}:${TAG} --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
    
    # Ask if user wants to run the container
    echo -e "${YELLOW}Do you want to run the container? (y/n)${NC}"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo -e "${YELLOW}Starting container...${NC}"
        
        # Stop and remove existing container if it exists
        docker stop ${CONTAINER_NAME} 2>/dev/null || true
        docker rm ${CONTAINER_NAME} 2>/dev/null || true
        
        # Run the container
        docker run -d \
            --name ${CONTAINER_NAME} \
            -p ${PORT}:80 \
            --restart unless-stopped \
            ${IMAGE_NAME}:${TAG}
        
        echo -e "${GREEN}✅ Container started successfully!${NC}"
        echo -e "${YELLOW}Application is running at: http://localhost:${PORT}${NC}"
        echo -e "${YELLOW}Health check: http://localhost:${PORT}/health${NC}"
        
        # Show container status
        echo -e "${YELLOW}Container status:${NC}"
        docker ps --filter "name=${CONTAINER_NAME}" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        
    else
        echo -e "${YELLOW}To run the container manually:${NC}"
        echo -e "docker run -d --name ${CONTAINER_NAME} -p ${PORT}:80 ${IMAGE_NAME}:${TAG}"
    fi
    
else
    echo -e "${RED}❌ Docker build failed!${NC}"
    exit 1
fi 