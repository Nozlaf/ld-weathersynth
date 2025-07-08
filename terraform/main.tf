# LaunchDarkly Terraform Configuration for Weather Synth App
# This configuration matches your existing LaunchDarkly environment
# Retrieved from API and updated to reflect current state

terraform {
  required_providers {
    launchdarkly = {
      source  = "launchdarkly/launchdarkly"
      version = "~> 2.0"
    }
  }
  required_version = ">= 1.0"
}

# Configure the LaunchDarkly Provider
provider "launchdarkly" {
  access_token = var.launchdarkly_access_token
}

# Variables
variable "launchdarkly_access_token" {
  description = "LaunchDarkly API access token"
  type        = string
  sensitive   = true
}

variable "project_key" {
  description = "LaunchDarkly project key"
  type        = string
  default     = "weather-app"
}

variable "project_name" {
  description = "LaunchDarkly project name"
  type        = string
  default     = "weather-app"
}

# Create the LaunchDarkly Project
resource "launchdarkly_project" "weather_app" {
  key  = var.project_key
  name = var.project_name
  
  tags = []

  environments {
    key   = "test"
    name  = "Test"
    color = "EBFF38"
    tags  = []
  }

  environments {
    key   = "production"
    name  = "Production"
    color = "00DA7B"
    tags  = []
  }
}

# Default Theme Feature Flag
resource "launchdarkly_feature_flag" "default_theme" {
  project_key = launchdarkly_project.weather_app.key
  key         = "default-theme"
  name        = "default-theme"
  description = "Controls the default theme for the weather app interface"
  temporary   = false

  variation_type = "string"
  variations {
    value       = "dark"
    name        = "Dark (maps to dark-synth)"
    description = "Default dark theme mapping to dark-synth"
  }
  variations {
    value       = "light"
    name        = "Light Theme"
    description = "Light theme with dark text"
  }
  variations {
    value       = "dark-synth"
    name        = "Dark Synth Pop"
    description = "Retro synthwave with cyan/magenta/yellow"
  }
  variations {
    value       = "dark-green"
    name        = "Dark Green CRT"
    description = "Matrix-style green on black"
  }
  variations {
    value       = "dark-orange"
    name        = "Dark Orange Plasma"
    description = "Amber terminal style"
  }
  variations {
    value       = "grayscale"
    name        = "Grayscale"
    description = "Monochrome terminal aesthetic"
  }
  variations {
    value       = "dark-grayscale"
    name        = "Dark Grayscale"
    description = "Dark monochrome with light and dark grey elements"
  }
  variations {
    value       = "sakura"
    name        = "Sakura Blossom"
    description = "Retro-futuristic with animated falling cherry blossom petals"
  }
  variations {
    value       = "winter"
    name        = "Winter Wonderland"
    description = "Icy blue theme with animated falling snowflakes"
  }
  variations {
    value       = "heart-of-gold"
    name        = "Heart of Gold"
    description = "Black on black with black light - inspired by The Hitchhiker's Guide to the Galaxy"
  }

  defaults {
    on_variation  = 0  # "dark" (maps to dark-synth)
    off_variation = 2  # "dark-synth" (direct)
  }

  client_side_availability {
    using_environment_id = true
    using_mobile_key     = false
  }

  tags = []
}

# Temperature Unit Feature Flag
resource "launchdarkly_feature_flag" "default_temperature" {
  project_key = launchdarkly_project.weather_app.key
  key         = "default-temperature"
  name        = "default-temperature"
  description = "should this be celcius or freedom units"
  temporary   = true

  variation_type = "string"
  variations {
    value       = "c"
    name        = "Celsius"
    description = "Display temperatures in Celsius"
  }
  variations {
    value       = "f"
    name        = "Freedom units"
    description = "Display temperatures in Fahrenheit"
  }
  variations {
    value       = "k"
    name        = "Kelvin"
    description = "Display temperatures in Kelvin"
  }

  defaults {
    on_variation  = 0  # "c" (Celsius)
    off_variation = 1  # "f" (Fahrenheit)
  }

  client_side_availability {
    using_environment_id = true
    using_mobile_key     = false
  }

  tags = []
}

