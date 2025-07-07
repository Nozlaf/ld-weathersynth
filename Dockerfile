# Multi-stage Docker build for Weather Synth with Backend API
# Stage 1: Build the React application
FROM node:18-alpine AS frontend-build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for building)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Backend Server Setup
FROM node:18-alpine AS backend-build

WORKDIR /app/server

# Copy server package files
COPY server/package*.json ./

# Install server dependencies
RUN npm ci --only=production

# Stage 3: Production with Node.js backend server
FROM node:18-alpine AS production

# Install curl for health checks
RUN apk add --no-cache curl

WORKDIR /app

# Copy built React app from frontend builder
COPY --from=frontend-build /app/build ./build

# Copy server files and dependencies
COPY --from=backend-build /app/server/node_modules ./server/node_modules
COPY server/server.js ./server/
COPY server/package*.json ./server/

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of app directory
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port 3001 (backend server)
EXPOSE 3001

# Add labels for better container management
LABEL maintainer="Nozlaf"
LABEL description="Weather Synth - Retro 80s Weather Terminal App with Backend API"
LABEL version="1.2.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# Start the backend server (serves both API and static files)
CMD ["node", "server/server.js"] 