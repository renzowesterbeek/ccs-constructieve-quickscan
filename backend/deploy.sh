#!/bin/bash

# CCS Quickscan Backend Deployment Script
# This script sets up and deploys the backend service for S3 uploads and email notifications

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
STAGE=${1:-dev}
REGION=${2:-eu-west-1}
DOMAIN="creativecitysolutions.com"
FROM_EMAIL="noreply@creativecitysolutions.com"
TO_EMAIL="renzo@creativecitysolutions.com"

echo -e "${BLUE}🚀 CCS Quickscan Backend Deployment${NC}"
echo -e "${BLUE}=====================================${NC}"
echo -e "Stage: ${GREEN}$STAGE${NC}"
echo -e "Region: ${GREEN}$REGION${NC}"
echo -e "Domain: ${GREEN}$DOMAIN${NC}"
echo ""

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check prerequisites
print_info "Checking prerequisites..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install it first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install it first."
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials are not configured. Please run 'aws configure' first."
    exit 1
fi

print_status "Prerequisites check passed"

# Install dependencies
print_info "Installing dependencies..."
npm install
print_status "Dependencies installed"

# Configure AWS SES for email sending
print_info "Configuring AWS SES..."

# Check if domain is already verified
if aws ses get-identity-verification-attributes --identities "$DOMAIN" --region "$REGION" | grep -q "Success"; then
    print_status "Domain $DOMAIN is already verified in SES"
else
    print_warning "Domain $DOMAIN is not verified in SES"
    print_info "Verifying domain identity..."
    aws ses verify-domain-identity --domain "$DOMAIN" --region "$REGION"
    print_warning "Please check your DNS records and add the TXT record provided by AWS SES"
    print_warning "Then wait for verification to complete before proceeding"
    read -p "Press Enter when domain verification is complete..."
fi

# Verify email addresses for testing
print_info "Verifying email addresses..."
aws ses verify-email-identity --email-address "$FROM_EMAIL" --region "$REGION" || true
aws ses verify-email-identity --email-address "$TO_EMAIL" --region "$REGION" || true

print_warning "Please check your email and click the verification links"
print_warning "Then wait for email verification to complete before proceeding"
read -p "Press Enter when email verification is complete..."

# Build the project
print_info "Building the project..."
npm run build
print_status "Project built successfully"

# Deploy using Serverless Framework
print_info "Deploying to AWS..."
npm run deploy:$STAGE

# Get the API Gateway URL
print_info "Getting API Gateway URL..."
API_URL=$(aws cloudformation describe-stacks \
    --stack-name "ccs-quickscan-backend-$STAGE" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`ServiceEndpoint`].OutputValue' \
    --output text)

if [ -z "$API_URL" ] || [ "$API_URL" = "None" ]; then
    print_error "Could not retrieve API Gateway URL"
    exit 1
fi

print_status "Deployment completed successfully!"
echo ""
echo -e "${GREEN}🎉 Backend service is now deployed!${NC}"
echo ""
echo -e "${BLUE}API Gateway URL:${NC} $API_URL"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Update your frontend .env file with:"
echo -e "   ${YELLOW}VITE_API_BASE_URL=$API_URL${NC}"
echo ""
echo "2. Test the API endpoint:"
echo -e "   ${YELLOW}curl -X OPTIONS $API_URL/upload-package${NC}"
echo ""
echo "3. Monitor the deployment:"
echo -e "   ${YELLOW}aws logs describe-log-groups --log-group-name-prefix '/aws/lambda/ccs-quickscan-backend' --region $REGION${NC}"
echo ""

# Test the API endpoint
print_info "Testing API endpoint..."
if curl -s -X OPTIONS "$API_URL/upload-package" > /dev/null; then
    print_status "API endpoint is responding correctly"
else
    print_warning "API endpoint test failed - check the deployment"
fi

echo ""
print_info "Deployment script completed!"
print_info "For support, contact: renzo@creativecitysolutions.com" 