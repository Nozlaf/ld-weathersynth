# 🌊 Weather Synth - Retro 80s Weather App

A beautiful, retro-styled weather application with a terminal aesthetic, inspired by 80s synthpop culture. Built with React, TypeScript, and LaunchDarkly for feature flag management.

## 🌐 Live Demo

🚀 **Check out the live sample site:** https://weather.imadethis.site

*Note: The live demo may include experimental features not yet available in this GitHub repository, and may not be online 24/7.*


![Weather Synth Demo](https://img.shields.io/badge/Theme-80s%20Synthpop-ff00ff?style=for-the-badge)
![React](https://img.shields.io/badge/React-18.x-61dafb?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-4.x-3178c6?style=for-the-badge&logo=typescript)
![LaunchDarkly](https://img.shields.io/badge/LaunchDarkly-Feature%20Flags-00d4aa?style=for-the-badge)
![LaunchDarkly Observability](https://img.shields.io/badge/LaunchDarkly-Observability-405cf5?style=for-the-badge)

## ✨ Features

- 🎨 **Retro 80s Synthpop Design** - Neon colors, terminal aesthetics, and nostalgic vibes
- 🌡️ **Real-time Weather Data** - Current weather for your location
- 🌙 **Dynamic Theme Control** - Theme controlled by LaunchDarkly feature flags
- 📱 **Mobile Responsive** - Scales beautifully on all devices
- 🚀 **LaunchDarkly Integration** - Feature flags for dynamic configuration
- ⚡ **Terminal Styling** - Monospace fonts and CRT-inspired effects
- 🎮 **Retro Animations** - Subtle scan lines and hover effects

## 🚀 Quick Start

### Prerequisites

- Node.js 16.x or higher
- npm or yarn
- LaunchDarkly account (optional - will use demo mode)
- OpenWeatherMap API key (optional - will use demo data)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd weather-synth
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your API keys:
   ```bash
   REACT_APP_LAUNCHDARKLY_CLIENT_ID=your-launchdarkly-client-sdk-key
   REACT_APP_OPENWEATHER_API_KEY=your-openweathermap-api-key
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Open your browser**
   Visit [http://localhost:3000](http://localhost:3000)

## 🔄 Production Deployment with PM2

For production deployment, you can use PM2 (Process Manager 2) to manage the Node.js backend server:

### PM2 Setup

1. **Install PM2 globally**
   ```bash
   npm install -g pm2
   ```

2. **Build the application**
   ```bash
   npm run build:all
   ```

3. **Configure environment variables**
   ```bash
   # Create .env file for production
   OPENWEATHER_API_KEY=your_api_key_here
   NODE_ENV=production
   PORT=3001
   ```

4. **Start with PM2**
   ```bash
   # Start in production mode
   npm run pm2:prod
   
   # Or start in development mode
   npm run pm2:start
   ```

### PM2 Management Commands

```bash
# View running processes
npm run pm2:status

# View real-time logs
npm run pm2:logs

# Restart the application
npm run pm2:restart

# Graceful reload (zero downtime)
npm run pm2:reload

# Stop the application
npm run pm2:stop

# Remove from PM2
npm run pm2:delete
```

### PM2 Features

- **Process Management**: Automatic restart on crashes
- **Zero Downtime Deployment**: Graceful reloads
- **Log Management**: Centralized logging with rotation
- **Monitoring**: CPU and memory usage tracking
- **Clustering**: Can run multiple instances (currently configured for 1)

### Configuration

The PM2 configuration is defined in `ecosystem.config.js`:

```javascript
{
  name: 'weather-synth',
  script: 'server/server.js',
  env: {
    NODE_ENV: 'development',
    PORT: 3001
  },
  env_production: {
    NODE_ENV: 'production',
    PORT: 3001
  }
}
```

**Access the application:** `http://localhost:3001`

## 🚀 Alternative Deployment (Without PM2)

If you prefer not to use PM2, you can run the application directly with Node.js:

### Simple Production Start

```bash
# Build the application
npm run build

# Start the server with custom port and production mode
PORT=3004 NODE_ENV=production node server/server.js
```

### Other Methods

**Development mode (two terminals):**
```bash
# Terminal 1: Start backend
cd server && npm start

# Terminal 2: Start frontend
npm start
```

**Background process:**
```bash
# Run in background with nohup
npm run build
nohup PORT=3004 NODE_ENV=production node server/server.js > app.log 2>&1 &
```

**Using Forever (alternative process manager):**
```bash
# Install forever globally
npm install -g forever

# Start with forever
npm run build
forever start server/server.js
```

## 🔄 Changelog

### Version 1.1.0 - Latest Release

**🎨 UI/UX Improvements**
- **Dropdown Theme Selector**: Theme selection now uses a compact dropdown menu instead of individual buttons, making the options screen more manageable
- **Improved Options Modal**: More space-efficient layout with better mobile responsiveness

**📊 Analytics Enhancements**
- **Smart Theme Tracking**: Theme change events are now only tracked when users close the options dialog after making changes, reducing analytical noise
- **Intentional Change Detection**: Only committed theme changes are recorded, not temporary previews

**🌡️ Unit Management**
- **Temperature Units**: Added support for LaunchDarkly-controlled temperature units (Celsius/Fahrenheit)
- **Distance Units**: Added support for LaunchDarkly-controlled distance units (Metric/Imperial)
- **Flag Value Updates**: Distance unit flag now uses `"m"` (metric) and `"i"` (imperial) instead of `"km"` and `"mi"`

**🔧 Technical Improvements**
- **Enhanced Feature Flags**: Added `default-temperature` and `default-distance` flags for unit control
- **Context Tracking**: Better LaunchDarkly context creation with location-based re-identification
- **Performance Optimizations**: Improved flag change detection and state management

## 🎛️ LaunchDarkly Feature Flags

This application uses LaunchDarkly for feature flag management. The following flags are available:

| Flag Key | Type | Default | Description |
|----------|------|---------|-------------|
| `default-theme` | String | `"dark"` | Controls the app theme - see [Theme Values](#theme-values) below |
| `default-temperature` | String | `"c"` | Default temperature unit: `"c"` for Celsius, `"f"` for Fahrenheit |
| `default-distance` | String | `"m"` | Default distance unit: `"m"` for metric (km/h), `"i"` for imperial (mph) |
| `weather-refresh-interval` | Number | `5` | Weather data refresh interval in **minutes** |
| `weather-api-provider` | JSON | `{"primary": "visual-crossing", "fallback": "open-meteo"}` | **Server-side**: Controls weather API provider selection and fallback chain - see [Weather Provider Configuration](#weather-provider-configuration) |
| `enable-animations` | Boolean | `true` | Enables CRT effects, floating icons, and animations |
| `show-extra-weather-info` | Boolean | `true` | Shows humidity and wind speed details |
| `debug-mode` | Boolean | `false` | Enables debug console logging throughout the app |

### Theme Values

The `default-theme` flag accepts the following values:

| Theme Value | Description | Visual Style |
|-------------|-------------|--------------|
| `"dark"` | **Dark Synth** (maps to `dark-synth`) | Retro synthwave with cyan/magenta/yellow |
| `"light"` | **Light Theme** | Clean light theme with dark text |
| `"dark-synth"` | **Dark Synth** (direct) | Retro synthwave with cyan/magenta/yellow |
| `"dark-green"` | **Dark Green** | Matrix-style green on black |
| `"dark-orange"` | **Dark Orange** | Amber terminal style |
| `"grayscale"` | **Grayscale** | Monochrome terminal aesthetic |
| `"dark-grayscale"` | **Dark Grayscale** | Dark monochrome with light and dark grey elements |
| `"sakura"` | **Sakura Blossom** | Retro-futuristic with animated falling cherry blossom petals |
| `"winter"` | **Winter Wonderland** | Icy blue theme with animated falling snowflakes |
| `"heart-of-gold"` | **Heart of Gold** | Ultimate minimalist theme: "black on black with black light" |

**Theme Features:**
- **Animated effects** - Sakura and Winter themes include realistic particle animations
- **Manual override** - Options panel selection overrides LaunchDarkly flags  
- **Theme persistence** - Selected themes are remembered across sessions
- **Real-time switching** - Changes apply instantly without page refresh
- **Debug testing** - Use debug panel (Cmd+K) to test all themes quickly
- **QR code adaptation** - QR codes automatically match theme colors
- **Icon theming** - Weather icons adapt using CSS filters per theme

**Note:** The app also supports manual theme selection via the Options panel, which overrides the LaunchDarkly flag.

### Weather Provider Configuration

The `weather-api-provider` flag is a **server-side JSON flag** that controls which weather API provider is used for data fetching. This flag enables intelligent provider switching and fallback handling.

#### Configuration Format

```json
{
  "primary": "provider-name",
  "fallback": "provider-name"
}
```

#### Supported Provider Values

| Provider Value | Service | API Key Required | Free Tier | Geolocation Included |
|----------------|---------|------------------|-----------|---------------------|
| `"openweathermap"` | OpenWeatherMap | Yes | 1,000 calls/day | ✅ Yes |
| `"tomorrow-io"` | Tomorrow.io | Yes | 1,000 calls/day | ✅ Yes |
| `"weatherapi"` | WeatherAPI | Yes | 1M calls/month | ✅ Yes |
| `"visual-crossing"` | Visual Crossing | Yes | 1,000 calls/day | ❌ No |
| `"open-meteo"` | Open-Meteo | No | Unlimited | ❌ No |

#### Example Configurations

**Production Setup (High Reliability)**
```json
{
  "primary": "openweathermap",
  "fallback": "open-meteo"
}
```

**Development Setup (Free)**
```json
{
  "primary": "open-meteo",
  "fallback": "open-meteo"
}
```

**Premium Setup (Multiple Fallbacks)**
```json
{
  "primary": "visual-crossing",
  "fallback": "weatherapi"
}
```

#### Environment Variable Override

You can override the LaunchDarkly flag using the `WEATHER_PROVIDER_CONFIG` environment variable:

```bash
# In your .env file
WEATHER_PROVIDER_CONFIG={"primary": "visual-crossing", "fallback": "open-meteo"}
```

#### Provider Features

- **Automatic Fallback**: If the primary provider fails, automatically switches to fallback
- **Real-time Switching**: No app restart required when changing providers via LaunchDarkly
- **Error Handling**: Graceful degradation with detailed error logging
- **Performance Monitoring**: Tracks response times and success rates for each provider
- **Location Enhancement**: Visual Crossing provider includes reverse geocoding for better location names

#### 🔒 Privacy & Geolocation Behavior

**Geolocation Data Handling:**
- **OpenWeatherMap, Tomorrow.io, WeatherAPI**: Include user geolocation data in API requests for location-based services
- **Visual Crossing & Open-Meteo**: Do **NOT** include user geolocation data in API requests for enhanced privacy

**What this means:**
- When using **Visual Crossing** or **Open-Meteo**, your exact location coordinates are **not sent** to the weather provider
- The app still uses your browser's geolocation to determine your location, but only sends weather coordinates to the API
- This provides an additional layer of privacy protection when using these providers
- Location simulation and weather data accuracy remain unchanged regardless of geolocation inclusion

#### Testing Provider Configuration

Use the debug panel (**Cmd+K**) to:
- View current provider configuration
- Test individual provider availability
- Monitor real-time provider switching
- Check API response times and error rates

### Setting up LaunchDarkly

1. Create a LaunchDarkly account at [launchdarkly.com](https://launchdarkly.com)
2. Create a new project
3. Copy your Client-side ID from the environment settings
4. Create the feature flags listed above in your LaunchDarkly dashboard
5. Add your Client-side ID to the `.env` file

### Debug Panel

Press **`Cmd+K`** (Mac) or **`Ctrl+K`** (Windows/Linux) to open the secret LaunchDarkly debug panel. This shows:

- **SDK Status**: Connection status and client information
- **Feature Flags**: Real-time flag values and their current state
- **Theme Debug**: Current theme, flag values, theme source, and quick theme testing
- **Context Data**: User context being sent to LaunchDarkly
- **Weather API Debug**: API status, location method, and request details
- **Location Simulation**: Test weather in different cities worldwide

The debug panel helps troubleshoot flag configuration and verify that LaunchDarkly is working correctly.

### SDK Menu Access

**Tap 10 times in empty space** (not on modal content) to open the SDK menu. The tap detection:
- Requires 10 taps within 2 seconds between each tap
- Resets after 3 seconds of inactivity
- Only counts taps in empty areas, not on buttons or modals
- Shows console progress: "Tap count: X/10"

## 🌤️ Weather API Setup

The app supports **5 different weather providers** with intelligent fallback and provider switching:

### 🌟 Supported Providers

#### 1. **OpenWeatherMap** (Default) 🌍
- **API Key Required**: Yes
- **Free Tier**: 1,000 calls/day
- **Features**: Comprehensive weather data, global coverage
- **Sign up**: [openweathermap.org](https://openweathermap.org/api)
- **Environment Variable**: `OPENWEATHER_API_KEY`

#### 2. **Tomorrow.io** ⚡
- **API Key Required**: Yes
- **Free Tier**: 1,000 calls/day
- **Features**: High-precision weather data, excellent accuracy
- **Sign up**: [tomorrow.io](https://www.tomorrow.io/weather-api/)
- **Environment Variable**: `TOMORROW_API_KEY`

#### 3. **WeatherAPI** 🌦️
- **API Key Required**: Yes
- **Free Tier**: 1 million calls/month
- **Features**: Real-time weather, forecasts, historical data
- **Sign up**: [weatherapi.com](https://www.weatherapi.com/)
- **Environment Variable**: `WEATHERAPI_KEY`

#### 4. **Visual Crossing** 📊
- **API Key Required**: Yes
- **Free Tier**: 1,000 calls/day
- **Features**: Weather analytics, historical data, forecasts
- **Sign up**: [visualcrossing.com](https://www.visualcrossing.com/weather-api)
- **Environment Variable**: `VISUAL_CROSSING_API_KEY`
- **🔒 Privacy Note**: Does not include user geolocation data in API requests

#### 5. **Open-Meteo** 🆓
- **API Key Required**: No (Free!)
- **Free Tier**: Unlimited non-commercial use
- **Features**: Open-source weather data, European focus
- **No signup required**: [open-meteo.com](https://open-meteo.com/)
- **Environment Variable**: None needed
- **🔒 Privacy Note**: Does not include user geolocation data in API requests

### 🔧 Provider Configuration

Configure providers via the **`weather-api-provider` LaunchDarkly feature flag** or environment variables:

#### LaunchDarkly Feature Flag Configuration

Use the `weather-api-provider` flag (JSON type) in your LaunchDarkly dashboard:

```json
{
  "primary": "visual-crossing",
  "fallback": "open-meteo"
}
```

#### Environment Variable Configuration

Override the LaunchDarkly flag using the `WEATHER_PROVIDER_CONFIG` environment variable:

```bash
# In your .env file
WEATHER_PROVIDER_CONFIG={"primary": "visual-crossing", "fallback": "open-meteo"}
```

See the [Weather Provider Configuration](#weather-provider-configuration) section under LaunchDarkly Feature Flags for complete details.

### 🎯 Quick Setup

**Option 1: Use Free Provider (No setup required)**
- No configuration needed! The app uses Open-Meteo as fallback

**Option 2: Use Premium Provider**
1. Choose your provider from the list above
2. Sign up and get your API key
3. Add it to your `.env` file:
   ```bash
   OPENWEATHER_API_KEY=your_api_key_here
   TOMORROW_API_KEY=your_api_key_here
   WEATHERAPI_KEY=your_api_key_here
   VISUAL_CROSSING_API_KEY=your_api_key_here
   ```

**Option 3: Use Multiple Providers**
- Add multiple API keys for automatic fallback
- Configure provider priority via LaunchDarkly flags
- App will switch providers if one fails

### 🔒 Security Features

- **Server-side API handling** - All API keys are handled server-side
- **Never exposed to client** - API keys remain secure in backend
- **Intelligent fallback** - Automatically switches providers if one fails
- **Rate limiting protection** - Built-in request throttling
- **Error handling** - Graceful degradation if all providers fail

### 🚀 Provider Testing

Use the **debug panel** (Cmd+K) to test all providers:
- **Test individual providers** - Check which ones are working
- **Test all providers** - Verify fallback chain
- **Real-time status** - See which providers are available
- **Response time monitoring** - Performance metrics for each provider

**Note:** The app will work with demo data if no API keys are provided, using Open-Meteo as the default free provider.

## 🔒 Security

This application has undergone a basic security review to ensure safe deployment and usage.

📋 **[Security Review Report](security-review-7-7-25-gpt4.1.md)** - Generated by GitHub Copilot with GPT-4.1 LLM

**Key Security Highlights:**
- ✅ **No secrets in codebase** - All API keys loaded from environment variables
- ✅ **Dependency security** - Reputable, up-to-date dependencies
- ✅ **Safe API usage** - Only trusted APIs (5 weather providers + LaunchDarkly)
- ✅ **Secure data handling** - No PII stored, localStorage used only for non-sensitive data
- ✅ **Infrastructure security** - Terraform variables marked as sensitive
- ✅ **No dangerous functions** - No use of `eval`, `innerHTML`, or `dangerouslySetInnerHTML`

**Security Recommendations:**
- Run `npm audit` regularly to detect vulnerabilities
- Never commit real `.env` or `terraform.tfvars` files
- Set appropriate HTTP security headers (CSP, HSTS) at server/CDN level
- Consider adding a security.txt file for responsible disclosure

For detailed security analysis, vulnerability assessment, and compliance recommendations, see the full security review document.

## ✨ Key Features

### 🎭 Multiple Theme Support
- **9 unique themes** with distinct color schemes and aesthetics
- **LaunchDarkly integration** for remote theme control
- **Manual theme selection** via options panel with dropdown selector
- **Weather icon theming** - icons adapt to theme colors using CSS filters
- **QR code theming** - QR codes automatically match theme colors
- **Animated theme-specific effects** - falling sakura petals and snowflakes
- **CRT effects per theme** - scan lines and glowing borders match theme colors
- **Smart theme tracking** - analytics for theme usage and preferences

### 🌍 Location Features
- **Real-time geolocation** with automatic location detection
- **Location simulation** - test weather in cities worldwide
- **Fallback handling** - graceful degradation if geolocation fails
- **Coordinate display** with 4-decimal precision

### 🎮 Interactive Elements
- **Tap detection** - 10 taps in empty space opens SDK menu
- **Options panel** - dropdown theme selection, temperature/distance unit controls, and debug panels
- **Dropdown interfaces** - compact theme selector with default theme indicators
- **Unit controls** - toggle between Celsius/Fahrenheit and Metric/Imperial units
- **Real-time updates** - automatic weather refresh every 5 minutes (configurable)
- **Responsive design** - works on desktop, tablet, and mobile

### 🔧 Developer Features
- **Debug mode** - console logging controlled by LaunchDarkly flag
- **Error boundaries** - graceful error handling with LaunchDarkly integration
- **Performance monitoring** - LaunchDarkly Observability and Session Replay
- **QR code display** - easy mobile access with theme-matched colors
- **Real-time flag updates** - changes apply immediately without page refresh
- **Theme testing** - debug panel allows quick cycling through all 9 themes
- **Comprehensive theming** - CSS custom properties system supports easy theme development
- **Latency tracking** - both upstream and internal API latency metrics tracked to LaunchDarkly
- **User context tracking** - API calls include user context for better analytics and debugging

### 🎨 Visual Effects
- **CRT effects** - authentic retro terminal aesthetics
- **Floating animations** - weather icons with smooth motion
- **Scan lines** - period-appropriate visual effects
- **Screen flicker** - subtle CRT monitor simulation
- **All animations** controllable via LaunchDarkly flag

## 🎨 Design Features

### Color Schemes

**Dark Synth Theme (Default)**
- Primary: Cyan (#00ffff)
- Secondary: Magenta (#ff00ff)  
- Accent: Yellow (#ffff00)
- Background: Deep space blues and blacks
- Style: Retro synthwave aesthetic

**Dark Green Theme**
- Primary: Bright green (#00ff00)
- Secondary: Matrix green variations
- Background: Dark blacks and greens
- Style: Matrix/terminal inspired

**Dark Orange Theme**
- Primary: Orange (#ff8800)
- Secondary: Amber variations
- Background: Dark blacks and oranges
- Style: Amber terminal aesthetic

**Light Theme**
- Primary: Dark gray (#2e2e2e)
- Secondary: Royal blue (#4a4a8a)
- Accent: Saddle brown (#8b4513)
- Background: Cream and beige tones
- Style: Clean professional look

**Grayscale Theme**
- Primary: Light gray (#666666)
- Secondary: Medium gray variations
- Background: White and light grays
- Style: Monochrome terminal aesthetic

**Dark Grayscale Theme**
- Primary: Light gray (#cccccc)
- Secondary: Medium gray (#888888)
- Accent: White (#ffffff)
- Background: Black and dark grays
- Style: Dark monochrome terminal aesthetic

**Sakura Theme** 🌸
- Primary: Deep pink (#831843)
- Secondary: Pink (#f472b6)
- Accent: Hot pink (#ec4899)
- Background: Soft pink gradients (#fdf2f8, #fce7f3)
- Style: Retro-futuristic with animated falling cherry blossom petals
- Special Feature: Realistic animated sakura petals (3px-5px) continuously fall and drift across the screen with natural swaying motion and multiple animation layers for depth

**Winter Wonderland Theme** ❄️
- Primary: Deep blue (#1e3a8a)
- Secondary: Blue (#3b82f6)
- Accent: Bright blue (#2563eb)
- Background: Light blue gradients (#f0f9ff, #e0f2fe)
- Style: Icy blue theme with clean winter aesthetics
- Special Feature: Realistic animated snowflakes (2px-4px) continuously fall and drift across the screen with natural floating motion and multiple animation layers for depth

**Heart of Gold Theme** 🖤
- Primary: Very dark gray (#0f0f0f)
- Secondary: Darker gray (#1a1a1a)
- Accent: Dark gray (#2a2a2a)
- Background: Pure black (#000000, #0a0a0a)
- Border: Nearly black (#0a0a0a)
- Style: Ultimate minimalist aesthetic inspired by "black on black with black light"
- Philosophy: Nearly invisible interface that challenges users to find content in the darkness
- Special Feature: Extremely subtle contrast for a truly minimal experience

### Typography

- **Primary Font**: Courier Prime (monospace)
- **Display Font**: Orbitron (futuristic)
- **Terminal aesthetics** with proper spacing and weights

### Animations

- **Floating weather icons** - smooth up/down motion (controllable via `enable-animations` flag)
- **Scanning loading effects** - retro terminal scan lines during data loading
- **CRT-style screen flicker** - subtle monitor simulation effects
- **Smooth theme transitions** - seamless color scheme changes
- **Real-time flag control** - animations can be disabled instantly via LaunchDarkly

## 📱 Responsive Design

The app is fully responsive with breakpoints at:
- **Desktop**: 1024px+
- **Tablet**: 768px - 1023px
- **Mobile**: 320px - 767px

## 📊 Performance Monitoring & Metrics

### Latency Tracking
The application tracks comprehensive latency metrics for performance monitoring:

#### **Internal Latency** (Client-side tracking)
- **What it measures**: Time from client API request start to response completion
- **Tracked to**: LaunchDarkly events for real-time monitoring
- **Includes**:
  - Request/response time for `/api/weather` endpoint
  - Request/response time for `/api/weather/test` endpoint
  - Success/failure status and error details
  - Cache hit/miss information
  - Provider information and upstream latency correlation

#### **Upstream Latency** (Server-side tracking)
- **What it measures**: Time from server external API call start to response completion
- **Tracked to**: LaunchDarkly events for external service monitoring
- **Includes**:
  - Individual weather provider response times
  - Provider type (primary, fallback, emergency, mock)
  - Success/failure status and error details
  - Location coordinates for geographic analysis
  - Fallback chain tracking when providers fail

#### **User Context Integration**
All API calls automatically include user context for enhanced analytics:
- **User identification**: LaunchDarkly user key, name, and email
- **Session tracking**: Request IDs, user agent, IP address
- **Request metadata**: Endpoint, timestamp, success status
- **Performance correlation**: Links user actions to performance metrics

#### **Metrics Dashboard**
Monitor performance in LaunchDarkly:
1. **Events** → Search for `internal_latency` and `upstream_latency` events
2. **Custom metrics** for API response times
3. **Error tracking** with detailed error messages and context
4. **Geographic performance** analysis by location coordinates
5. **Provider performance** comparison across weather services

## 🏗️ Architecture

### File Structure

```
src/
├── components/                    # React components
│   ├── WeatherWidget.tsx         # Main weather display component
│   ├── WeatherWidget.css         # Weather widget styles
│   ├── LaunchDarklyDebugPanel.tsx # Secret debug panel (Cmd+K)
│   └── LaunchDarklyDebugPanel.css # Debug panel styles
├── hooks/                        # Custom React hooks
│   └── useTheme.ts              # Theme context and types
├── services/                     # API and utility services
│   ├── launchDarklyConfig.ts    # LaunchDarkly SDK configuration
│   └── weatherService.ts        # Weather API service
├── providers/                    # React context providers
│   └── ThemeProvider.tsx        # Theme state management
└── .cursor/                     # Cursor IDE rules
    └── rules/
        ├── implementing-launchdarkly.mdc
        ├── using-flags.mdc
        └── troubleshooting-launchdarkly.mdc
```

### LaunchDarkly Integration

The app follows LaunchDarkly best practices:

- **Centralized flag evaluation** via `useFeatureFlags` hook
- **Singleton SDK initialization** with timeout handling
- **Proper context creation** with user attributes
- **Graceful fallback** for offline scenarios
- **Clean shutdown** on app termination

## 🛠️ Development

### Available Scripts

- `npm start` - Start development server (http://localhost:3000)
- `npm run build` - Build optimized production bundle
- `npm test` - Run Jest test suite
- `npm run eject` - Eject from Create React App (⚠️ irreversible)

### Production Deployment

The app is designed for easy deployment with PM2:

```bash
# Build the production version
npm run build

# Start with PM2 (if using PM2)
pm2 start build/static/js/main.*.js --name weather-synth

# Or serve with a static server
npx serve -s build -l 3000
```

### 🐳 Docker Deployment

The app includes Docker support with runtime environment variable injection:

#### Quick Start with Docker

```bash
# Build the Docker image
docker build -t weather-synth .

# Run with environment variables
docker run -d \
  -e LAUNCHDARKLY_SDK_KEY=your-server-sdk-key \
  -e REACT_APP_LAUNCHDARKLY_CLIENT_ID=your-client-sdk-key \
  -e REACT_APP_OPENWEATHER_API_KEY=your-openweather-key \
  -p 3000:80 \
  weather-synth
```

#### Docker Compose

```yaml
version: '3.8'
services:
  weather-synth:
    image: weather-synth:latest
    environment:
      - LAUNCHDARKLY_SDK_KEY=your-server-sdk-key
      - REACT_APP_LAUNCHDARKLY_CLIENT_ID=your-client-sdk-key
      - REACT_APP_OPENWEATHER_API_KEY=your-openweather-key
    ports:
      - "3000:80"
```

#### QNAP Container Station

1. Import the `weather-synth-qnap.tar` image
2. Create a new container
3. Add environment variables in the "Environment" tab
4. Set port mapping to `3000:80`
5. Start the container

#### Runtime Environment Variables

The Docker container supports runtime environment variable injection, allowing you to configure the app without rebuilding the image. See [DOCKER_ENVIRONMENT_VARIABLES.md](DOCKER_ENVIRONMENT_VARIABLES.md) for complete documentation.

### Environment Variables

#### Frontend (React) Variables
| Variable | Required | Description |
|----------|----------|-------------|
| `REACT_APP_LAUNCHDARKLY_CLIENT_ID` | No | LaunchDarkly client SDK key for feature flags |
| `REACT_APP_GA_MEASUREMENT_ID` | No | Google Analytics measurement ID for optional usage tracking |
| `REACT_APP_VERSION` | No | App version for LaunchDarkly context |
| `REACT_APP_LD_BASE_URL` | No | LaunchDarkly base URL (for proxy setups) |
| `REACT_APP_LD_STREAM_URL` | No | LaunchDarkly stream URL (for proxy setups) |
| `REACT_APP_LD_EVENTS_URL` | No | LaunchDarkly events URL (for proxy setups) |

#### Backend (Server) Variables
| Variable | Required | Description |
|----------|----------|-------------|
| `OPENWEATHER_API_KEY` | No | OpenWeatherMap API key for weather data |
| `TOMORROW_API_KEY` | No | Tomorrow.io API key for weather data |
| `WEATHERAPI_KEY` | No | WeatherAPI.com API key for weather data |
| `VISUAL_CROSSING_API_KEY` | No | Visual Crossing API key for weather data |
| `LAUNCHDARKLY_SDK_KEY` | No | LaunchDarkly server SDK key for weather provider configuration and metrics tracking |

**Note:** All environment variables are optional. The app will work in demo mode without any configuration, using Open-Meteo as the free fallback provider.

#### Google Analytics Setup (Optional)

Google Analytics is completely optional and the app functions perfectly without it. If you want to track usage analytics:

1. **Create a Google Analytics account** at [analytics.google.com](https://analytics.google.com)
2. **Set up a new property** for your website
3. **Copy your Measurement ID** (format: `G-XXXXXXXXXX`)
4. **Add it to your environment variables**:
   ```bash
   REACT_APP_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

**Without Google Analytics:**
- The app will display an informational message in the console
- No tracking data will be collected
- No network requests will be made to Google Analytics
- All app functionality remains unchanged

**With Google Analytics:**
- Theme changes and user interactions will be tracked
- Page views and app usage will be recorded
- Analytics data will be available in your Google Analytics dashboard

## 🎯 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🎵 Development Background

This project was born from a **"vibe coding"** experiment to test and validate LaunchDarkly's **Cursor Rules** - a set of AI-powered development guidelines designed to help developers implement feature flags following best practices.

### 🧠 The Experiment

**What started as a simple weather app became a comprehensive showcase of:**
- **LaunchDarkly best practices** - following the published Cursor rules for feature flag implementation
- **AI-assisted development** - leveraging intelligent code suggestions and architectural guidance
- **Rapid prototyping** - building production-ready features with AI pair programming
- **Terminal aesthetics** - because retro vibes make everything better! 🌈

### 🛠️ Development Stack

**Built with the power of:**
- **[Cursor](https://cursor.sh)** - The AI-powered code editor that made this rapid development possible
- **[Claude-4-Sonnet](https://claude.ai)** - The AI agent that provided architectural guidance, code generation, and best practices
- **[LaunchDarkly Cursor Rules](https://github.com/launchdarkly-labs/cursor-rules)** - Structured guidelines for implementing feature flags correctly
- **Retro inspiration** - 80s synthpop culture and CRT monitor aesthetics (I was watching [Drive](https://www.youtube.com/watch?v=EatVh52p7S4&t=493s))

### 🎨 The "Vibe Coding" Approach

Rather than traditional development, this project embraced:
- **Aesthetic-first design** - letting the retro terminal theme drive technical decisions
- **Feature flag everything** - using LaunchDarkly flags for every possible configuration
- **AI pair programming** - collaborating with Claude-4-Sonnet for architecture and implementation
- **Rapid iteration** - building features in real-time with immediate feedback

### 📊 What This Proves

**This weather app demonstrates:**
- **LaunchDarkly Cursor Rules work** - following structured guidelines produces clean, maintainable code
- **AI-assisted development is powerful** - complex features can be built rapidly without sacrificing quality
- **Cursor + Claude-4-Sonnet = 🚀** - the combination enables incredibly productive development workflows
- **Feature flags enable creativity** - when everything is configurable, experimentation becomes effortless

### 🎯 Real-World Impact

**The techniques used here apply to:**
- **Production applications** - the architecture and patterns scale to enterprise systems
- **Team development** - the LaunchDarkly rules provide consistency across developers
- **Rapid prototyping** - AI assistance accelerates proof-of-concept development
- **Feature experimentation** - flag-driven development enables safe, continuous iteration

*This project serves as both a functional weather app and a testament to modern AI-assisted development practices. The retro aesthetic is just the cherry on top! 🍒*

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- **LaunchDarkly** for feature flag management and real-time configuration
- **Weather API Providers** for reliable weather data:
  - **OpenWeatherMap** - Global weather data and comprehensive API
  - **Tomorrow.io** - High-precision weather forecasting
  - **WeatherAPI** - Real-time weather with generous free tier
  - **Visual Crossing** - Weather analytics and historical data
  - **Open-Meteo** - Open-source weather data (free!)
- **Google Fonts** for Orbitron and Courier Prime typography
- **80s Synthpop Culture** for retro-futuristic design inspiration
- **CRT Monitor Aesthetics** for authentic terminal visual effects

## 🌟 Live Demo

Access the live application at:
- **Local Development**: http://localhost:3000
- **Production**: http://localhost:3000 (or your deployment URL)

**Quick Start:**
1. Visit the app
2. Press **Cmd+K** (Mac) or **Ctrl+K** (Windows/Linux) to open debug panel
3. **Tap 10 times** in empty space to access SDK menu
4. Click **[OPTIONS]** to explore all 9 themes and features
5. **Theme Selection**: Use the dropdown to choose from Dark Synth Pop, Light, Green CRT, Orange Plasma, Grayscale, Dark Grayscale, Sakura Blossom, Winter Wonderland, or Heart of Gold
6. **Advanced Testing**: Press **Cmd+K** (Mac) or **Ctrl+K** (Windows/Linux) to open the debug panel for quick theme testing

---

Made with 💜 and ⚡ - Embrace the retro future!
