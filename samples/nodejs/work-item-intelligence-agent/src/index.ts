// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { startServer } from '@microsoft/agents-hosting-express';
import { TurnState, MemoryStorage, TurnContext, AgentApplication } from '@microsoft/agents-hosting';
import { ActivityTypes } from '@microsoft/agents-activity';
import { AzureDevOpsService } from './azureDevOpsService.js';
import { ClassificationService } from './classificationService.js';
import { TeamsNotificationService } from './teamsNotificationService.js';
import { CopilotStudioNotificationService } from './copilotStudioNotificationService.js';
import { StateManagementService } from './stateManagementService.js';

// Environment variables
const AZURE_DEVOPS_ORG = process.env.AZURE_DEVOPS_ORG || 'your-organization';
const AZURE_DEVOPS_PROJECT = process.env.AZURE_DEVOPS_PROJECT || 'your-project';
const AZURE_DEVOPS_PAT = process.env.AZURE_DEVOPS_PAT || '';
const TEAMS_WEBHOOK_URL = process.env.TEAMS_WEBHOOK_URL;
const COPILOT_STUDIO_ENDPOINT = process.env.COPILOT_STUDIO_ENDPOINT;
const COPILOT_STUDIO_API_KEY = process.env.COPILOT_STUDIO_API_KEY;

// Create custom conversation state properties
interface ConversationState {
  count: number;
  currentSprint?: string;
}
type ApplicationTurnState = TurnState<ConversationState>;

// Initialize services
const storage = new MemoryStorage();
const stateManagement = new StateManagementService();
const classificationService = new ClassificationService();
const teamsService = new TeamsNotificationService(TEAMS_WEBHOOK_URL);
const copilotStudioService = new CopilotStudioNotificationService(
  COPILOT_STUDIO_ENDPOINT,
  COPILOT_STUDIO_API_KEY
);

// Initialize Azure DevOps service if configured
let azureDevOpsService: AzureDevOpsService | null = null;
if (AZURE_DEVOPS_PAT) {
  azureDevOpsService = new AzureDevOpsService(
    AZURE_DEVOPS_ORG,
    AZURE_DEVOPS_PROJECT,
    AZURE_DEVOPS_PAT
  );
}

const agentApp = new AgentApplication<ApplicationTurnState>({
  storage
});

// Display a welcome message when members are added
agentApp.onConversationUpdate('membersAdded', async (context: TurnContext, state: ApplicationTurnState) => {
  await context.sendActivity(`👋 **Welcome to the Unified Work Item Intelligence Agent!**

I can help you:
- 📊 Fetch work items from Azure DevOps
- 🏷️ Classify and tag work items automatically
- 📈 Prioritize work based on content analysis
- 📢 Send updates to Teams
- 🤖 Notify Copilot Studio agents
- 💾 Maintain state across sprints

**Available Commands:**
- \`sync [sprint-name]\` - Sync work items from Azure DevOps
- \`classify\` - Classify all synced work items
- \`stats [sprint-name]\` - View sprint statistics
- \`sprints\` - List all tracked sprints
- \`help\` - Show this help message

Type a command to get started!`);
});

