// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * Work Item classification types
 */
export enum WorkItemType {
  Bug = 'Bug',
  Feature = 'Feature',
  Task = 'Task',
  UserStory = 'User Story',
  Epic = 'Epic'
}

export enum Priority {
  Critical = 1,
  High = 2,
  Medium = 3,
  Low = 4
}

export interface WorkItem {
  id: number;
  title: string;
  type: WorkItemType;
  state: string;
  assignedTo?: string;
  description?: string;
  tags?: string[];
  priority?: Priority;
  sprint?: string;
  url?: string;
}

export interface ClassificationResult {
  workItemId: number;
  suggestedTags: string[];
  suggestedPriority: Priority;
  confidence: number;
  reasoning: string;
}

export interface SprintState {
  sprintName: string;
  workItems: Map<number, WorkItem>;
  lastSyncTime: Date;
  classifications: Map<number, ClassificationResult>;
}
