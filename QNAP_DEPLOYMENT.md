# QNAP Deployment Guide for Weather Synth

This guide will help you deploy the Weather Synth application on your QNAP NAS using Docker.

## Prerequisites

- QNAP NAS with Container Station installed
- SSH access to your QNAP (optional, for advanced users)
- Docker image file: `weather-synth-qnap.tar`

## Method 1: Using Container Station GUI (Recommended)

### Step 1: Prepare the Docker Image

1. **Build the image on your development machine:**
   ```bash
   # Run the QNAP build script
   ./build-qnap.sh
   ```

2. **Transfer the image to your QNAP:**
   - Use File Station to upload `weather-synth-qnap.tar`
   - Or use SCP: `scp weather-synth-qnap.tar admin@your-qnap-ip:/share/Container/`

### Step 2: Import and Deploy

1. **Open Container Station on your QNAP**
   - Go to QTS → Container Station

2. **Import the Docker Image:**
   - Click "Create" → "Import"
   - Select "Import from file"
   - Choose `weather-synth-qnap.tar`
   - Click "Import"

3. **Create the Container:**
   - Click "Create" → "Application"
   - Search for "weather-synth:qnap"
   - Click "Install"

4. **Configure the Container:**
   - **Container Name:** `weather-synth-qnap`
   - **Port:** `3000:80` (Host:Container)
   - **Restart Policy:** Always
   - **Environment Variables:**
     - `NODE_ENV=production`
     - `PORT=3001`

5. **Resource Limits (Optional):**
   - **Memory:** 512MB
   - **CPU:** 0.5 cores

6. **Click "Create" to deploy**

## Method 2: Using SSH and Docker CLI

### Step 1: Enable SSH on QNAP

1. Go to QTS → Control Panel → Network & File Services → Telnet/SSH
2. Enable SSH service
3. Note your QNAP's IP address

### Step 2: Transfer and Deploy

1. **SSH into your QNAP:**
   ```bash
   ssh admin@your-qnap-ip
   ```

2. **Transfer the image:**
   ```bash
   # From your development machine
   scp weather-synth-qnap.tar admin@your-qnap-ip:/share/Container/
   ```

3. **Load the image:**
   ```bash
   # On QNAP via SSH
   cd /share/Container
   docker load < weather-synth-qnap.tar
   ```

4. **Run the container:**
   ```bash
   docker run -d \
     --name weather-synth-qnap \
     --restart unless-stopped \
     -p 3000:80 \
     -e NODE_ENV=production \
     -e PORT=3001 \
     --memory=512m \
     --cpus=0.5 \
     weather-synth:qnap
   ```

## Method 3: Using Docker Compose

1. **Upload docker-compose.qnap.yml to your QNAP**
2. **SSH into your QNAP and run:**
   ```bash
   cd /share/Container
   docker-compose -f docker-compose.qnap.yml up -d
   ```

## Accessing Your Application

Once deployed, access your Weather Synth application at:
```
http://your-qnap-ip:3000
```

## Monitoring and Management

### Container Station GUI
- View logs: Container Station → Containers → weather-synth-qnap → Logs
- Monitor resources: Container Station → Containers → weather-synth-qnap → Resource Usage
- Restart container: Container Station → Containers → weather-synth-qnap → Actions → Restart

### SSH Commands
```bash
# View logs
docker logs weather-synth-qnap

# Check container status
docker ps

# Restart container
docker restart weather-synth-qnap

# Stop container
docker stop weather-synth-qnap

# Remove container
docker rm weather-synth-qnap
```

## Troubleshooting

### Container Won't Start
1. Check logs: `docker logs weather-synth-qnap`
2. Verify port 3000 is not in use: `netstat -tulpn | grep 3000`
3. Check resource usage in Container Station

### Can't Access the Application
1. Verify the container is running: `docker ps`
2. Check port mapping: `docker port weather-synth-qnap`
3. Test connectivity: `curl http://localhost:3000/health`
4. Check QNAP firewall settings

### Performance Issues
1. Increase memory limit in Container Station
2. Check QNAP CPU and memory usage
3. Consider running during off-peak hours

## Backup and Updates

### Backup
```bash
# Export container configuration
docker inspect weather-synth-qnap > weather-synth-backup.json

# Save the image
docker save weather-synth:qnap > weather-synth-backup.tar
```

### Updates
1. Build new image on development machine
2. Transfer new image to QNAP
3. Stop old container: `docker stop weather-synth-qnap`
4. Remove old container: `docker rm weather-synth-qnap`
5. Load new image: `docker load < weather-synth-new.tar`
6. Run new container with same configuration

## Security Considerations

- Change default QNAP admin password
- Use HTTPS if exposing to internet
- Regularly update QNAP firmware
- Monitor container logs for suspicious activity
- Consider using QNAP's built-in firewall

## Support

For issues specific to:
- **QNAP Container Station:** Check QNAP documentation
- **Weather Synth Application:** Check the main project documentation
- **Docker Issues:** Check Docker logs and QNAP system logs 