# Distance Unit Feature Flag
resource "launchdarkly_feature_flag" "default_distance" {
  project_key = launchdarkly_project.weather_app.key
  key         = "default-distance"
  name        = "default-distance"
  description = ""
  temporary   = true

  variation_type = "string"
  variations {
    value       = "m"
    name        = "Metric"
    description = "Display wind speed in km/h"
  }
  variations {
    value       = "i"
    name        = "Freedom"
    description = "Display wind speed in mph"
  }

  defaults {
    on_variation  = 0  # "m" (Metric)
    off_variation = 1  # "i" (Imperial)
  }

  client_side_availability {
    using_environment_id = true
    using_mobile_key     = false
  }

  tags = []
}

# Weather Refresh Interval Feature Flag
resource "launchdarkly_feature_flag" "weather_refresh_interval" {
  project_key = launchdarkly_project.weather_app.key
  key         = "weather-refresh-interval"
  name        = "weather-refresh-interval"
  description = ""
  temporary   = true

  variation_type = "number"
  variations {
    value       = 5
    name        = "Five Minutes (Default)"
    description = "Refresh every 5 minutes"
  }
  variations {
    value       = 60
    name        = "Hourly"
    description = "Refresh every hour"
  }
  variations {
    value       = 30
    name        = "Half Hourly"
    description = "Refresh every 30 minutes"
  }
  variations {
    value       = 720
    name        = "Half Day"
    description = "Refresh every 12 hours"
  }
  variations {
    value       = 1440
    name        = "daily"
    description = "Refresh daily"
  }

  defaults {
    on_variation  = 0  # 5 minutes
    off_variation = 1  # 60 minutes (Hourly)
  }

  client_side_availability {
    using_environment_id = true
    using_mobile_key     = false
  }

  tags = []
}

# Enable Animations Feature Flag
resource "launchdarkly_feature_flag" "enable_animations" {
  project_key = launchdarkly_project.weather_app.key
  key         = "enable-animations"
  name        = "enable-animations"
  description = "Enables Animations for CRT / Weather / Theme elements"
  temporary   = true

  variation_type = "boolean"
  variations {
    value       = true
    name        = "Enabled"
    description = "Enable CRT and visual animations"
  }
  variations {
    value       = false
    name        = "Disabled"
    description = "Disable animations for performance"
  }

  defaults {
    on_variation  = 0  # true (Enabled)
    off_variation = 1  # false (Disabled)
  }

  client_side_availability {
    using_environment_id = true
    using_mobile_key     = false
  }

  tags = []
}

# Show Extra Weather Info Feature Flag
resource "launchdarkly_feature_flag" "show_extra_weather_info" {
  project_key = launchdarkly_project.weather_app.key
  key         = "show-extra-weather-info"
  name        = "show-extra-weather-info"
  description = "Show humidity and windspeed on the screen"
  temporary   = true

  variation_type = "boolean"
  variations {
    value       = true
    name        = "Extra Info"
    description = "Show additional weather details"
  }
  variations {
    value       = false
    name        = "Basic Info"
    description = "Show only basic weather information"
  }

  defaults {
    on_variation  = 0  # true (Extra Info)
    off_variation = 1  # false (Basic Info)
  }

  client_side_availability {
    using_environment_id = true
    using_mobile_key     = false
  }

  tags = []
}

# Debug Mode Feature Flag
resource "launchdarkly_feature_flag" "debug_mode" {
  project_key = launchdarkly_project.weather_app.key
  key         = "debug-mode"
  name        = "debug-mode"
  description = "Enable debug logging in console"
  temporary   = true

  variation_type = "boolean"
  variations {
    value       = true
    name        = "Enabled"
    description = "Enable debug logging"
  }
  variations {
    value       = false
    name        = "Disabled"
    description = "Disable debug logging"
  }

  defaults {
    on_variation  = 0  # true (Enabled)
    off_variation = 1  # false (Disabled)
  }

  client_side_availability {
    using_environment_id = true
    using_mobile_key     = false
  }

  tags = []
}

# Show Moon Phase Feature Flag
resource "launchdarkly_feature_flag" "show_moon_phase" {
  project_key = launchdarkly_project.weather_app.key
  key         = "show-moon-phase"
  name        = "show-moon-phase"
  description = "Display moon phase information in weather details section"
  temporary   = true

  variation_type = "boolean"
  variations {
    value       = true
    name        = "Enabled"
    description = "Show moon phase in weather details"
  }
  variations {
    value       = false
    name        = "Disabled"
    description = "Hide moon phase information"
  }

  defaults {
    on_variation  = 0  # true (Enabled)
    off_variation = 1  # false (Disabled)
  }

  client_side_availability {
    using_environment_id = true
    using_mobile_key     = false
  }

  tags = []
}

