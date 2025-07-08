# 🐳 Docker Deployment Guide for Weather Synth

This guide will help you deploy the Weather Synth application using Docker for production environments.

## 📋 Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 2GB RAM available
- Port 3000 available (or modify in docker-compose.yml)

## 🚀 Quick Start

### 1. Clone and Build

```bash
# Clone the repository
git clone https://github.com/Nozlaf/ld-weathersynth.git
cd weather-synth

# Build and run with Docker Compose
docker-compose up -d
```

### 2. Access the Application

- **Local:** http://localhost:3000
- **Health Check:** http://localhost:3000/api/health

## 🔧 Manual Docker Commands

### Build the Image

```bash
# Build the Docker image
docker build -t weather-synth:latest .

# Or build with specific tag
docker build -t weather-synth:1.2.0 .
```

### Run the Container

```bash
# Run the container
docker run -d \
  --name weather-synth-app \
  --restart unless-stopped \
  -p 3000:3001 \
  weather-synth:latest

# Run with environment variables
docker run -d \
  --name weather-synth-app \
  --restart unless-stopped \
  -p 3000:3001 \
  -e NODE_ENV=production \
  -e OPENWEATHER_API_KEY=your_api_key_here \
  weather-synth:latest
```

## 📦 Production Deployment

### Environment Variables

Create a `.env` file for production:

```env
# Production environment
NODE_ENV=production

# Optional: Custom port
PORT=3000

# Backend API Keys (server-side only)
OPENWEATHER_API_KEY=your_api_key_here

# Frontend API Keys (client-side)
REACT_APP_LAUNCHDARKLY_CLIENT_ID=your_client_id_here
```

### Docker Compose Production

```yaml
version: '3.8'

services:
  weather-synth:
    build: .
    image: weather-synth:latest
    container_name: weather-synth-prod
    restart: unless-stopped
    ports:
      - "80:3001"  # Production port
    environment:
      - NODE_ENV=production
      - OPENWEATHER_API_KEY=your_api_key_here
    volumes:
      - ./logs:/app/logs
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## 🔍 Monitoring & Debugging

### Check Container Status

```bash
# View running containers
docker ps

# Check container logs
docker logs weather-synth-app

# Follow logs in real-time
docker logs -f weather-synth-app

# Check container resource usage
docker stats weather-synth-app
```

### Access Container Shell

```bash
# Access the container shell
docker exec -it weather-synth-app /bin/sh

# View server configuration
docker exec -it weather-synth-app cat /app/server/server.js
```

### Health Checks

```bash
# Manual health check
curl http://localhost:3000/api/health

# Docker health check status
docker inspect weather-synth-app | grep -A 10 "Health"
```

## 🔒 Security Features

### Built-in Security Headers

- **X-Frame-Options:** Prevents clickjacking
- **X-Content-Type-Options:** Prevents MIME type sniffing
- **X-XSS-Protection:** Enables XSS filtering
- **Content-Security-Policy:** Restricts resource loading
- **Referrer-Policy:** Controls referrer information

### Backend API Security

- **Rate Limiting:** Prevents API abuse (30 requests/minute per IP)
- **Input Validation:** Validates coordinates and parameters
- **Server-side API Keys:** No client-side exposure
- **CORS Configuration:** Controls cross-origin requests
- **Health Check Endpoint:** For load balancer integration
- **Error Page Handling:** Graceful error responses

## 🚀 Advanced Deployment

### With Reverse Proxy (Traefik)

```bash
# Enable Traefik in docker-compose.yml
# Uncomment the traefik service section
docker-compose up -d
```

### With Custom Domain

```yaml
services:
  weather-synth:
    # ... existing config
    labels:
      - "traefik.http.routers.weather-synth.rule=Host(`weather.yourdomain.com`)"
      - "traefik.http.routers.weather-synth.tls=true"
      - "traefik.http.routers.weather-synth.tls.certresolver=letsencrypt"
```

### Multi-stage Build Optimization

The Dockerfile uses multi-stage builds to:
- **Frontend Build Stage:** Compile React app with Node.js
- **Backend Build Stage:** Install server dependencies  
- **Production Stage:** Serve with Node.js backend + static files
- **Result:** ~100MB production image with secure API proxy

## 📊 Performance Optimization

### Image Size Optimization

```bash
# Check image size
docker images weather-synth

# Remove unused images
docker image prune -a
```

### Container Resources

```yaml
services:
  weather-synth:
    # ... existing config
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'
```

## 🔧 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Change port in docker-compose.yml
   ports:
     - "3001:80"  # Use different port
   ```

2. **Build Fails**
   ```bash
   # Clean build cache
   docker builder prune
   
   # Build with no cache
   docker build --no-cache -t weather-synth:latest .
   ```

3. **Container Won't Start**
   ```bash
   # Check logs
   docker logs weather-synth-app
   
   # Check health status
   docker inspect weather-synth-app
   ```

### Log Locations

- **Nginx Access Logs:** `/var/log/nginx/access.log`
- **Nginx Error Logs:** `/var/log/nginx/error.log`
- **Container Logs:** `docker logs weather-synth-app`

## 🛠️ Maintenance

### Update Deployment

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Or with zero downtime
docker-compose build
docker-compose up -d --no-deps weather-synth
```

### Backup & Recovery

```bash
# Export container
docker export weather-synth-app > weather-synth-backup.tar

# Import container
docker import weather-synth-backup.tar weather-synth:backup
```

## 📈 Scaling

### Multiple Instances

```yaml
services:
  weather-synth:
    # ... existing config
    deploy:
      replicas: 3
    ports:
      - "3000:80"
```

### Load Balancer Integration

The application includes:
- Health check endpoint at `/health`
- Graceful error handling
- Static asset optimization
- Proper HTTP response codes

## 🎯 Best Practices

1. **Always use multi-stage builds** for React applications
2. **Set proper health checks** for container orchestration
3. **Use .dockerignore** to optimize build context
4. **Set resource limits** to prevent container resource exhaustion
5. **Use specific image tags** instead of `latest` in production
6. **Monitor container logs** and set up log rotation
7. **Keep security headers** enabled in Nginx configuration

## 📝 Notes

- The application runs on port 80 inside the container
- Static assets are cached for 1 year for optimal performance
- React Router is properly configured for SPA routing
- Social media preview images are served with proper caching headers
- All environment variables are handled securely

---

🌊 **Weather Synth** - Ready for production deployment with Docker! ⚡ 