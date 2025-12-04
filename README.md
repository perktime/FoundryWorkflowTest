# Azure AI Foundry Workflow Container App

A containerized web service that exposes Azure AI Foundry workflows as HTTP APIs with a web interface for testing and interaction.

## Getting Started

1. **Open in DevContainer**: 
   - Open this folder in VS Code
   - When prompted, click "Reopen in Container" or use Command Palette: `Dev Containers: Reopen in Container`

2. **Set up environment variables**:
   - Copy `.env.example` to `.env`
   - Update the values in `.env` with your Azure AI Foundry project details

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Run the application**:
   ```bash
   npm start
   ```
   
   The application will be available at http://localhost:3000

## Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server  
- `npm test` - Run tests
- `npm run docker:build` - Build Docker image
- `npm run docker:run` - Run Docker container

## DevContainer Features

- **Base Image**: Node.js 20 on Debian Bookworm
- **Azure CLI**: Latest version with Bicep support
- **VS Code Extensions**: Azure tools, JSON support
- **Port Forwarding**: Ports 3000 and 8080 configured
- **Azure Credentials**: Mounts local Azure credentials for seamless authentication

## Project Structure

- `server.js` - Main Express server and workflow execution logic
- `public/` - Static web files including the web interface
- `.devcontainer/` - DevContainer configuration
- `package.json` - Node.js dependencies and scripts
- `.env.example` - Template for environment variables
- `Dockerfile` - Docker container configuration
- `deploy.sh` - Azure Container Apps deployment script
- `azure-container-app.json` - Azure Container Apps configuration
- `k8s-deployment.yaml` - Kubernetes deployment configuration

## Deployment

### Docker
Build and run the application in a Docker container:

```bash
npm run docker:build
npm run docker:run
```

### Azure Container Apps
Deploy to Azure Container Apps using the provided script:

```bash
./deploy.sh
```

Make sure you're logged into Azure CLI first:
```bash
az login
```

## Azure Authentication

The DevContainer mounts your local Azure credentials (`~/.azure`) so you can use Azure CLI and DefaultAzureCredential seamlessly. Make sure you're logged in to Azure CLI before opening the container:

```bash
az login
```

## Dependencies

- `@azure/identity` - Azure authentication
- `@azure/ai-projects` - Azure AI Foundry SDK
- `express` - Web server framework
- `dotenv` - Environment variable management

## API Endpoints

- `GET /health` - Health check endpoint
- `GET /` - Web interface for testing workflows
- Additional workflow endpoints are defined in `server.js`