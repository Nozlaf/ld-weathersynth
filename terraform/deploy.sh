#!/bin/bash

# LaunchDarkly Terraform Deployment Script for Weather Synth App
# This script helps with the initial setup and deployment of the LaunchDarkly environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if terraform is installed
check_terraform() {
    if ! command -v terraform &> /dev/null; then
        print_error "Terraform is not installed. Please install Terraform first."
        echo "Visit: https://terraform.io/downloads"
        exit 1
    fi
    print_success "Terraform is installed: $(terraform version -json | jq -r .terraform_version)"
}

# Check if terraform.tfvars exists
check_tfvars() {
    if [ ! -f "terraform.tfvars" ]; then
        print_warning "terraform.tfvars not found. Creating from example..."
        if [ -f "terraform.tfvars.example" ]; then
            cp terraform.tfvars.example terraform.tfvars
            print_warning "Please edit terraform.tfvars and update your LaunchDarkly API token"
            echo "Then run this script again."
            exit 1
        else
            print_error "terraform.tfvars.example not found"
            exit 1
        fi
    else
        print_success "terraform.tfvars found"
    fi
}

# Initialize Terraform
init_terraform() {
    print_status "Initializing Terraform..."
    terraform init
    print_success "Terraform initialized"
}

# Format Terraform files
format_terraform() {
    print_status "Formatting Terraform files..."
    terraform fmt
    print_success "Terraform files formatted"
}

# Validate Terraform configuration
validate_terraform() {
    print_status "Validating Terraform configuration..."
    terraform validate
    print_success "Terraform configuration is valid"
}

# Plan Terraform deployment
plan_terraform() {
    print_status "Planning Terraform deployment..."
    terraform plan -out=tfplan
    print_success "Terraform plan created"
}

# Apply Terraform configuration
apply_terraform() {
    print_status "Applying Terraform configuration..."
    terraform apply tfplan
    print_success "Terraform configuration applied"
}

# Show outputs
show_outputs() {
    print_status "Deployment complete! Here are your outputs:"
    echo ""
    echo "Project Key: $(terraform output -raw project_key)"
    echo ""
    echo "Client-Side IDs (for your .env file):"
    echo "Production: $(terraform output -raw client_side_id_production)"
    echo "Development: $(terraform output -raw client_side_id_development)"
    echo ""
    echo "Feature Flags Created:"
    terraform output -json feature_flags | jq -r 'to_entries[] | "- \(.key): \(.value)"'
    echo ""
    print_success "Update your .env file with the appropriate client-side ID!"
}

# Main deployment function
deploy() {
    print_status "Starting LaunchDarkly Terraform deployment..."
    
    check_terraform
    check_tfvars
    init_terraform
    format_terraform
    validate_terraform
    plan_terraform
    
    echo ""
    print_warning "Ready to apply changes. Continue? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        apply_terraform
        show_outputs
    else
        print_status "Deployment cancelled"
        exit 0
    fi
}

# Help function
show_help() {
    echo "LaunchDarkly Terraform Deployment Script"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  deploy    - Full deployment (init, plan, apply)"
    echo "  plan      - Plan changes only"
    echo "  apply     - Apply planned changes"
    echo "  outputs   - Show current outputs"
    echo "  init      - Initialize Terraform"
    echo "  validate  - Validate configuration"
    echo "  format    - Format Terraform files"
    echo "  help      - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 deploy     # Full deployment"
    echo "  $0 plan       # Plan changes only"
    echo "  $0 outputs    # Show current outputs"
    echo ""
}

# Command handling
case "${1:-deploy}" in
    "deploy")
        deploy
        ;;
    "plan")
        check_terraform
        check_tfvars
        init_terraform
        validate_terraform
        plan_terraform
        ;;
    "apply")
        check_terraform
        apply_terraform
        show_outputs
        ;;
    "outputs")
        show_outputs
        ;;
    "init")
        check_terraform
        init_terraform
        ;;
    "validate")
        check_terraform
        validate_terraform
        ;;
    "format")
        format_terraform
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac 