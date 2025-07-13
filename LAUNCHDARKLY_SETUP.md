# LaunchDarkly Configuration for Docker

This document explains how to configure LaunchDarkly environment variables for the Weather Synth Docker deployment.

## Environment Variables

The application uses two different LaunchDarkly SDK keys:

### 1. Frontend (React) - Client-side SDK
- **Variable:** `REACT_APP_LAUNCHDARKLY_CLIENT_ID`
- **Purpose:** Client-side feature flag evaluation and user context
- **Default:** `your-client-sdk-key-here` (placeholder)
- **Usage:** React components, user interface features

### 2. Backend (Node.js) - Server-side SDK
- **Variable:** `LAUNCHDARKLY_SDK_KEY`
- **Purpose:** Server-side feature flag evaluation and metrics
- **Default:** `demo-server-key` (demo key)
- **Usage:** API endpoints, weather provider configuration

## Configuration Methods

### Method 1: Environment Variables (Recommended)

Set environment variables before building/running:

```bash
# Set your LaunchDarkly keys
export REACT_APP_LAUNCHDARKLY_CLIENT_ID="your-client-sdk-key"
export LAUNCHDARKLY_SDK_KEY="your-server-sdk-key"

# Build and run
./build-docker.sh
```

### Method 2: Docker Run with Environment Variables

```bash
docker run -d \
  --name weather-synth-app \
  -p 3000:80 \
  -e REACT_APP_LAUNCHDARKLY_CLIENT_ID="your-client-sdk-key" \
  -e LAUNCHDARKLY_SDK_KEY="your-server-sdk-key" \
  weather-synth:latest
```

### Method 3: Docker Compose

Create a `.env` file:
```env
REACT_APP_LAUNCHDARKLY_CLIENT_ID=your-client-sdk-key
LAUNCHDARKLY_SDK_KEY=your-server-sdk-key
```

Then run:
```bash
docker-compose up -d
```

### Method 4: QNAP Container Station

When creating the container in QNAP Container Station:

1. **Environment Variables section:**
   - `REACT_APP_LAUNCHDARKLY_CLIENT_ID`: your-client-sdk-key
   - `LAUNCHDARKLY_SDK_KEY`: your-server-sdk-key
   - `NODE_ENV`: production
   - `PORT`: 3001

## Getting Your LaunchDarkly Keys

### 1. Client-side SDK Key (Frontend)
1. Log into your LaunchDarkly dashboard
2. Go to **Account Settings** → **Projects**
3. Select your project
4. Go to **Environments** → **Production** (or your target environment)
5. Copy the **Client-side ID** (not the SDK key)

### 2. Server-side SDK Key (Backend)
1. In the same environment settings
2. Copy the **Server-side SDK key**
3. This key has more permissions and should be kept secure

## Default Configuration

If no environment variables are set, the application uses these defaults:

- **Frontend:** `your-client-sdk-key-here` (placeholder)
- **Backend:** `demo-server-key` (demo key)

⚠️ **Warning:** Placeholder and demo keys have limited functionality and are not suitable for production use.

## Testing Configuration

### 1. Check Environment Variables in Container

```bash
# Check if variables are set
docker exec weather-synth-app env | grep LAUNCHDARKLY
```

### 2. Test Frontend LaunchDarkly Connection

1. Open your application in a browser
2. Open Developer Tools → Console
3. Look for LaunchDarkly connection messages
4. Check for any error messages

### 3. Test Backend LaunchDarkly Connection

```bash
# Check backend logs
docker logs weather-synth-app | grep LaunchDarkly
```

Expected output:
```
🚀 LaunchDarkly server SDK initialized successfully
```

## Troubleshooting

### Frontend Issues

**Problem:** "LaunchDarkly SDK key not found"
**Solution:** Set `REACT_APP_LAUNCHDARKLY_CLIENT_ID` environment variable

**Problem:** Feature flags not loading
**Solution:** 
1. Verify the client key is correct
2. Check network connectivity to LaunchDarkly
3. Verify the environment in LaunchDarkly dashboard

### Backend Issues

**Problem:** "LaunchDarkly server SDK initialization failed"
**Solution:** Set `LAUNCHDARKLY_SDK_KEY` environment variable

**Problem:** Weather provider configuration not working
**Solution:** 
1. Verify the server key is correct
2. Check LaunchDarkly feature flag configuration
3. Review backend logs for errors

### General Issues

**Problem:** Environment variables not being read
**Solution:** 
1. Rebuild the Docker image after setting variables
2. Ensure variables are set before running the container
3. Check Docker Compose `.env` file format

## Security Considerations

1. **Never commit real SDK keys to version control**
2. **Use different keys for different environments** (dev, staging, prod)
3. **Rotate keys regularly** for production environments
4. **Use LaunchDarkly's relay proxy** for high-security environments
5. **Monitor LaunchDarkly usage** and costs

## Production Deployment

For production deployments:

1. **Use real LaunchDarkly keys** (not placeholder or demo keys)
2. **Set up proper environment separation**
3. **Configure LaunchDarkly relay proxy** if needed
4. **Monitor LaunchDarkly metrics and costs**
5. **Set up alerts for LaunchDarkly service issues**

## Example Production Setup

```bash
# Production environment variables
export REACT_APP_LAUNCHDARKLY_CLIENT_ID="prod-client-key-123"
export LAUNCHDARKLY_SDK_KEY="prod-server-key-456"
export NODE_ENV="production"

# Build and deploy
./build-docker.sh
```

## Support

For LaunchDarkly-specific issues:
- [LaunchDarkly Documentation](https://docs.launchdarkly.com/)
- [LaunchDarkly Support](https://support.launchdarkly.com/)

For application-specific issues:
- Check the main project documentation
- Review container logs for error messages 