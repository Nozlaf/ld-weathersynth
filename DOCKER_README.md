# Weather Synth Docker Setup

This Docker setup provides a lightweight, production-ready container for the Weather Synth application using Alpine Linux and Nginx as a reverse proxy.

## Architecture

- **Frontend**: React application built and served as static files by Nginx
- **Backend**: Node.js Express server running on port 3001
- **Reverse Proxy**: Nginx routes API calls to the backend and serves static files
- **Base Image**: Alpine Linux for minimal image size

## Features

- ✅ **Single Port**: Both frontend and backend accessible on port 80
- ✅ **Minimal Size**: Alpine Linux base for smallest possible image
- ✅ **Security**: Non-root user, security headers, proper proxy configuration
- ✅ **Performance**: Gzip compression, static asset caching, optimized Nginx config
- ✅ **Health Checks**: Built-in health monitoring
- ✅ **Production Ready**: Optimized for production deployment

## Quick Start

### Option 1: Using the Build Script (Recommended)

```bash
# Make the script executable (if not already done)
chmod +x build-docker.sh

# Build and optionally run the container
./build-docker.sh
```

### Option 2: Using Docker Compose

```bash
# Build and run with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the service
docker-compose down
```

### Option 3: Manual Docker Commands

```bash
# Build the image
docker build -t weather-synth:latest .

# Run the container
docker run -d \
  --name weather-synth-app \
  -p 3000:80 \
  --restart unless-stopped \
  weather-synth:latest

# Check container status
docker ps

# View logs
docker logs weather-synth-app
```

## Configuration

### Environment Variables

The application supports the following environment variables:

- `NODE_ENV`: Set to `production` for production builds
- `PORT`: Backend server port (default: 3001)
- `OPENWEATHER_API_KEY`: Your OpenWeather API key (if required)

### Port Mapping

- **Host Port**: 3000 (configurable)
- **Container Port**: 80 (Nginx)
- **Backend Port**: 3001 (internal, proxied by Nginx)

## Routing

- **Frontend**: All non-API routes serve the React application
- **API Routes**: `/api/*` routes are proxied to the Node.js backend
- **Health Check**: `/health` endpoint for container health monitoring
- **Static Assets**: Optimized caching for JS, CSS, images, and fonts

## SSL/TLS

Since this container sits behind another proxy, SSL termination should be handled by the upstream proxy. The Nginx configuration is optimized for this setup.

For direct SSL support, you can:

1. Mount SSL certificates as volumes
2. Update the Nginx configuration to listen on port 443
3. Add SSL configuration blocks

## Development

For development, you can use the development profile:

```bash
# Run development version
docker-compose --profile dev up -d weather-synth-dev
```

## Monitoring

### Health Checks

The container includes built-in health checks:

```bash
# Check container health
docker inspect weather-synth-app | grep Health -A 10

# Manual health check
curl http://localhost:3000/health
```

### Logs

```bash
# View application logs
docker logs weather-synth-app

# Follow logs in real-time
docker logs -f weather-synth-app

# View Nginx logs specifically
docker exec weather-synth-app tail -f /var/log/nginx/access.log
docker exec weather-synth-app tail -f /var/log/nginx/error.log
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Check what's using the port
   lsof -i :3000
   
   # Stop existing container
   docker stop weather-synth-app
   ```

2. **Build Failures**
   ```bash
   # Clean build cache
   docker system prune -a
   
   # Rebuild without cache
   docker build --no-cache -t weather-synth:latest .
   ```

3. **Backend Not Responding**
   ```bash
   # Check if backend is running
   docker exec weather-synth-app ps aux | grep node
   
   # Check backend logs
   docker exec weather-synth-app tail -f /app/server/logs/app.log
   ```

### Debug Mode

To run in debug mode with more verbose logging:

```bash
docker run -d \
  --name weather-synth-app \
  -p 3000:80 \
  -e NODE_ENV=development \
  weather-synth:latest
```

## Performance Optimization

The Docker image is optimized for:

- **Minimal Size**: Alpine Linux base (~5MB)
- **Layer Caching**: Efficient Docker layer ordering
- **Multi-stage Build**: Separate build and runtime stages
- **Asset Optimization**: Gzip compression and caching headers

## Security Features

- Non-root user execution
- Security headers (X-Frame-Options, CSP, etc.)
- Proper proxy configuration
- Minimal attack surface with Alpine Linux

## Deployment

### Production Deployment

```bash
# Build production image
docker build -t weather-synth:production .

# Run with production settings
docker run -d \
  --name weather-synth-prod \
  -p 80:80 \
  -e NODE_ENV=production \
  --restart unless-stopped \
  weather-synth:production
```

### Behind a Reverse Proxy

This container is designed to work behind another reverse proxy (like Traefik, HAProxy, or Cloud Load Balancer). The Nginx configuration includes proper headers for proxy communication.

## Image Size Comparison

- **Alpine Base**: ~5MB
- **Node.js Runtime**: ~40MB
- **Application**: ~50-100MB (depending on dependencies)
- **Total**: ~100-150MB (much smaller than Ubuntu-based images)

## Support

For issues or questions about the Docker setup, please refer to the main project documentation or create an issue in the repository. 