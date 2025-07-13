# Multi-stage Docker build for Weather Synth with Nginx reverse proxy
# Stage 1: Build the React application
FROM node:18-alpine AS frontend-build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Backend Server Setup
FROM node:18-alpine AS backend-build

# Set working directory
WORKDIR /app/server

# Copy server package files
COPY server/package*.json ./

# Install server dependencies
RUN npm ci --only=production

# Copy server source files
COPY server/server.js ./
COPY server/weatherProviders.js ./

# Stage 3: Final production image with Nginx
FROM nginx:alpine

# Install Node.js for the backend (use same version as build)
RUN apk add --no-cache nodejs npm

# Create app directory structure
WORKDIR /app

# Copy built React app to nginx html directory
COPY --from=frontend-build /app/build /usr/share/nginx/html

# Copy backend files and dependencies
COPY --from=backend-build /app/server/node_modules ./server/node_modules
COPY --from=backend-build /app/server/server.js ./server/
COPY --from=backend-build /app/server/weatherProviders.js ./server/
COPY server/package*.json ./server/

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create runtime configuration script
RUN echo '#!/bin/sh' > /inject-env.sh && \
    echo 'set -e' >> /inject-env.sh && \
    echo 'echo "Injecting environment variables into built files..."' >> /inject-env.sh && \
    echo 'for file in /usr/share/nginx/html/static/js/*.js; do' >> /inject-env.sh && \
    echo '  if [ -f "$file" ]; then' >> /inject-env.sh && \
    echo '    echo "Processing $file"' >> /inject-env.sh && \
    echo '    sed -i "s|demo-key-placeholder|${REACT_APP_LAUNCHDARKLY_CLIENT_ID}|g" "$file"' >> /inject-env.sh && \
    echo '    sed -i "s|demo-key-placeholder|${REACT_APP_LAUNCHDARKLY_CLIENT_ID}|g" "$file"' >> /inject-env.sh && \
    echo '  fi' >> /inject-env.sh && \
    echo 'done' >> /inject-env.sh && \
    echo 'echo "Environment variables injected successfully"' >> /inject-env.sh && \
    chmod +x /inject-env.sh

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of app directory
RUN chown -R nodejs:nodejs /app

# Create startup script with LaunchDarkly environment variables
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'export PORT=3001' >> /start.sh && \
    echo 'export NODE_ENV=production' >> /start.sh && \
    echo 'export LAUNCHDARKLY_SDK_KEY=${LAUNCHDARKLY_SDK_KEY}' >> /start.sh && \
    echo 'export REACT_APP_LAUNCHDARKLY_CLIENT_ID=${REACT_APP_LAUNCHDARKLY_CLIENT_ID}' >> /start.sh && \
    echo 'echo "Starting Weather Synth with environment variables..."' >> /start.sh && \
    echo 'echo "LAUNCHDARKLY_SDK_KEY: ${LAUNCHDARKLY_SDK_KEY:-NOT_SET}"' >> /start.sh && \
    echo 'echo "REACT_APP_LAUNCHDARKLY_CLIENT_ID: ${REACT_APP_LAUNCHDARKLY_CLIENT_ID:-NOT_SET}"' >> /start.sh && \
    echo '/inject-env.sh' >> /start.sh && \
    echo 'cd /app/server && node server.js &' >> /start.sh && \
    echo 'nginx -g "daemon off;"' >> /start.sh && \
    chmod +x /start.sh

# Expose port 80
EXPOSE 80

# Add labels for better container management
LABEL maintainer="Nozlaf"
LABEL description="Weather Synth - Retro 80s Weather Terminal App with Nginx Reverse Proxy"
LABEL version="1.2.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

# Start both nginx and backend server
CMD ["/start.sh"] 