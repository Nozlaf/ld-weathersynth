# LaunchDarkly Terraform Configuration for Weather Synth App

This Terraform configuration manages your existing LaunchDarkly project for the Weather Synth application. The configuration has been retrieved from your live LaunchDarkly instance and reflects the current state of your project.

## 📋 Overview

This Infrastructure-as-Code (IaC) setup manages:
- **Project**: `weather-app` 
- **Environments**: `test` and `production`
- **Feature Flags**: 6 flags (excluding theme flags as requested)
- **Metrics**: Custom theme-change metric
- **Targeting Rules**: Current flag states and environment-specific configurations

## 🚀 Quick Start

### Prerequisites

1. **Terraform**: Install Terraform >= 1.0
2. **LaunchDarkly Access Token**: Your API token with appropriate permissions
3. **LaunchDarkly Provider**: Will be automatically installed

### Setup

1. **Clone and Navigate**:
```bash
cd weather-synth/terraform
```

2. **Configure Variables**:
```bash
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your API token
```

3. **Initialize and Apply**:
```bash
terraform init
terraform plan
terraform apply
```

## 🏗️ Current Infrastructure

### Project Configuration
- **Key**: `weather-app`
- **Name**: `weather-app`
- **Tags**: None currently set

### Environments

| Environment | Key | Name | Color | Current State |
|-------------|-----|------|-------|---------------|
| Test | `test` | Test | `#EBFF38` (Yellow) | All flags OFF |
| Production | `production` | Production | `#00DA7B` (Green) | All flags OFF |

### Feature Flags (Retrieved from API)

#### 1. Default Temperature (`default-temperature`)
- **Type**: String (Multivariate)
- **Description**: "should this be celcius or freedom units"
- **Variations**: 
  - `"c"` - Celsius
  - `"f"` - Freedom units (Fahrenheit)  
  - `"k"` - Kelvin (not used)
- **Current State**: OFF in both environments
- **Fallthrough**: Celsius (`"c"`)
- **Off Variation**: Fahrenheit (`"f"`)

#### 2. Default Distance (`default-distance`)
- **Type**: String (Multivariate)
- **Description**: "" (empty)
- **Variations**:
  - `"m"` - Metric (km/h)
  - `"i"` - Freedom (mph)
- **Current State**: OFF in both environments
- **Fallthrough**: Metric (`"m"`)
- **Off Variation**: Imperial (`"i"`)

#### 3. Weather Refresh Interval (`weather-refresh-interval`)
- **Type**: Number (Multivariate)
- **Description**: "" (empty)
- **Variations**:
  - `5` - Five Minutes (Default)
  - `60` - Hourly
  - `30` - Half Hourly
  - `720` - Half Day
  - `1440` - daily
- **Current State**: OFF in both environments
- **Fallthrough**: 
  - Production: 5 minutes
  - Test: 720 minutes (Half Day)
- **Off Variation**: 60 minutes (Hourly)

#### 4. Enable Animations (`enable-animations`)
- **Type**: Boolean
- **Description**: "Enables Animations for CRT / Weather / Theme elements"
- **Variations**:
  - `true` - Enabled
  - `false` - Disabled
- **Current State**: OFF in both environments
- **Fallthrough**: Enabled (`true`)
- **Off Variation**: Disabled (`false`)

#### 5. Show Extra Weather Info (`show-extra-weather-info`)
- **Type**: Boolean
- **Description**: "Show humidity and windspeed on the screen"
- **Variations**:
  - `true` - Extra Info
  - `false` - Basic Info
- **Current State**: OFF in both environments
- **Fallthrough**: Extra Info (`true`)
- **Off Variation**: Basic Info (`false`)

#### 6. Debug Mode (`debug-mode`)
- **Type**: Boolean
- **Description**: "Enable debug logging in console"
- **Variations**:
  - `true` - Enabled
  - `false` - Disabled
- **Current State**: OFF in both environments
- **Fallthrough**: Enabled (`true`)
- **Off Variation**: Disabled (`false`)

### Client-Side SDK Configuration

All feature flags are configured with:
- ✅ **Client-side availability enabled** (`using_environment_id: true`)
- ❌ **Mobile key disabled** (`using_mobile_key: false`)
- 🔄 **Temporary flags** (all set to `temporary: true`)

This allows your React application to access the flags using the client-side ID.

### Metrics

#### Custom Metrics
- **theme-change**: Tracks theme change events (custom metric)

