// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import axios from 'axios';
import { ClassificationResult, WorkItem } from './types.js';

/**
 * Copilot Studio Notification Service
 * Sends notifications to Copilot Studio agents via HTTP API
 */
export class CopilotStudioNotificationService {
  private endpoint?: string;
  private apiKey?: string;

  constructor(endpoint?: string, apiKey?: string) {
    this.endpoint = endpoint;
    this.apiKey = apiKey;
  }

  /**
   * Notify Copilot Studio about a classified work item
   */
  async notifyWorkItemClassification(
    workItem: WorkItem,
    classification: ClassificationResult
  ): Promise<void> {
    if (!this.endpoint || !this.apiKey) {
      console.log('Copilot Studio endpoint not configured, skipping notification');
      return;
    }

    try {
      const payload = {
        type: 'work_item_classified',
        timestamp: new Date().toISOString(),
        data: {
          workItem: {
            id: workItem.id,
            title: workItem.title,
            type: workItem.type,
            state: workItem.state,
            assignedTo: workItem.assignedTo,
            sprint: workItem.sprint,
            url: workItem.url
          },
          classification: {
            suggestedTags: classification.suggestedTags,
            suggestedPriority: classification.suggestedPriority,
            confidence: classification.confidence,
            reasoning: classification.reasoning
          }
        }
      };

      await axios.post(this.endpoint, payload, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`Notified Copilot Studio about work item ${workItem.id}`);
    } catch (error: any) {
      console.error('Error notifying Copilot Studio:', error.message);
    }
  }

  /**
   * Notify Copilot Studio about batch processing results
   */
  async notifyBatchProcessing(
    workItems: WorkItem[],
    classifications: ClassificationResult[]
  ): Promise<void> {
    if (!this.endpoint || !this.apiKey) {
      console.log('Copilot Studio endpoint not configured, skipping notification');
      return;
    }

    try {
      const payload = {
        type: 'batch_classification_complete',
        timestamp: new Date().toISOString(),
        data: {
          totalProcessed: workItems.length,
          summary: {
            critical: classifications.filter(c => c.suggestedPriority === 1).length,
            high: classifications.filter(c => c.suggestedPriority === 2).length,
            medium: classifications.filter(c => c.suggestedPriority === 3).length,
            low: classifications.filter(c => c.suggestedPriority === 4).length
          },
          workItems: workItems.map((wi, idx) => ({
            id: wi.id,
            title: wi.title,
            classification: classifications[idx]
          }))
        }
      };

      await axios.post(this.endpoint, payload, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`Notified Copilot Studio about batch of ${workItems.length} work items`);
    } catch (error: any) {
      console.error('Error notifying Copilot Studio about batch:', error.message);
    }
  }
}