# Enable Sakura Theme Feature Flag
resource "launchdarkly_feature_flag" "enable_sakura_theme" {
  project_key = launchdarkly_project.weather_app.key
  key         = "enable-sakura-theme"
  name        = "enable-sakura-theme"
  description = "Enable the Sakura theme with animated petals in the theme selector"
  temporary   = true

  variation_type = "boolean"
  variations {
    value       = true
    name        = "Enabled"
    description = "Show Sakura theme in theme selector"
  }
  variations {
    value       = false
    name        = "Disabled"
    description = "Hide Sakura theme from theme selector"
  }

  defaults {
    on_variation  = 0  # true (Enabled)
    off_variation = 1  # false (Disabled)
  }

  client_side_availability {
    using_environment_id = true
    using_mobile_key     = false
  }

  tags = []
}

# Weather API Provider Feature Flag
resource "launchdarkly_feature_flag" "weather_api_provider" {
  project_key = launchdarkly_project.weather_app.key
  key         = "weather-api-provider"
  name        = "weather-api-provider"
  description = "Configure which weather API provider to use with fallback support"
  temporary   = false

  variation_type = "json"
  variations {
    value       = jsonencode({"primary": "openweathermap", "fallbacks": ["open-meteo", "visual-crossing"]})
    name        = "OpenWeatherMap + Fallbacks"
    description = "Primary: OpenWeatherMap, Fallbacks: Open-Meteo (free), Visual Crossing"
  }
  variations {
    value       = jsonencode({"primary": "tomorrow-io", "fallbacks": ["openweathermap", "open-meteo", "visual-crossing"]})
    name        = "Tomorrow.io + Multiple Fallbacks"
    description = "Primary: Tomorrow.io, Fallbacks: OpenWeatherMap, Open-Meteo, Visual Crossing"
  }
  variations {
    value       = jsonencode({"primary": "weatherapi", "fallbacks": ["openweathermap", "open-meteo", "visual-crossing"]})
    name        = "WeatherAPI + Multiple Fallbacks"
    description = "Primary: WeatherAPI.com, Fallbacks: OpenWeatherMap, Open-Meteo, Visual Crossing"
  }
  variations {
    value       = jsonencode({"primary": "visual-crossing", "fallbacks": ["openweathermap", "open-meteo"]})
    name        = "Visual Crossing + Fallbacks"
    description = "Primary: Visual Crossing, Fallbacks: OpenWeatherMap, Open-Meteo (free)"
  }
  variations {
    value       = jsonencode({"primary": "open-meteo", "fallbacks": ["openweathermap", "visual-crossing"]})
    name        = "Open-Meteo + Fallbacks"
    description = "Primary: Open-Meteo (free), Fallbacks: OpenWeatherMap, Visual Crossing"
  }
  variations {
    value       = jsonencode({"primary": "openweathermap", "fallbacks": ["tomorrow-io", "weatherapi", "open-meteo", "visual-crossing"]})
    name        = "OpenWeatherMap + All Fallbacks"
    description = "Primary: OpenWeatherMap, Fallbacks: Tomorrow.io, WeatherAPI, Open-Meteo, Visual Crossing"
  }

  defaults {
    on_variation  = 0  # OpenWeatherMap + Open-Meteo
    off_variation = 0  # OpenWeatherMap + Open-Meteo
  }

  client_side_availability {
    using_environment_id = false
    using_mobile_key     = false
  }

  tags = ["weather", "api", "backend"]
}

# Environment-specific flag configurations to match current state
# All flags are currently OFF in both environments

# Production Environment Flag States
resource "launchdarkly_feature_flag_environment" "default_theme_production" {
  flag_id      = launchdarkly_feature_flag.default_theme.id
  env_key      = "production"
  on           = false
  fallthrough {
    variation = 0  # "dark" (maps to dark-synth)
  }
  off_variation = 2  # "dark-synth" (direct)
}

resource "launchdarkly_feature_flag_environment" "default_temperature_production" {
  flag_id      = launchdarkly_feature_flag.default_temperature.id
  env_key      = "production"
  on           = false
  fallthrough {
    variation = 0  # "c" (Celsius)
  }
  off_variation = 1  # "f" (Fahrenheit)
}

resource "launchdarkly_feature_flag_environment" "default_distance_production" {
  flag_id      = launchdarkly_feature_flag.default_distance.id
  env_key      = "production"
  on           = false
  fallthrough {
    variation = 0  # "m" (Metric)
  }
  off_variation = 1  # "i" (Imperial)
}