// Listen for messages
agentApp.onActivity(ActivityTypes.Message, async (context: TurnContext, state: ApplicationTurnState) => {
  const text = context.activity.text?.trim().toLowerCase() || '';
  let count = state.conversation.count ?? 0;
  state.conversation.count = ++count;

  try {
    // Help command
    if (text === 'help') {
      await context.sendActivity(`**Available Commands:**
- \`sync [sprint-name]\` - Sync work items from Azure DevOps for a specific sprint
- \`classify\` - Classify all synced work items in the current sprint
- \`stats [sprint-name]\` - View statistics for a sprint
- \`sprints\` - List all tracked sprints
- \`export\` - Export sprint state data
- \`help\` - Show this help message`);
      return;
    }

    // Sync command
    if (text.startsWith('sync')) {
      if (!azureDevOpsService) {
        await context.sendActivity('❌ Azure DevOps is not configured. Please set AZURE_DEVOPS_PAT in your environment.');
        return;
      }

      const parts = text.split(' ');
      const sprintName = parts.length > 1 ? parts.slice(1).join(' ') : 'Current Sprint';
      
      await context.sendActivity(`⏳ Syncing work items from Azure DevOps for sprint: ${sprintName}...`);
      
      try {
        const workItems = await azureDevOpsService.getWorkItems(sprintName !== 'Current Sprint' ? sprintName : undefined);
        stateManagement.updateWorkItems(sprintName, workItems);
        state.conversation.currentSprint = sprintName;
        
        await context.sendActivity(`✅ Successfully synced ${workItems.length} work items for sprint: ${sprintName}`);
        
        // Automatically classify
        await context.sendActivity(`🔍 Classifying work items...`);
        const classifications = await classificationService.classifyWorkItems(workItems);
        stateManagement.storeClassifications(sprintName, classifications);
        
        await context.sendActivity(`✅ Classified ${classifications.length} work items!`);
        
        // Send notifications
        if (TEAMS_WEBHOOK_URL) {
          await teamsService.sendBatchSummary(workItems, classifications);
          await context.sendActivity(`📢 Sent summary to Teams`);
        }
        
        if (COPILOT_STUDIO_ENDPOINT) {
          await copilotStudioService.notifyBatchProcessing(workItems, classifications);
          await context.sendActivity(`🤖 Notified Copilot Studio`);
        }
        
        // Show quick stats
        const stats = stateManagement.getSprintStats(sprintName);
        if (stats) {
          await context.sendActivity(`📊 **Sprint Stats:**
- Critical: ${stats.priorityBreakdown.critical}
- High: ${stats.priorityBreakdown.high}
- Medium: ${stats.priorityBreakdown.medium}
- Low: ${stats.priorityBreakdown.low}`);
        }
      } catch (error: any) {
        await context.sendActivity(`❌ Error syncing work items: ${error.message}`);
      }
      return;
    }

    // Classify command
    if (text === 'classify') {
      const currentSprint = state.conversation.currentSprint || 'Current Sprint';
      const workItems = stateManagement.getWorkItems(currentSprint);
      
      if (workItems.length === 0) {
        await context.sendActivity(`❌ No work items to classify. Use \`sync\` first.`);
        return;
      }
      
      await context.sendActivity(`🔍 Classifying ${workItems.length} work items...`);
      const classifications = await classificationService.classifyWorkItems(workItems);
      stateManagement.storeClassifications(currentSprint, classifications);
      
      await context.sendActivity(`✅ Classification complete! ${classifications.length} work items classified.`);
      return;
    }

    // Stats command
    if (text.startsWith('stats')) {
      const parts = text.split(' ');
      const sprintName = parts.length > 1 ? parts.slice(1).join(' ') : (state.conversation.currentSprint || 'Current Sprint');
      
      const stats = stateManagement.getSprintStats(sprintName);
      if (!stats) {
        await context.sendActivity(`❌ No data found for sprint: ${sprintName}`);
        return;
      }
      
      await context.sendActivity(`📊 **Sprint Statistics for: ${stats.sprintName}**

**Work Items:** ${stats.totalWorkItems}
**Classifications:** ${stats.totalClassifications}
**Last Sync:** ${stats.lastSyncTime.toLocaleString()}

**Priority Breakdown:**
- 🔴 Critical: ${stats.priorityBreakdown.critical}
- 🟠 High: ${stats.priorityBreakdown.high}
- 🔵 Medium: ${stats.priorityBreakdown.medium}
- 🟢 Low: ${stats.priorityBreakdown.low}`);
      return;
    }

    // Sprints command
    if (text === 'sprints') {
      const sprints = stateManagement.getAllSprints();
      if (sprints.length === 0) {
        await context.sendActivity(`No sprints tracked yet. Use \`sync\` to start tracking.`);
        return;
      }
      
      await context.sendActivity(`📋 **Tracked Sprints:**\n${sprints.map(s => `- ${s}`).join('\n')}`);
      return;
    }

    // Export command
    if (text === 'export') {
      const exported = stateManagement.exportState();
      await context.sendActivity(`💾 **State Export**\n\nState data size: ${exported.length} characters\n\n(In production, this would be saved to persistent storage)`);
      return;
    }

    // Default response
    await context.sendActivity(`I didn't understand that command. Type \`help\` to see available commands.`);
  } catch (error: any) {
    console.error('Error processing message:', error);
    await context.sendActivity(`❌ An error occurred: ${error.message}`);
  }
});

// Start the server
startServer(agentApp);
