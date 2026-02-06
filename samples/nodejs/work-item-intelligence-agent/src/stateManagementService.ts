// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { SprintState, WorkItem, ClassificationResult } from './types.js';

/**
 * State Management Service
 * Maintains state across sprints with in-memory storage
 */
export class StateManagementService {
  private sprints: Map<string, SprintState> = new Map();

  /**
   * Initialize or get a sprint state
   */
  getOrCreateSprintState(sprintName: string): SprintState {
    if (!this.sprints.has(sprintName)) {
      const state: SprintState = {
        sprintName,
        workItems: new Map(),
        lastSyncTime: new Date(),
        classifications: new Map()
      };
      this.sprints.set(sprintName, state);
      console.log(`Created new sprint state: ${sprintName}`);
    }
    return this.sprints.get(sprintName)!;
  }

  /**
   * Update work items for a sprint
   */
  updateWorkItems(sprintName: string, workItems: WorkItem[]): void {
    const state = this.getOrCreateSprintState(sprintName);
    
    workItems.forEach(wi => {
      state.workItems.set(wi.id, wi);
    });
    
    state.lastSyncTime = new Date();
    console.log(`Updated ${workItems.length} work items for sprint: ${sprintName}`);
  }

  /**
   * Store classification results
   */
  storeClassifications(
    sprintName: string,
    classifications: ClassificationResult[]
  ): void {
    const state = this.getOrCreateSprintState(sprintName);
    
    classifications.forEach(classification => {
      state.classifications.set(classification.workItemId, classification);
    });
    
    console.log(`Stored ${classifications.length} classifications for sprint: ${sprintName}`);
  }

  /**
   * Get work items for a sprint
   */
  getWorkItems(sprintName: string): WorkItem[] {
    const state = this.sprints.get(sprintName);
    if (!state) {
      return [];
    }
    return Array.from(state.workItems.values());
  }

  /**
   * Get classifications for a sprint
   */
  getClassifications(sprintName: string): ClassificationResult[] {
    const state = this.sprints.get(sprintName);
    if (!state) {
      return [];
    }
    return Array.from(state.classifications.values());
  }

  /**
   * Get all sprint names
   */
  getAllSprints(): string[] {
    return Array.from(this.sprints.keys());
  }

  /**
   * Get statistics for a sprint
   */
  getSprintStats(sprintName: string): any {
    const state = this.sprints.get(sprintName);
    if (!state) {
      return null;
    }

    const classifications = Array.from(state.classifications.values());
    
    return {
      sprintName,
      totalWorkItems: state.workItems.size,
      totalClassifications: state.classifications.size,
      lastSyncTime: state.lastSyncTime,
      priorityBreakdown: {
        critical: classifications.filter(c => c.suggestedPriority === 1).length,
        high: classifications.filter(c => c.suggestedPriority === 2).length,
        medium: classifications.filter(c => c.suggestedPriority === 3).length,
        low: classifications.filter(c => c.suggestedPriority === 4).length
      }
    };
  }

  /**
   * Export state for persistence (could be saved to database)
   */
  exportState(): string {
    const data = {
      sprints: Array.from(this.sprints.entries()).map(([name, state]) => ({
        name,
        workItems: Array.from(state.workItems.entries()),
        classifications: Array.from(state.classifications.entries()),
        lastSyncTime: state.lastSyncTime
      }))
    };
    return JSON.stringify(data);
  }

  /**
   * Import state from persistence
   */
  importState(json: string): void {
    try {
      const data = JSON.parse(json);
      this.sprints.clear();
      
      data.sprints.forEach((sprint: any) => {
        const state: SprintState = {
          sprintName: sprint.name,
          workItems: new Map(sprint.workItems),
          classifications: new Map(sprint.classifications),
          lastSyncTime: new Date(sprint.lastSyncTime)
        };
        this.sprints.set(sprint.name, state);
      });
      
      console.log(`Imported state for ${this.sprints.size} sprints`);
    } catch (error: any) {
      console.error('Error importing state:', error.message);
      throw error;
    }
  }
}
