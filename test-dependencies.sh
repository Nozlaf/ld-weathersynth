#!/bin/bash

# Test script to verify backend dependencies are properly installed

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Backend Dependencies Test ===${NC}"

# Configuration
CONTAINER_NAME="weather-synth-app"

# Check if container is running
if ! docker ps --format "table {{.Names}}" | grep -q "${CONTAINER_NAME}"; then
    echo -e "${RED}❌ Container ${CONTAINER_NAME} is not running!${NC}"
    echo -e "${YELLOW}To start the container:${NC}"
    echo -e "docker run -d --name ${CONTAINER_NAME} -p 3000:80 weather-synth:latest"
    exit 1
fi

echo -e "${GREEN}✅ Container ${CONTAINER_NAME} is running${NC}"

# Test 1: Check if node_modules exists
echo -e "${YELLOW}1. Checking node_modules...${NC}"
if docker exec "${CONTAINER_NAME}" test -d "/app/server/node_modules"; then
    echo -e "${GREEN}✅ node_modules directory exists${NC}"
else
    echo -e "${RED}❌ node_modules directory missing${NC}"
fi

# Test 2: Check if key dependencies are installed
echo -e "${YELLOW}2. Checking key dependencies...${NC}"

dependencies=("express" "cors" "helmet" "launchdarkly-node-server-sdk" "node-fetch" "dotenv")

for dep in "${dependencies[@]}"; do
    if docker exec "${CONTAINER_NAME}" test -d "/app/server/node_modules/${dep}"; then
        echo -e "${GREEN}✅ ${dep} is installed${NC}"
    else
        echo -e "${RED}❌ ${dep} is missing${NC}"
    fi
done

# Test 3: Check if server files exist
echo -e "${YELLOW}3. Checking server files...${NC}"
if docker exec "${CONTAINER_NAME}" test -f "/app/server/server.js"; then
    echo -e "${GREEN}✅ server.js exists${NC}"
else
    echo -e "${RED}❌ server.js missing${NC}"
fi

if docker exec "${CONTAINER_NAME}" test -f "/app/server/weatherProviders.js"; then
    echo -e "${GREEN}✅ weatherProviders.js exists${NC}"
else
    echo -e "${RED}❌ weatherProviders.js missing${NC}"
fi

# Test 4: Check Node.js version
echo -e "${YELLOW}4. Checking Node.js version...${NC}"
NODE_VERSION=$(docker exec "${CONTAINER_NAME}" node --version)
echo -e "${GREEN}✅ Node.js version: ${NODE_VERSION}${NC}"

# Test 5: Try to require modules manually
echo -e "${YELLOW}5. Testing module loading...${NC}"
if docker exec "${CONTAINER_NAME}" node -e "require('express'); console.log('✅ express loaded');"; then
    echo -e "${GREEN}✅ express module loads successfully${NC}"
else
    echo -e "${RED}❌ express module failed to load${NC}"
fi

if docker exec "${CONTAINER_NAME}" node -e "require('launchdarkly-node-server-sdk'); console.log('✅ launchdarkly-node-server-sdk loaded');"; then
    echo -e "${GREEN}✅ launchdarkly-node-server-sdk module loads successfully${NC}"
else
    echo -e "${RED}❌ launchdarkly-node-server-sdk module failed to load${NC}"
fi

# Test 6: Try to start server manually
echo -e "${YELLOW}6. Testing server startup...${NC}"
if docker exec "${CONTAINER_NAME}" timeout 10s sh -c "cd /app/server && PORT=3001 node server.js" 2>&1 | grep -q "listening\|error\|timeout"; then
    echo -e "${GREEN}✅ Server starts without immediate errors${NC}"
else
    echo -e "${RED}❌ Server startup failed${NC}"
fi

echo -e "${BLUE}=== Test Complete ===${NC}"
echo -e "${YELLOW}If you see any ❌ errors above, rebuild the Docker image:${NC}"
echo -e "docker build -t weather-synth:latest ." 