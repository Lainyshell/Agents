# Unified Work Item Intelligence Agent

A comprehensive agent that integrates with Azure DevOps to read work items, classify and prioritize them using intelligent analysis, and push updates to Microsoft Teams and Copilot Studio. The agent maintains state across sprints to provide continuous intelligence throughout your development lifecycle.

## Features

🔗 **Azure DevOps Integration**
- Connects to Azure DevOps using personal access tokens
- Queries work items using WIQL (Work Item Query Language)
- Retrieves detailed work item information including title, type, state, description, and tags
- Supports filtering by sprint/iteration path

🏷️ **Intelligent Classification**
- Automatically analyzes work item content
- Suggests relevant tags based on technical areas (UI, Backend, Database, Performance, Security, etc.)
- Assigns priority levels (Critical, High, Medium, Low) based on keywords and context
- Provides confidence scores and reasoning for classifications

📈 **Priority Management**
- Critical: Production issues, security vulnerabilities, data loss risks
- High: Urgent items with customer impact
- Medium: Standard development work
- Low: Nice-to-have enhancements

📢 **Teams Integration**
- Sends rich adaptive cards to Microsoft Teams channels
- Individual work item notifications with classification details
- Batch summaries with priority breakdowns
- Direct links to work items in Azure DevOps

🤖 **Copilot Studio Notifications**
- RESTful API integration with Copilot Studio agents
- Real-time notifications about classified work items
- Batch processing updates
- Structured JSON payloads for easy integration

💾 **State Management**
- Maintains work item and classification state across sprints
- In-memory storage with export/import capabilities
- Sprint-level statistics and reporting
- Supports multiple concurrent sprints

## Prerequisites

