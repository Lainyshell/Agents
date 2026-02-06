// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import axios, { AxiosInstance } from 'axios';
import { WorkItem, WorkItemType } from './types.js';

/**
 * Azure DevOps Service for reading work items
 */
export class AzureDevOpsService {
  private client: AxiosInstance;
  private organization: string;
  private project: string;

  constructor(
    organization: string,
    project: string,
    personalAccessToken: string
  ) {
    this.organization = organization;
    this.project = project;

    // Create authenticated Azure DevOps client
    this.client = axios.create({
      baseURL: `https://dev.azure.com/${organization}/${project}/_apis`,
      headers: {
        'Authorization': `Basic ${Buffer.from(`:${personalAccessToken}`).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Get work items from Azure DevOps
   */
  async getWorkItems(sprint?: string): Promise<WorkItem[]> {
    try {
      // Build WIQL query
      let query = `SELECT [System.Id], [System.Title], [System.WorkItemType], [System.State], [System.AssignedTo], [System.Description], [System.Tags] FROM WorkItems`;
      
      if (sprint) {
        query += ` WHERE [System.IterationPath] = '${sprint}'`;
      }
      
      query += ` ORDER BY [System.ChangedDate] DESC`;

      // Execute query
      const queryResponse = await this.client.post('/wit/wiql?api-version=7.1', {
        query
      });

      const workItemIds = queryResponse.data.workItems.map((wi: any) => wi.id);
      
      if (workItemIds.length === 0) {
        return [];
      }

      // Get detailed work item information
      const workItemsResponse = await this.client.get(
        `/wit/workitems?ids=${workItemIds.join(',')}&api-version=7.1`
      );

      // Transform to our WorkItem type
      return workItemsResponse.data.value.map((wi: any) => ({
        id: wi.id,
        title: wi.fields['System.Title'],
        type: wi.fields['System.WorkItemType'] as WorkItemType,
        state: wi.fields['System.State'],
        assignedTo: wi.fields['System.AssignedTo']?.displayName,
        description: wi.fields['System.Description'],
        tags: wi.fields['System.Tags']?.split(';').map((t: string) => t.trim()).filter((t: string) => t) || [],
        sprint: wi.fields['System.IterationPath'],
        url: `https://dev.azure.com/${this.organization}/${this.project}/_workitems/edit/${wi.id}`
      }));
    } catch (error: any) {
      console.error('Error fetching work items from Azure DevOps:', error.message);
      throw new Error(`Failed to fetch work items: ${error.message}`);
    }
  }

  /**
   * Update work item with tags and priority
   */
  async updateWorkItem(
    workItemId: number,
    tags?: string[],
    priority?: number
  ): Promise<void> {
    try {
      const updates: any[] = [];

      if (tags && tags.length > 0) {
        updates.push({
          op: 'add',
          path: '/fields/System.Tags',
          value: tags.join('; ')
        });
      }

      if (priority) {
        updates.push({
          op: 'add',
          path: '/fields/Microsoft.VSTS.Common.Priority',
          value: priority
        });
      }

      if (updates.length > 0) {
        await this.client.patch(
          `/wit/workitems/${workItemId}?api-version=7.1`,
          updates,
          {
            headers: {
              'Content-Type': 'application/json-patch+json'
            }
          }
        );
        console.log(`Updated work item ${workItemId} successfully`);
      }
    } catch (error: any) {
      console.error(`Error updating work item ${workItemId}:`, error.message);
      throw new Error(`Failed to update work item: ${error.message}`);
    }
  }
}
