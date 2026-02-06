// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { WorkItem, ClassificationResult, Priority, WorkItemType } from './types.js';

/**
 * Work Item Classification Service
 * Classifies, tags, and prioritizes work items using rule-based logic
 */
export class ClassificationService {
  /**
   * Classify a work item and suggest tags and priority
   */
  async classifyWorkItem(workItem: WorkItem): Promise<ClassificationResult> {
    const suggestedTags: string[] = [];
    let suggestedPriority = Priority.Medium;
    let reasoning = '';

    // Rule-based classification logic
    const title = workItem.title.toLowerCase();
    const description = (workItem.description || '').toLowerCase();
    const text = `${title} ${description}`;

    // Critical priority keywords
    if (
      text.includes('critical') ||
      text.includes('production down') ||
      text.includes('security') ||
      text.includes('data loss') ||
      workItem.type === WorkItemType.Bug && text.includes('blocker')
    ) {
      suggestedPriority = Priority.Critical;
      suggestedTags.push('Critical');
      reasoning += 'Critical priority due to severity keywords. ';
    }
    // High priority keywords
    else if (
      text.includes('urgent') ||
      text.includes('important') ||
      text.includes('customer impact') ||
      text.includes('high priority')
    ) {
      suggestedPriority = Priority.High;
      suggestedTags.push('HighPriority');
      reasoning += 'High priority due to urgency indicators. ';
    }
    // Low priority keywords
    else if (
      text.includes('nice to have') ||
      text.includes('low priority') ||
      text.includes('enhancement') ||
      text.includes('cosmetic')
    ) {
      suggestedPriority = Priority.Low;
      reasoning += 'Low priority - non-critical enhancement. ';
    }

    // Technical area classification
    if (text.includes('ui') || text.includes('frontend') || text.includes('interface')) {
      suggestedTags.push('UI');
      reasoning += 'UI component identified. ';
    }
    if (text.includes('backend') || text.includes('api') || text.includes('server')) {
      suggestedTags.push('Backend');
      reasoning += 'Backend component identified. ';
    }
    if (text.includes('database') || text.includes('sql') || text.includes('data')) {
      suggestedTags.push('Database');
      reasoning += 'Database component identified. ';
    }
    if (text.includes('performance') || text.includes('slow') || text.includes('optimization')) {
      suggestedTags.push('Performance');
      reasoning += 'Performance concern identified. ';
    }
    if (text.includes('security') || text.includes('authentication') || text.includes('authorization')) {
      suggestedTags.push('Security');
      reasoning += 'Security aspect identified. ';
    }
    if (text.includes('test') || text.includes('testing') || text.includes('qa')) {
      suggestedTags.push('Testing');
      reasoning += 'Testing related. ';
    }
    if (text.includes('documentation') || text.includes('docs') || text.includes('readme')) {
      suggestedTags.push('Documentation');
      reasoning += 'Documentation work. ';
    }

    // Work item type specific tags
    if (workItem.type === WorkItemType.Bug) {
      suggestedTags.push('Bug');
    } else if (workItem.type === WorkItemType.Feature) {
      suggestedTags.push('Feature');
    } else if (workItem.type === WorkItemType.Epic) {
      suggestedTags.push('Epic');
    }

    // State-based tags
    if (workItem.state.toLowerCase() === 'new') {
      suggestedTags.push('NeedsReview');
      reasoning += 'New work item needs review. ';
    }

    // Calculate confidence (simplified)
    const confidence = Math.min(0.95, 0.6 + (suggestedTags.length * 0.1));

    return {
      workItemId: workItem.id,
      suggestedTags,
      suggestedPriority,
      confidence,
      reasoning: reasoning.trim() || 'Standard classification applied.'
    };
  }

  /**
   * Batch classify multiple work items
   */
  async classifyWorkItems(workItems: WorkItem[]): Promise<ClassificationResult[]> {
    const results: ClassificationResult[] = [];
    
    for (const workItem of workItems) {
      const classification = await this.classifyWorkItem(workItem);
      results.push(classification);
    }

    return results;
  }
}