#### LaunchDarkly Telemetry Metrics (Auto-generated)
Your project also includes standard LaunchDarkly telemetry metrics for performance monitoring:
- First Contentful Paint (FCP) metrics
- Document Load Latency metrics  
- Time to First Byte (TTFB) metrics
- First Input Delay (FID) metrics
- Largest Contentful Paint (LCP) metrics
- Error rate tracking

## 🎯 Usage Examples

### Initialization
```bash
terraform init
```

### Preview Changes
```bash
terraform plan
```

### Apply Configuration
```bash
terraform apply
```

### Destroy Infrastructure (⚠️ Use with caution)
```bash
terraform destroy
```

## 📁 File Structure

```
terraform/
├── main.tf                    # Main Terraform configuration
├── terraform.tfvars.example  # Example variables file
├── .gitignore                # Git ignore for Terraform files
├── deploy.sh                 # Deployment script
└── README.md                 # This documentation
```

## 🔧 Configuration Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `launchdarkly_access_token` | Your LaunchDarkly API access token | - | ✅ |
| `project_key` | LaunchDarkly project key | `"weather-app"` | ❌ |
| `project_name` | LaunchDarkly project name | `"weather-app"` | ❌ |

## 📤 Outputs

After successful deployment, Terraform provides:

| Output | Description |
|--------|-------------|
| `project_key` | The LaunchDarkly project key |
| `client_side_id_production` | Client-side ID for Production environment |
| `client_side_id_test` | Client-side ID for Test environment |
| `feature_flags` | Map of all created feature flags |

### Example Output
```bash
Outputs:

client_side_id_production = "68zxxxxxx"
client_side_id_test = "685xxxx"
feature_flags = {
  "debug_mode" = "debug-mode"
  "default_distance" = "default-distance"
  "default_temperature" = "default-temperature"
  "enable_animations" = "enable-animations"
  "show_extra_weather_info" = "show-extra-weather-info"
  "weather_refresh_interval" = "weather-refresh-interval"
}
project_key = "weather-app"
```

## 🚨 Important Notes

### Data Source
This configuration was generated by:
1. **API Retrieval**: Connected to your live LaunchDarkly instance
2. **Current State Mapping**: Retrieved all project, environment, and flag configurations
3. **Terraform Translation**: Converted live state to Infrastructure-as-Code

### Excluded Configuration
- **Theme flags**: Excluded as requested (`default-theme` flag not managed)
- **LaunchDarkly Telemetry Metrics**: Auto-generated metrics are not managed by Terraform

### Current State
- **All flags are currently OFF** in both environments
- **No custom targeting rules** are currently configured
- **No user/context targeting** is currently set up

## 🔍 Troubleshooting

### Common Issues

#### 1. Authentication Errors
```bash
Error: 401 Unauthorized
```
**Solution**: Verify your API token has correct permissions in `terraform.tfvars`

#### 2. Resource Already Exists
```bash
Error: resource already exists
```
**Solution**: This is expected since we're importing existing resources. The configuration matches your current setup.

#### 3. State Drift
If Terraform detects changes between your configuration and live state:
```bash
terraform refresh
terraform plan
```

### Getting Help

1. **LaunchDarkly Documentation**: [docs.launchdarkly.com](https://docs.launchdarkly.com)
2. **Terraform Provider**: [registry.terraform.io/providers/launchdarkly/launchdarkly](https://registry.terraform.io/providers/launchdarkly/launchdarkly)
3. **LaunchDarkly Support**: Available through your LaunchDarkly account

## 🔗 Integration with React App

Your React application can use the client-side IDs generated by Terraform:

```bash
# Get the client-side IDs from Terraform output
terraform output client_side_id_production
terraform output client_side_id_test
```

Example LaunchDarkly React SDK usage:
```javascript
import { withLDProvider } from 'launchdarkly-react-client-sdk';

const App = () => {
  // Your app code
};

// Use environment variables to set the client-side ID
export default withLDProvider({
  clientSideID: process.env.REACT_APP_LAUNCHDARKLY_CLIENT_ID,
  user: {
    key: 'user-key',
  },
})(App);
```

## 📊 Next Steps

1. **Review Configuration**: Ensure all flags match your expectations
2. **Enable Flags**: Use LaunchDarkly UI or Terraform to enable flags as needed
3. **Set Targeting Rules**: Configure user/context targeting through LaunchDarkly UI
4. **Monitor Usage**: Use LaunchDarkly's analytics to track flag performance
5. **Iterate**: Update this Terraform configuration as your feature flag strategy evolves

---

**Generated**: This configuration was automatically generated from your live LaunchDarkly instance on $(date) and reflects your current project state excluding theme-related configurations as requested. 