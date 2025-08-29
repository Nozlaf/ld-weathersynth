# Multi-stage Docker build for Weather Synth with Nginx reverse proxy
# Stage 1: Build the React application
FROM node:18-alpine AS frontend-build

# Accept build arguments for LaunchDarkly keys
ARG REACT_APP_LAUNCHDARKLY_CLIENT_ID
ARG LAUNCHDARKLY_SDK_KEY
ARG REACT_APP_OPENWEATHER_API_KEY
ARG REACT_APP_VISUALCROSSING_API_KEY
ARG REACT_APP_WEATHERAPI_API_KEY
ARG REACT_APP_TOMORROWIO_API_KEY
ARG OPENWEATHER_API_KEY
ARG VISUAL_CROSSING_API_KEY
ARG REACT_APP_GA_MEASUREMENT_ID
ENV REACT_APP_LAUNCHDARKLY_CLIENT_ID=$REACT_APP_LAUNCHDARKLY_CLIENT_ID
ENV LAUNCHDARKLY_SDK_KEY=$LAUNCHDARKLY_SDK_KEY
ENV REACT_APP_OPENWEATHER_API_KEY=$REACT_APP_OPENWEATHER_API_KEY
ENV REACT_APP_VISUALCROSSING_API_KEY=$REACT_APP_VISUALCROSSING_API_KEY
ENV REACT_APP_WEATHERAPI_API_KEY=$REACT_APP_WEATHERAPI_API_KEY
ENV REACT_APP_TOMORROWIO_API_KEY=$REACT_APP_TOMORROWIO_API_KEY
ENV OPENWEATHER_API_KEY=$OPENWEATHER_API_KEY
ENV VISUAL_CROSSING_API_KEY=$VISUAL_CROSSING_API_KEY
ENV REACT_APP_GA_MEASUREMENT_ID=$REACT_APP_GA_MEASUREMENT_ID

# Set working directory
WORKDIR /app

# Copy only package files first for better layer caching
COPY package*.json ./
RUN npm ci && npm cache clean --force

# Copy the rest of the frontend source
COPY . .

# Build the application
RUN npm run build

# Stage 2: Backend Server Setup
FROM node:18-alpine AS backend-build

# Set working directory
WORKDIR /app/server

# Copy only backend package files for better layer caching
COPY server/package*.json ./
RUN npm ci --only=production && npm prune --production && npm cache clean --force

# Copy only the backend source files needed to run
COPY server/server.js ./
COPY server/weatherProviders.js ./

# Stage 3: Final production image with Nginx
FROM nginx:alpine

# Accept build arguments for LaunchDarkly keys in final stage
ARG REACT_APP_LAUNCHDARKLY_CLIENT_ID
ARG LAUNCHDARKLY_SDK_KEY
ARG REACT_APP_OPENWEATHER_API_KEY
ARG REACT_APP_VISUALCROSSING_API_KEY
ARG REACT_APP_WEATHERAPI_API_KEY
ARG REACT_APP_TOMORROWIO_API_KEY
ARG OPENWEATHER_API_KEY
ARG VISUAL_CROSSING_API_KEY
ARG REACT_APP_GA_MEASUREMENT_ID
ENV REACT_APP_LAUNCHDARKLY_CLIENT_ID=$REACT_APP_LAUNCHDARKLY_CLIENT_ID
ENV LAUNCHDARKLY_SDK_KEY=$LAUNCHDARKLY_SDK_KEY
ENV REACT_APP_OPENWEATHER_API_KEY=$REACT_APP_OPENWEATHER_API_KEY
ENV REACT_APP_VISUALCROSSING_API_KEY=$REACT_APP_VISUALCROSSING_API_KEY
ENV REACT_APP_WEATHERAPI_API_KEY=$REACT_APP_WEATHERAPI_API_KEY
ENV REACT_APP_TOMORROWIO_API_KEY=$REACT_APP_TOMORROWIO_API_KEY
ENV OPENWEATHER_API_KEY=$OPENWEATHER_API_KEY
ENV VISUAL_CROSSING_API_KEY=$VISUAL_CROSSING_API_KEY
ENV REACT_APP_GA_MEASUREMENT_ID=$REACT_APP_GA_MEASUREMENT_ID

# Install Node.js for the backend (use same version as build)
RUN apk add --no-cache nodejs npm

# Create app directory structure
WORKDIR /app

# Copy built React app to nginx html directory and app directory
COPY --from=frontend-build /app/build /usr/share/nginx/html
COPY --from=frontend-build /app/build /app/build

# Copy backend files and dependencies (only what's needed)
COPY --from=backend-build /app/server/node_modules ./server/node_modules
COPY --from=backend-build /app/server/server.js ./server/
COPY --from=backend-build /app/server/weatherProviders.js ./server/
COPY server/package*.json ./server/

# Copy custom nginx configuration
COPY nginx.prod.conf /etc/nginx/nginx.conf

# Create runtime configuration script
RUN echo '#!/bin/sh' > /inject-env.sh && \
    echo 'set -e' >> /inject-env.sh && \
    echo 'echo "Injecting environment variables into built files..."' >> /inject-env.sh && \
    echo 'for file in /usr/share/nginx/html/static/js/*.js; do' >> /inject-env.sh && \
    echo '  if [ -f "$file" ]; then' >> /inject-env.sh && \
    echo '    echo "Processing $file"' >> /inject-env.sh && \
    echo '    sed -i "s|demo-key-placeholder|${REACT_APP_LAUNCHDARKLY_CLIENT_ID}|g" "$file"' >> /inject-env.sh && \
    echo '  fi' >> /inject-env.sh && \
    echo 'done' >> /inject-env.sh && \
    echo 'echo "Environment variables injected successfully"' >> /inject-env.sh && \
    chmod +x /inject-env.sh

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Create startup script
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'export PORT=3001' >> /start.sh && \
    echo 'export NODE_ENV=production' >> /start.sh && \
    echo 'export LAUNCHDARKLY_SDK_KEY=${LAUNCHDARKLY_SDK_KEY}' >> /start.sh && \
    echo 'export REACT_APP_LAUNCHDARKLY_CLIENT_ID=${REACT_APP_LAUNCHDARKLY_CLIENT_ID}' >> /start.sh && \
    echo 'echo "Starting Weather Synth..."' >> /start.sh && \
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
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start both nginx and backend server
CMD ["/start.sh"] 