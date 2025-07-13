#!/bin/bash

# QNAP Docker Build Script for Weather Synth
# This script builds a Docker image optimized for QNAP NAS systems

set -e

# Configuration
IMAGE_NAME="weather-synth"
TAG="qnap"
CONTAINER_NAME="weather-synth-qnap"
PORT="3000"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== QNAP Docker Build for Weather Synth ===${NC}"

# Check if we're in the right directory
if [ ! -f "Dockerfile" ]; then
    echo -e "${RED}Error: Dockerfile not found. Please run this script from the weather-synth directory.${NC}"
    exit 1
fi

# Check LaunchDarkly environment variables
echo -e "${BLUE}=== LaunchDarkly Configuration ===${NC}"
if [ -z "$REACT_APP_LAUNCHDARKLY_CLIENT_ID" ]; then
    echo -e "${YELLOW}⚠️ REACT_APP_LAUNCHDARKLY_CLIENT_ID not set, using placeholder${NC}"
else
    echo -e "${GREEN}✅ REACT_APP_LAUNCHDARKLY_CLIENT_ID is set${NC}"
fi

if [ -z "$LAUNCHDARKLY_SDK_KEY" ]; then
    echo -e "${YELLOW}⚠️ LAUNCHDARKLY_SDK_KEY not set, using demo key${NC}"
else
    echo -e "${GREEN}✅ LAUNCHDARKLY_SDK_KEY is set${NC}"
fi

echo ""

echo -e "${YELLOW}Building QNAP-compatible Docker image...${NC}"

# Build the Docker image for QNAP (linux/amd64 platform)
echo -e "${YELLOW}Building image: ${IMAGE_NAME}:${TAG}${NC}"
docker build -t ${IMAGE_NAME}:${TAG} --platform linux/amd64 .

# Check if build was successful
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Docker image built successfully for QNAP!${NC}"
    
    # Show image size
    echo -e "${YELLOW}Image size:${NC}"
    docker images ${IMAGE_NAME}:${TAG} --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
    
    # Create QNAP deployment instructions
    echo -e "${BLUE}=== QNAP Deployment Instructions ===${NC}"
    echo -e "${YELLOW}1. Save the image to a tar file:${NC}"
    echo -e "docker save ${IMAGE_NAME}:${TAG} > weather-synth-qnap.tar"
    echo ""
    echo -e "${YELLOW}2. Transfer the tar file to your QNAP NAS${NC}"
    echo -e "   - Use File Station or SCP to upload weather-synth-qnap.tar"
    echo ""
    echo -e "${YELLOW}3. On your QNAP NAS:${NC}"
    echo -e "   - Open Container Station"
    echo -e "   - Click 'Create' → 'Import'"
    echo -e "   - Select the weather-synth-qnap.tar file"
    echo -e "   - Set container name: ${CONTAINER_NAME}"
    echo -e "   - Set port mapping: ${PORT}:80"
    echo -e "   - Set restart policy: Always"
    echo ""
    echo -e "${YELLOW}4. Environment variables (required for LaunchDarkly):${NC}"
    echo -e "   NODE_ENV=production"
    echo -e "   PORT=3001"
    echo -e "   REACT_APP_LAUNCHDARKLY_CLIENT_ID=${REACT_APP_LAUNCHDARKLY_CLIENT_ID:-"your-client-sdk-key-here"}"
    echo -e "   LAUNCHDARKLY_SDK_KEY=${LAUNCHDARKLY_SDK_KEY:-"demo-server-key"}"
    echo ""
    echo -e "${YELLOW}5. Access your application:${NC}"
    echo -e "   http://your-qnap-ip:${PORT}"
    echo ""
    
    # Ask if user wants to save the image
    echo -e "${YELLOW}Do you want to save the image to a tar file for QNAP transfer? (y/n)${NC}"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo -e "${YELLOW}Saving image to weather-synth-qnap.tar...${NC}"
        docker save ${IMAGE_NAME}:${TAG} > weather-synth-qnap.tar
        echo -e "${GREEN}✅ Image saved to weather-synth-qnap.tar${NC}"
        echo -e "${YELLOW}File size:${NC}"
        ls -lh weather-synth-qnap.tar
    fi
    
else
    echo -e "${RED}❌ Docker build failed!${NC}"
    exit 1
fi 