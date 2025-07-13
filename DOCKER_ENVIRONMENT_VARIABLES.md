# Docker Environment Variables Setup

## Overview

The Weather Synth Docker container now supports runtime environment variable injection, allowing you to configure LaunchDarkly and other services without rebuilding the image.

## Environment Variables

### Required Variables

- `LAUNCHDARKLY_SDK_KEY`: Your LaunchDarkly server-side SDK key
- `REACT_APP_LAUNCHDARKLY_CLIENT_ID`: Your LaunchDarkly client-side SDK key

### Optional Variables

- `REACT_APP_OPENWEATHER_API_KEY`: OpenWeather API key (if using OpenWeather provider)
- `REACT_APP_VERSION`: Application version (defaults to 1.2.0)
- `REACT_APP_LD_BASE_URL`: Custom LaunchDarkly base URL
- `REACT_APP_LD_STREAM_URL`: Custom LaunchDarkly stream URL
- `REACT_APP_LD_EVENTS_URL`: Custom LaunchDarkly events URL
- `REACT_APP_GA_MEASUREMENT_ID`: Google Analytics Measurement ID

## How It Works

1. **Build Time**: The React app is built with placeholder values
2. **Runtime**: The container startup script injects actual environment variables into the HTML
3. **Application**: The app reads configuration from the injected runtime config

## Usage Examples

### Docker Compose

```yaml
version: '3.8'
services:
  weather-synth:
    image: weather-synth:qnap
    environment:
      - LAUNCHDARKLY_SDK_KEY=your-server-sdk-key
      - REACT_APP_LAUNCHDARKLY_CLIENT_ID=your-client-sdk-key
      - REACT_APP_OPENWEATHER_API_KEY=your-openweather-key
    ports:
      - "3000:80"
```

### Docker Run

```bash
docker run -d \
  -e LAUNCHDARKLY_SDK_KEY=your-server-sdk-key \
  -e REACT_APP_LAUNCHDARKLY_CLIENT_ID=your-client-sdk-key \
  -e REACT_APP_OPENWEATHER_API_KEY=your-openweather-key \
  -p 3000:80 \
  weather-synth:qnap
```

### QNAP Container Station

1. Create a new container from the `weather-synth:qnap` image
2. In the "Environment" tab, add the required environment variables
3. Set the port mapping to `3000:80`
4. Start the container

## Troubleshooting

### Environment Variables Not Working

1. **Check container logs**: Look for the startup messages showing environment variable values
2. **Verify injection**: Check the browser console for the `window.__RUNTIME_CONFIG__` object
3. **Restart container**: Environment variables are only read at startup

### LaunchDarkly Connection Issues

1. **Verify SDK keys**: Ensure both server and client SDK keys are correct
2. **Check network**: Ensure the container can reach LaunchDarkly services
3. **Review logs**: Check for LaunchDarkly initialization messages

### Debug Panel

Use the debug panel (Cmd+K or Ctrl+K) to verify:
- LaunchDarkly connection status
- Environment variable values
- API key status

## Security Notes

- Never commit environment variables to version control
- Use Docker secrets or environment files for production
- The runtime configuration is visible in the browser (this is normal for client-side apps) 