resource "launchdarkly_feature_flag_environment" "weather_refresh_interval_production" {
  flag_id      = launchdarkly_feature_flag.weather_refresh_interval.id
  env_key      = "production"
  on           = false
  fallthrough {
    variation = 0  # 5 minutes
  }
  off_variation = 1  # 60 minutes
}

resource "launchdarkly_feature_flag_environment" "enable_animations_production" {
  flag_id      = launchdarkly_feature_flag.enable_animations.id
  env_key      = "production"
  on           = false
  fallthrough {
    variation = 0  # true (Enabled)
  }
  off_variation = 1  # false (Disabled)
}

resource "launchdarkly_feature_flag_environment" "show_extra_weather_info_production" {
  flag_id      = launchdarkly_feature_flag.show_extra_weather_info.id
  env_key      = "production"
  on           = false
  fallthrough {
    variation = 0  # true (Extra Info)
  }
  off_variation = 1  # false (Basic Info)
}

resource "launchdarkly_feature_flag_environment" "debug_mode_production" {
  flag_id      = launchdarkly_feature_flag.debug_mode.id
  env_key      = "production"
  on           = false
  fallthrough {
    variation = 0  # true (Enabled)
  }
  off_variation = 1  # false (Disabled)
}

resource "launchdarkly_feature_flag_environment" "show_moon_phase_production" {
  flag_id      = launchdarkly_feature_flag.show_moon_phase.id
  env_key      = "production"
  on           = false
  fallthrough {
    variation = 0  # true (Enabled)
  }
  off_variation = 1  # false (Disabled)
}

resource "launchdarkly_feature_flag_environment" "enable_sakura_theme_production" {
  flag_id      = launchdarkly_feature_flag.enable_sakura_theme.id
  env_key      = "production"
  on           = false
  fallthrough {
    variation = 0  # true (Enabled)
  }
  off_variation = 1  # false (Disabled)
}

resource "launchdarkly_feature_flag_environment" "weather_api_provider_production" {
  flag_id      = launchdarkly_feature_flag.weather_api_provider.id
  env_key      = "production"
  on           = false
  fallthrough {
    variation = 0  # OpenWeatherMap + Fallbacks
  }
  off_variation = 0  # OpenWeatherMap + Fallbacks
}

# Test Environment Flag States
resource "launchdarkly_feature_flag_environment" "default_theme_test" {
  flag_id      = launchdarkly_feature_flag.default_theme.id
  env_key      = "test"
  on           = false
  fallthrough {
    variation = 0  # "dark" (maps to dark-synth)
  }
  off_variation = 2  # "dark-synth" (direct)
}

resource "launchdarkly_feature_flag_environment" "default_temperature_test" {
  flag_id      = launchdarkly_feature_flag.default_temperature.id
  env_key      = "test"
  on           = false
  fallthrough {
    variation = 0  # "c" (Celsius)
  }
  off_variation = 1  # "f" (Fahrenheit)
}

resource "launchdarkly_feature_flag_environment" "default_distance_test" {
  flag_id      = launchdarkly_feature_flag.default_distance.id
  env_key      = "test"
  on           = false
  fallthrough {
    variation = 0  # "m" (Metric)
  }
  off_variation = 1  # "i" (Imperial)
}

resource "launchdarkly_feature_flag_environment" "weather_refresh_interval_test" {
  flag_id      = launchdarkly_feature_flag.weather_refresh_interval.id
  env_key      = "test"
  on           = false
  fallthrough {
    variation = 3  # 720 minutes (Half Day) - matches current API state
  }
  off_variation = 1  # 60 minutes
}

resource "launchdarkly_feature_flag_environment" "enable_animations_test" {
  flag_id      = launchdarkly_feature_flag.enable_animations.id
  env_key      = "test"
  on           = false
  fallthrough {
    variation = 0  # true (Enabled)
  }
  off_variation = 1  # false (Disabled)
}

resource "launchdarkly_feature_flag_environment" "show_extra_weather_info_test" {
  flag_id      = launchdarkly_feature_flag.show_extra_weather_info.id
  env_key      = "test"
  on           = false
  fallthrough {
    variation = 0  # true (Extra Info)
  }
  off_variation = 1  # false (Basic Info)
}

