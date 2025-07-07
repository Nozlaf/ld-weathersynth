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

**Note:** The app also supports manual theme selection via the Options panel, which overrides the LaunchDarkly flag.

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
- **Theme Debug**: Current theme, flag values, and theme source
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

The app uses OpenWeatherMap for weather data:

1. Sign up at [openweathermap.org](https://openweathermap.org/api)
2. Get your free API key
3. Add it to your `.env` file as `REACT_APP_OPENWEATHER_API_KEY`

**Note:** The app will work with demo data if no API key is provided.

## ✨ Key Features

### 🎭 Multiple Theme Support
- **6 unique themes** with distinct color schemes and aesthetics
- **LaunchDarkly integration** for remote theme control
- **Manual theme selection** via options panel
- **Weather icon theming** - icons adapt to theme colors using CSS filters

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
- **QR code display** - easy mobile access
- **Real-time flag updates** - changes apply immediately without page refresh

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
- Special Feature: Animated sakura petals continuously fall in the background

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
npx serve -s build -l 3002
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `REACT_APP_LAUNCHDARKLY_CLIENT_ID` | No | LaunchDarkly client SDK key for feature flags |
| `REACT_APP_OPENWEATHER_API_KEY` | No | OpenWeatherMap API key for live weather data |
| `REACT_APP_VERSION` | No | App version for LaunchDarkly context |
| `REACT_APP_LD_BASE_URL` | No | LaunchDarkly base URL (for proxy setups) |
| `REACT_APP_LD_STREAM_URL` | No | LaunchDarkly stream URL (for proxy setups) |
| `REACT_APP_LD_EVENTS_URL` | No | LaunchDarkly events URL (for proxy setups) |

**Note:** All environment variables are optional. The app will work in demo mode without any configuration.

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
- **OpenWeatherMap** for accurate weather data and API
- **Google Fonts** for Orbitron and Courier Prime typography
- **80s Synthpop Culture** for retro-futuristic design inspiration
- **CRT Monitor Aesthetics** for authentic terminal visual effects

## 🌟 Live Demo

Access the live application at:
- **Local Development**: http://localhost:3000
- **Production**: http://localhost:3002 (or your deployment URL)

**Quick Start:**
1. Visit the app
2. Press **Cmd+K** (Mac) or **Ctrl+K** (Windows/Linux) to open debug panel
3. **Tap 10 times** in empty space to access SDK menu
4. Click **[OPTIONS]** to explore themes and features

---

Made with 💜 and ⚡ - Embrace the retro future!
