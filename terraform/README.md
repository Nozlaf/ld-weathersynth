# LaunchDarkly Terraform Configuration

This directory contains Terraform configuration to set up the complete LaunchDarkly environment for the Weather Synth app.

## 🚀 Quick Start

### Prerequisites

- [Terraform](https://terraform.io) installed (>= 1.0)
- LaunchDarkly account with API access token
- Project key: `weather-app`

### Setup

1. **Copy the example variables file:**
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

2. **Update your LaunchDarkly API token:**
   Edit `terraform.tfvars` and replace with your actual token:
   ```hcl
   launchdarkly_access_token = "your-actual-api-token-here"
   ```

3. **Initialize Terraform:**
   ```bash
   terraform init
   ```

4. **Plan the deployment:**
   ```bash
   terraform plan
   ```

5. **Apply the configuration:**
   ```bash
   terraform apply
   ```

6. **Get your client-side IDs:**
   ```bash
   terraform output client_side_id_production
   terraform output client_side_id_development
   ```

## 🎛️ What Gets Created

### Project Structure
- **Project**: `weather-app` (Weather Synth App)
- **Environments**: Production, Development, Staging
- **Tags**: Organized with relevant tags for easy management

### Feature Flags

| Flag Key | Type | Default | Description |
|----------|------|---------|-------------|
| `default-theme` | String | `"dark"` | UI theme control with 6 theme options |
| `default-temperature` | String | `"c"` | Temperature unit (Celsius/Fahrenheit) |
| `default-distance` | String | `"m"` | Distance unit (Metric/Imperial) |
| `weather-refresh-interval` | Number | `5` | Weather refresh interval (minutes) |
| `enable-animations` | Boolean | `true` | CRT effects and animations toggle |
| `show-extra-weather-info` | Boolean | `true` | Extra weather details toggle |
| `debug-mode` | Boolean | `false` | Debug logging toggle |

### Theme Variations
The `default-theme` flag supports these values:
- `"dark"` - Dark Synth (maps to dark-synth)
- `"light"` - Clean light theme
- `"dark-synth"` - Direct synthwave theme
- `"dark-green"` - Matrix-style green
- `"dark-orange"` - Amber terminal style
- `"grayscale"` - Monochrome theme

## 🔧 Configuration Details

### Provider Configuration
Uses the official LaunchDarkly Terraform provider:
```hcl
launchdarkly = {
  source  = "launchdarkly/launchdarkly"
  version = "~> 2.0"
}
```

### Environment Setup
Creates three environments with color coding:
- **Production** (Green: #417505)
- **Development** (Blue: #0969da)  
- **Staging** (Orange: #bf8700)

### Flag Organization
Flags are tagged for easy filtering:
- `ui`, `theme`, `visual` - UI-related flags
- `units`, `localization` - Unit preferences
- `performance`, `api` - Performance controls
- `development`, `debug` - Development tools

## 📋 Commands Reference

### Essential Commands
```bash
# Initialize Terraform
terraform init

# Format code
terraform fmt

# Validate configuration
terraform validate

# Plan changes
terraform plan

# Apply changes
terraform apply

# Show current state
terraform show

# List all resources
terraform state list

# Get outputs
terraform output
```

### Managing Individual Flags
```bash
# Target specific flag for changes
terraform apply -target=launchdarkly_feature_flag.default_theme

# Import existing flag
terraform import launchdarkly_feature_flag.default_theme weather-app/default-theme

# Remove flag (careful!)
terraform destroy -target=launchdarkly_feature_flag.debug_mode
```

## 🔄 Updating Configuration

### Adding New Flags
1. Add the flag resource to `main.tf`
2. Include appropriate variations and defaults
3. Add to the outputs section
4. Run `terraform apply`

### Modifying Existing Flags
1. Update the flag resource
2. Plan to see changes: `terraform plan`
3. Apply: `terraform apply`

### Environment Management
Environments are defined in the project resource. To add/modify:
1. Update the `environments` block in `launchdarkly_project.weather_app`
2. Apply changes with `terraform apply`

## 🔒 Security Notes

### Sensitive Data
- API tokens are marked as `sensitive = true`
- Client-side IDs are marked as sensitive outputs
- Never commit `terraform.tfvars` with real tokens

### Best Practices
1. Use environment-specific tokens when possible
2. Rotate API tokens regularly
3. Use least-privilege access for tokens
4. Store state file securely (consider remote state)

## 🚨 Troubleshooting

### Common Issues

**"Project already exists" error:**
```bash
# Import existing project
terraform import launchdarkly_project.weather_app weather-app
```

**"Flag already exists" error:**
```bash
# Import existing flag
terraform import launchdarkly_feature_flag.default_theme weather-app/default-theme
```

**Permission denied:**
- Verify your API token has correct permissions
- Check that token hasn't expired
- Ensure project key matches

### Useful Commands
```bash
# Debug Terraform execution
TF_LOG=DEBUG terraform apply

# Force refresh state
terraform refresh

# Check for drift
terraform plan -detailed-exitcode
```

## 📁 File Structure

```
terraform/
├── main.tf                    # Main Terraform configuration
├── terraform.tfvars.example  # Example variables file
├── README.md                 # This file
└── terraform.tfvars         # Your actual variables (gitignored)
```

## 🔗 Integration with Weather App

Once deployed, update your app's `.env` file:

```bash
# Use the client-side ID from terraform output
REACT_APP_LAUNCHDARKLY_CLIENT_ID=your-client-side-id-from-terraform-output
```

The app will automatically connect to these feature flags and respond to real-time changes!

## 📚 Additional Resources

- [LaunchDarkly Terraform Provider Documentation](https://registry.terraform.io/providers/launchdarkly/launchdarkly/latest/docs)
- [Terraform Documentation](https://terraform.io/docs)
- [LaunchDarkly API Documentation](https://apidocs.launchdarkly.com)
- [Weather Synth App Repository](../README.md) 