// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import axios from 'axios';
import { ClassificationResult, WorkItem } from './types.js';

/**
 * Teams Notification Service
 * Sends updates to Microsoft Teams via incoming webhooks
 */
export class TeamsNotificationService {
  private webhookUrl?: string;

  constructor(webhookUrl?: string) {
    this.webhookUrl = webhookUrl;
  }

  /**
   * Send a notification to Teams about work item classifications
   */
  async sendClassificationUpdate(
    workItem: WorkItem,
    classification: ClassificationResult
  ): Promise<void> {
    if (!this.webhookUrl) {
      console.log('Teams webhook URL not configured, skipping notification');
      return;
    }

    try {
      const card = {
        '@type': 'MessageCard',
        '@context': 'https://schema.org/extensions',
        summary: `Work Item ${workItem.id} Classified`,
        themeColor: this.getPriorityColor(classification.suggestedPriority),
        title: `Work Item Intelligence Update`,
        sections: [
          {
            activityTitle: `Work Item #${workItem.id}: ${workItem.title}`,
            activitySubtitle: `Type: ${workItem.type} | State: ${workItem.state}`,
            facts: [
              {
                name: 'Suggested Priority',
                value: this.getPriorityName(classification.suggestedPriority)
              },
              {
                name: 'Suggested Tags',
                value: classification.suggestedTags.join(', ') || 'None'
              },
              {
                name: 'Confidence',
                value: `${(classification.confidence * 100).toFixed(0)}%`
              },
              {
                name: 'Reasoning',
                value: classification.reasoning
              }
            ]
          }
        ],
        potentialAction: [
          {
            '@type': 'OpenUri',
            name: 'View Work Item',
            targets: [
              {
                os: 'default',
                uri: workItem.url || '#'
              }
            ]
          }
        ]
      };

      await axios.post(this.webhookUrl, card);
      console.log(`Sent Teams notification for work item ${workItem.id}`);
    } catch (error: any) {
      console.error('Error sending Teams notification:', error.message);
    }
  }

  /**
   * Send a summary notification about multiple work items
   */
  async sendBatchSummary(
    workItems: WorkItem[],
    classifications: ClassificationResult[]
  ): Promise<void> {
    if (!this.webhookUrl) {
      console.log('Teams webhook URL not configured, skipping notification');
      return;
    }

    try {
      const criticalCount = classifications.filter(c => c.suggestedPriority === 1).length;
      const highCount = classifications.filter(c => c.suggestedPriority === 2).length;

      const card = {
        '@type': 'MessageCard',
        '@context': 'https://schema.org/extensions',
        summary: `Processed ${workItems.length} Work Items`,
        themeColor: criticalCount > 0 ? '0078D4' : '28A745',
        title: `Work Item Intelligence Summary`,
        sections: [
          {
            text: `Analyzed and classified ${workItems.length} work items`,
            facts: [
              {
                name: 'Critical Priority',
                value: criticalCount.toString()
              },
              {
                name: 'High Priority',
                value: highCount.toString()
              },
              {
                name: 'Total Processed',
                value: workItems.length.toString()
              }
            ]
          }
        ]
      };

      await axios.post(this.webhookUrl, card);
      console.log(`Sent Teams batch summary for ${workItems.length} work items`);
    } catch (error: any) {
      console.error('Error sending Teams batch summary:', error.message);
    }
  }

  private getPriorityColor(priority: number): string {
    switch (priority) {
      case 1: return 'FF0000'; // Critical - Red
      case 2: return 'FFA500'; // High - Orange
      case 3: return '0078D4'; // Medium - Blue
      case 4: return '28A745'; // Low - Green
      default: return '808080'; // Unknown - Gray
    }
  }

  private getPriorityName(priority: number): string {
    switch (priority) {
      case 1: return 'Critical';
      case 2: return 'High';
      case 3: return 'Medium';
      case 4: return 'Low';
      default: return 'Unknown';
    }
  }
}