- [Node.js](https://nodejs.org) version 20 or higher
- Azure DevOps account with a personal access token (PAT)
- (Optional) Microsoft Teams incoming webhook URL
- (Optional) Copilot Studio API endpoint and credentials

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the `env.TEMPLATE` file to `.env` and fill in your configuration:

```bash
cp env.TEMPLATE .env
```

Edit `.env` with your credentials:

```env
# Azure Bot Service (for production deployment)
clientId=your-app-id
clientSecret=your-client-secret
tenantId=your-tenant-id

# Azure DevOps Configuration (Required)
AZURE_DEVOPS_ORG=your-organization-name
AZURE_DEVOPS_PROJECT=your-project-name
AZURE_DEVOPS_PAT=your-personal-access-token

# Teams Webhook (Optional)
TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/...

# Copilot Studio (Optional)
COPILOT_STUDIO_ENDPOINT=https://your-copilot-endpoint/api
COPILOT_STUDIO_API_KEY=your-api-key
```

### 3. Generate Azure DevOps Personal Access Token

1. Go to [Azure DevOps](https://dev.azure.com/)
2. Click on your profile icon → Personal access tokens
3. Create new token with **Work Items (Read & Write)** permissions
4. Copy the token to `AZURE_DEVOPS_PAT` in your `.env` file

### 4. (Optional) Configure Teams Webhook

1. In Microsoft Teams, go to your channel
2. Click the "..." menu → Connectors → Incoming Webhook
3. Configure the webhook and copy the URL
4. Add to `TEAMS_WEBHOOK_URL` in your `.env` file

## Running the Agent

### Development Mode (Anonymous)

For local testing without authentication:

```bash
npm run build
npm run start:anon
```

### Production Mode (With Authentication)

For Azure Bot Service deployment:

```bash
npm start
```

### Using the Test Tool

Start the agent with the interactive test tool:

```bash
npm test
```

This will start both the agent and the Teams App Test Tool in your browser.

## Using the Agent

Once the agent is running, you can interact with it using these commands:

### Initial Setup

```
sync [sprint-name]
```
Fetches work items from Azure DevOps for the specified sprint. If no sprint is provided, fetches all work items.

Example:
```
sync Sprint 23
```

### Classification

```
classify
```
Manually trigger classification of all synced work items in the current sprint.

### View Statistics

```
stats [sprint-name]
```
View detailed statistics for a specific sprint, including:
- Total work items
- Classification counts
- Priority breakdown
- Last sync time

Example:
```
stats Sprint 23
```

### List Sprints

```
sprints
```
View all sprints that have been tracked by the agent.

### Export State

```
export
```
Export the current state data for backup or analysis.

### Help

```
help
```
Display available commands and usage information.

## Architecture

The agent is built using the Microsoft 365 Agents SDK and consists of several specialized services:

### Core Services

1. **AzureDevOpsService** (`azureDevOpsService.ts`)
   - Manages connection to Azure DevOps REST API
   - Executes WIQL queries to fetch work items
   - Updates work items with tags and priorities

2. **ClassificationService** (`classificationService.ts`)
   - Analyzes work item content using rule-based logic
   - Suggests tags based on technical areas
   - Assigns priority levels based on keywords
   - Provides confidence scores and reasoning

3. **TeamsNotificationService** (`teamsNotificationService.ts`)
   - Formats and sends adaptive cards to Teams
   - Handles individual and batch notifications
   - Includes priority-based color coding

4. **CopilotStudioNotificationService** (`copilotStudioNotificationService.ts`)
   - Sends structured JSON notifications to Copilot Studio
   - Supports real-time and batch processing updates

5. **StateManagementService** (`stateManagementService.ts`)
   - Maintains in-memory state across sprints
   - Stores work items and classifications
   - Provides statistics and reporting
   - Supports export/import for persistence

## Example Workflow

1. **Sync Work Items**
   ```
   sync Sprint 24
   ```
   The agent fetches all work items from Sprint 24, automatically classifies them, and sends notifications.

2. **Review Statistics**
   ```
   stats Sprint 24
   ```
   View the breakdown of priorities and total work items.

3. **View All Sprints**
   ```
   sprints
   ```
   See all sprints being tracked.

4. **Manual Classification**
   ```
   classify
   ```
   Re-run classification if work items have been updated.

## Classification Logic

The agent uses intelligent rule-based classification:

### Priority Assignment

- **Critical (1)**: Contains keywords like "critical", "production down", "security", "data loss", "blocker"
- **High (2)**: Contains "urgent", "important", "customer impact", "high priority"
- **Medium (3)**: Standard work items (default)
- **Low (4)**: Contains "nice to have", "low priority", "enhancement", "cosmetic"

### Tag Suggestions

Technical areas are identified from content:
- **UI**: "ui", "frontend", "interface"
- **Backend**: "backend", "api", "server"
- **Database**: "database", "sql", "data"
- **Performance**: "performance", "slow", "optimization"
- **Security**: "security", "authentication", "authorization"
- **Testing**: "test", "testing", "qa"
- **Documentation**: "documentation", "docs", "readme"

## Extending the Agent

### Adding Custom Classification Rules

Edit `src/classificationService.ts` and add your logic to the `classifyWorkItem` method:

```typescript
// Custom rule example
if (text.includes('mobile')) {
  suggestedTags.push('Mobile');
  reasoning += 'Mobile platform identified. ';
}
```

### Integrating with AI Services

Replace the rule-based classification with AI:

```typescript
// Example: Azure OpenAI integration
const response = await openai.chat.completions.create({
  messages: [{ 
    role: "system", 
    content: "Classify this work item and suggest tags..." 
  }],
  model: "gpt-4"
});
```

### Adding Persistent Storage

Replace `MemoryStorage` with Azure Cosmos DB, Azure Storage, or your preferred database:

```typescript
import { CosmosDbPartitionedStorage } from 'botbuilder-azure';

const storage = new CosmosDbPartitionedStorage({
  cosmosDbEndpoint: process.env.COSMOS_ENDPOINT,
  authKey: process.env.COSMOS_KEY,
  databaseId: 'agents',
  containerId: 'workitems'
});
```

## Deployment

### Deploy to Azure

1. Create an Azure Bot Service resource
2. Configure authentication (App ID and Secret)
3. Set up a dev tunnel or deploy to Azure App Service
4. Configure the messaging endpoint in Azure Bot

See [Azure Bot Create Guide](https://learn.microsoft.com/en-us/microsoft-365/agents-sdk/azure-bot-create-single-secret) for details.

### Environment Variables in Azure

Set these in your Azure App Service Configuration:
- `AZURE_DEVOPS_ORG`
- `AZURE_DEVOPS_PROJECT`
- `AZURE_DEVOPS_PAT`
- `TEAMS_WEBHOOK_URL` (optional)
- `COPILOT_STUDIO_ENDPOINT` (optional)
- `COPILOT_STUDIO_API_KEY` (optional)

## Security Considerations

- **Personal Access Tokens**: Keep your PAT secure. Use Azure Key Vault in production.
- **Webhook URLs**: Protect Teams webhook URLs to prevent unauthorized notifications.
- **API Keys**: Store Copilot Studio credentials securely.
- **HTTPS**: Always use HTTPS endpoints in production.

## Troubleshooting

### Azure DevOps Connection Issues

- Verify your PAT has correct permissions (Work Items: Read & Write)
- Check organization and project names are correct
- Ensure PAT hasn't expired

### Teams Notifications Not Sending

- Verify webhook URL is correct and active
- Check Teams channel has connector enabled
- Review console logs for error messages

### Classification Not Working

- Ensure work items have been synced first
- Check work item descriptions contain analyzable text
- Review console output for classification details

## Further Reading

- [Microsoft 365 Agents SDK Documentation](https://learn.microsoft.com/microsoft-365/agents-sdk/)
- [Azure DevOps REST API](https://learn.microsoft.com/rest/api/azure/devops/)
- [Teams Incoming Webhooks](https://learn.microsoft.com/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook)
- [Copilot Studio](https://learn.microsoft.com/microsoft-copilot-studio/)

## License

MIT License - Copyright (c) Microsoft Corporation