resource "launchdarkly_feature_flag_environment" "debug_mode_test" {
  flag_id      = launchdarkly_feature_flag.debug_mode.id
  env_key      = "test"
  on           = false
  fallthrough {
    variation = 0  # true (Enabled)
  }
  off_variation = 1  # false (Disabled)
}

resource "launchdarkly_feature_flag_environment" "show_moon_phase_test" {
  flag_id      = launchdarkly_feature_flag.show_moon_phase.id
  env_key      = "test"
  on           = false
  fallthrough {
    variation = 0  # true (Enabled)
  }
  off_variation = 1  # false (Disabled)
}

resource "launchdarkly_feature_flag_environment" "enable_sakura_theme_test" {
  flag_id      = launchdarkly_feature_flag.enable_sakura_theme.id
  env_key      = "test"
  on           = false
  fallthrough {
    variation = 0  # true (Enabled)
  }
  off_variation = 1  # false (Disabled)
}

resource "launchdarkly_feature_flag_environment" "weather_api_provider_test" {
  flag_id      = launchdarkly_feature_flag.weather_api_provider.id
  env_key      = "test"
  on           = false
  fallthrough {
    variation = 0  # OpenWeatherMap + Fallbacks
  }
  off_variation = 0  # OpenWeatherMap + Fallbacks
}

# Custom Metrics for Performance and User Experience Tracking

# Theme Changes - User Experience Metric
resource "launchdarkly_metric" "theme_change" {
  project_key = launchdarkly_project.weather_app.key
  key         = "theme-change"
  name        = "theme-change"
  kind        = "custom"
  description = "Tracks theme change events for user experience analytics"
  event_key   = "theme-change"
  tags        = ["ux", "theme", "user-experience"]
}

# Internal Latency - Client-side API Performance
resource "launchdarkly_metric" "internal_latency" {
  project_key          = launchdarkly_project.weather_app.key
  key                  = "internal-latency"
  name                 = "internal-latency"
  kind                 = "custom"
  description          = "Tracks client-side API request latency from request start to response completion"
  event_key            = "internal_latency"
  is_numeric           = true
  unit                 = "ms"
  success_criteria     = "LowerThanBaseline"
  randomization_units  = ["user"]
  tags                 = ["performance", "latency", "api", "client-side"]
}

# Upstream Latency - Server-side External API Performance
resource "launchdarkly_metric" "upstream_latency" {
  project_key          = launchdarkly_project.weather_app.key
  key                  = "upstream-latency"
  name                 = "upstream-latency"
  kind                 = "custom"
  description          = "Tracks server-side external API call latency to weather providers"
  event_key            = "upstream_latency"
  is_numeric           = true
  unit                 = "ms"
  success_criteria     = "LowerThanBaseline"
  randomization_units  = ["user"]
  tags                 = ["performance", "latency", "weather-api", "server-side"]
}

# Outputs
output "project_key" {
  description = "The LaunchDarkly project key"
  value       = launchdarkly_project.weather_app.key
}

output "client_side_id_production" {
  description = "Client-side ID for Production environment"
  value       = launchdarkly_project.weather_app.environments[1].client_side_id
  sensitive   = true
}

output "client_side_id_test" {
  description = "Client-side ID for Test environment"
  value       = launchdarkly_project.weather_app.environments[0].client_side_id
  sensitive   = true
}

output "feature_flags" {
  description = "Created feature flags"
  value = {
    default_theme           = launchdarkly_feature_flag.default_theme.key
    default_temperature      = launchdarkly_feature_flag.default_temperature.key
    default_distance        = launchdarkly_feature_flag.default_distance.key
    weather_refresh_interval = launchdarkly_feature_flag.weather_refresh_interval.key
    enable_animations       = launchdarkly_feature_flag.enable_animations.key
    show_extra_weather_info = launchdarkly_feature_flag.show_extra_weather_info.key
    debug_mode             = launchdarkly_feature_flag.debug_mode.key
    show_moon_phase = launchdarkly_feature_flag.show_moon_phase.key
    enable_sakura_theme     = launchdarkly_feature_flag.enable_sakura_theme.key
    weather_api_provider    = launchdarkly_feature_flag.weather_api_provider.key
  }
}

output "metrics" {
  description = "Created custom metrics"
  value = {
    theme_change      = launchdarkly_metric.theme_change.key
    internal_latency  = launchdarkly_metric.internal_latency.key
    upstream_latency  = launchdarkly_metric.upstream_latency.key
  }
} 