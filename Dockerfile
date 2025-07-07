# Multi-stage Docker build for Weather Synth React App
# Stage 1: Build the React application
FROM node:18-alpine AS build

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

# Stage 2: Serve the application with Nginx
FROM nginx:alpine AS production

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy social preview image to nginx html directory
COPY --from=build /app/public/social-preview.png /usr/share/nginx/html/

# Expose port 80
EXPOSE 80

# Add labels for better container management
LABEL maintainer="Nozlaf"
LABEL description="Weather Synth - Retro 80s Weather Terminal App"
LABEL version="1.2.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# Start Nginx
CMD ["nginx", "-g", "daemon off;"] 