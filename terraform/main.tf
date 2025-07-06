# LaunchDarkly Terraform Configuration for Weather Synth App
# This configuration sets up the complete LaunchDarkly environment

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
  default     = "Weather Synth App"
}

# Create the LaunchDarkly Project
resource "launchdarkly_project" "weather_app" {
  key  = var.project_key
  name = var.project_name
  
  tags = [
    "weather",
    "react",
    "typescript", 
    "demo",
    "terraform"
  ]

  environments {
    key   = "production"
    name  = "Production"
    color = "417505"
    tags  = ["prod"]
  }

  environments {
    key   = "development"
    name  = "Development" 
    color = "0969da"
    tags  = ["dev"]
  }

  environments {
    key   = "staging"
    name  = "Staging"
    color = "bf8700"
    tags  = ["staging"]
  }
}

# Theme Control Feature Flag
resource "launchdarkly_feature_flag" "default_theme" {
  project_key = launchdarkly_project.weather_app.key
  key         = "default-theme"
  name        = "Default Theme"
  description = "Controls the default theme for the weather app UI"

  variation_type = "string"
  variations {
    value       = "dark"
    name        = "Dark Synth"
    description = "Default dark synthwave theme"
  }
  variations {
    value       = "light"
    name        = "Light"
    description = "Clean light theme"
  }
  variations {
    value       = "dark-synth"
    name        = "Dark Synth (Direct)"
    description = "Direct dark synthwave theme"
  }
  variations {
    value       = "dark-green"
    name        = "Dark Green"
    description = "Matrix-style green theme"
  }
  variations {
    value       = "dark-orange"
    name        = "Dark Orange"
    description = "Amber terminal theme"
  }
  variations {
    value       = "grayscale"
    name        = "Grayscale"
    description = "Monochrome theme"
  }

  defaults {
    on_variation  = 0  # "dark"
    off_variation = 0  # "dark"
  }

  tags = ["ui", "theme", "visual"]
}

# Temperature Unit Feature Flag
resource "launchdarkly_feature_flag" "default_temperature" {
  project_key = launchdarkly_project.weather_app.key
  key         = "default-temperature"
  name        = "Default Temperature Unit"
  description = "Controls the default temperature unit display (Celsius or Fahrenheit)"

  variation_type = "string"
  variations {
    value       = "c"
    name        = "Celsius"
    description = "Display temperatures in Celsius"
  }
  variations {
    value       = "f"
    name        = "Fahrenheit"
    description = "Display temperatures in Fahrenheit"
  }

  defaults {
    on_variation  = 0  # "c" (Celsius)
    off_variation = 0  # "c" (Celsius)
  }

  tags = ["units", "temperature", "localization"]
}

# Distance Unit Feature Flag
resource "launchdarkly_feature_flag" "default_distance" {
  project_key = launchdarkly_project.weather_app.key
  key         = "default-distance"
  name        = "Default Distance Unit"
  description = "Controls the default distance unit for wind speed (Metric or Imperial)"

  variation_type = "string"
  variations {
    value       = "m"
    name        = "Metric"
    description = "Display wind speed in km/h"
  }
  variations {
    value       = "i"
    name        = "Imperial"
    description = "Display wind speed in mph"
  }

  defaults {
    on_variation  = 0  # "m" (Metric)
    off_variation = 0  # "m" (Metric)
  }

  tags = ["units", "distance", "localization"]
}

# Weather Refresh Interval Feature Flag
resource "launchdarkly_feature_flag" "weather_refresh_interval" {
  project_key = launchdarkly_project.weather_app.key
  key         = "weather-refresh-interval"
  name        = "Weather Refresh Interval"
  description = "Controls how often weather data is refreshed (in minutes)"

  variation_type = "number"
  variations {
    value       = 5
    name        = "5 Minutes"
    description = "Refresh every 5 minutes"
  }
  variations {
    value       = 10
    name        = "10 Minutes"
    description = "Refresh every 10 minutes"
  }
  variations {
    value       = 15
    name        = "15 Minutes"
    description = "Refresh every 15 minutes"
  }
  variations {
    value       = 30
    name        = "30 Minutes"
    description = "Refresh every 30 minutes"
  }

  defaults {
    on_variation  = 0  # 5 minutes
    off_variation = 0  # 5 minutes
  }

  tags = ["performance", "api", "refresh"]
}

# Animations Feature Flag
resource "launchdarkly_feature_flag" "enable_animations" {
  project_key = launchdarkly_project.weather_app.key
  key         = "enable-animations"
  name        = "Enable Animations"
  description = "Controls whether CRT effects, floating icons, and animations are enabled"

  variation_type = "boolean"
  variations {
    value       = true
    name        = "Enabled"
    description = "Show all animations and effects"
  }
  variations {
    value       = false
    name        = "Disabled"
    description = "Disable animations for performance"
  }

  defaults {
    on_variation  = 0  # true (enabled)
    off_variation = 1  # false (disabled)
  }

  tags = ["ui", "performance", "animations", "accessibility"]
}

# Extra Weather Info Feature Flag
resource "launchdarkly_feature_flag" "show_extra_weather_info" {
  project_key = launchdarkly_project.weather_app.key
  key         = "show-extra-weather-info"
  name        = "Show Extra Weather Info"
  description = "Controls whether additional weather details (humidity, wind speed) are displayed"

  variation_type = "boolean"
  variations {
    value       = true
    name        = "Show Details"
    description = "Display humidity and wind speed"
  }
  variations {
    value       = false
    name        = "Hide Details"
    description = "Show only basic temperature and conditions"
  }

  defaults {
    on_variation  = 0  # true (show)
    off_variation = 1  # false (hide)
  }

  tags = ["ui", "weather", "details"]
}

# Debug Mode Feature Flag
resource "launchdarkly_feature_flag" "debug_mode" {
  project_key = launchdarkly_project.weather_app.key
  key         = "debug-mode"
  name        = "Debug Mode"
  description = "Enables debug console logging throughout the application"

  variation_type = "boolean"
  variations {
    value       = true
    name        = "Debug On"
    description = "Enable debug logging"
  }
  variations {
    value       = false
    name        = "Debug Off"
    description = "Disable debug logging"
  }

  defaults {
    on_variation  = 1  # false (disabled)
    off_variation = 1  # false (disabled)
  }

  tags = ["development", "logging", "debug"]
}

# Output values
output "project_key" {
  description = "The LaunchDarkly project key"
  value       = launchdarkly_project.weather_app.key
}

output "client_side_id_production" {
  description = "Production environment client-side ID"
  value       = launchdarkly_project.weather_app.environments[0].client_side_id
  sensitive   = true
}

output "client_side_id_development" {
  description = "Development environment client-side ID"
  value       = launchdarkly_project.weather_app.environments[1].client_side_id
  sensitive   = true
}

output "feature_flags" {
  description = "List of created feature flags"
  value = {
    theme       = launchdarkly_feature_flag.default_theme.key
    temperature = launchdarkly_feature_flag.default_temperature.key
    distance    = launchdarkly_feature_flag.default_distance.key
    refresh     = launchdarkly_feature_flag.weather_refresh_interval.key
    animations  = launchdarkly_feature_flag.enable_animations.key
    extra_info  = launchdarkly_feature_flag.show_extra_weather_info.key
    debug       = launchdarkly_feature_flag.debug_mode.key
  }
} 