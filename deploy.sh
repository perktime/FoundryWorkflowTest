#!/bin/bash

# Azure Container Apps Deployment Script
# Make sure you're logged into Azure CLI: az login

set -e

# Configuration
RESOURCE_GROUP="rg-foundry-workflow"
LOCATION="eastus2"
CONTAINER_APP_ENV="foundry-workflow-env"
CONTAINER_APP_NAME="foundry-workflow-app"
ACR_NAME="foundryworkflowacr$(date +%s)"
IMAGE_NAME="foundry-workflow"
TAG="latest"

echo "🚀 Starting deployment to Azure Container Apps..."

# Create resource group if it doesn't exist
echo "📦 Creating resource group..."
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create Azure Container Registry
echo "🏗️ Creating Azure Container Registry..."
az acr create --resource-group $RESOURCE_GROUP --name $ACR_NAME --sku Basic

# Get ACR login server
ACR_SERVER=$(az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP --query loginServer --output tsv)

# Build and push image to ACR
echo "🔨 Building and pushing Docker image..."
az acr build --registry $ACR_NAME --image $IMAGE_NAME:$TAG .

# Create Container Apps environment
echo "🌍 Creating Container Apps environment..."
az containerapp env create \
  --name $CONTAINER_APP_ENV \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION

# Create the container app
echo "📱 Creating Container App..."
az containerapp create \
  --name $CONTAINER_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --environment $CONTAINER_APP_ENV \
  --image "$ACR_SERVER/$IMAGE_NAME:$TAG" \
  --target-port 3000 \
  --ingress 'external' \
  --min-replicas 1 \
  --max-replicas 3 \
  --cpu 0.25 \
  --memory 0.5Gi \
  --secrets \
    azure-endpoint="$AZURE_EXISTING_AIPROJECT_ENDPOINT" \
    agent-id="$AZURE_EXISTING_AGENT_ID" \
  --env-vars \
    AZURE_EXISTING_AIPROJECT_ENDPOINT=secretref:azure-endpoint \
    AZURE_EXISTING_AGENT_ID=secretref:agent-id

# Get the app URL
APP_URL=$(az containerapp show --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP --query properties.configuration.ingress.fqdn --output tsv)

echo "✅ Deployment completed successfully!"
echo "🌐 Your app is available at: https://$APP_URL"
echo "🔍 Health check: https://$APP_URL/health"
echo "🔧 API endpoint: https://$APP_URL/api/workflow"

echo "💡 To test your API, you can use:"
echo "curl -X POST https://$APP_URL/api/workflow \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"input\": \"Test product concept for HoloNest AR device\"}'"