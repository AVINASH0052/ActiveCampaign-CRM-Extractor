/**
 * Task data harvester for extracting task records from ActiveCampaign
 * Identifies task types and linked entities
 */

import { ACTask, TaskType, LinkedEntity } from '@shared/types';
import { TASK_TYPE_MAPPING } from '@shared/constants';
import { BaseDataHarvester } from './base-extractor';

export class TaskDataHarvester extends BaseDataHarvester<ACTask> {
    protected entityName = 'task';

    async harvestRecords(): Promise<ACTask[]> {
        // Wait for page to load
        await this.pauseExecution(500);

        // Try table-based extraction first (most common)
        const tableDeals = this.extractFromTable();
        if (tableDeals.length > 0) {
            return tableDeals;
        }

        // Try generic extraction
        return this.attemptGenericTaskExtraction();
    }

    private extractFromTable(): ACTask[] {
        const harvestedTasks: ACTask[] = [];

        // Find all table rows
        const tableRows = document.querySelectorAll('table tbody tr, tr');

        for (const row of tableRows) {
            // Skip header rows
            if (row.querySelector('th')) continue;

            // Look for task title - usually a link
            const links = row.querySelectorAll('a');
            let taskTitle = '';
            let taskType: TaskType = 'todo';

            for (const link of links) {
                const text = link.textContent?.trim() ?? '';

                // Task titles often include type prefix like "Meeting: Final Review"
                if (text.includes(':')) {
                    const parts = text.split(':');
                    const possibleType = parts[0].toLowerCase().trim();

                    if (this.isTaskTypePrefix(possibleType)) {
                        taskType = this.mapToTaskType(possibleType);
                        taskTitle = parts.slice(1).join(':').trim();
                        break;
                    }
                }

                // Or it might be a plain title
                if (text.length >= 3 && text.length < 200) {
                    taskTitle = text;
                    // Try to get type from Type column
                    break;
                }
            }

            // If we found a title through links, also check for type in dedicated column
            const typeCell = row.querySelector('[class*="type"], td:nth-child(3), td:nth-child(4)');
            if (typeCell) {
                const typeText = typeCell.textContent?.toLowerCase().trim() ?? '';
                if (typeText && this.isTaskTypePrefix(typeText)) {
                    taskType = this.mapToTaskType(typeText);
                }
            }

            // Try alternative title extraction if no link found
            if (!taskTitle) {
                const cells = row.querySelectorAll('td');
                for (const cell of cells) {
                    const text = cell.textContent?.trim() ?? '';
                    // Look for task-like content in cells
                    if (text.length >= 3 && text.length < 200) {
                        // Skip if it looks like a date or status
                        if (this.looksLikeDate(text)) continue;
                        if (text.toLowerCase() === 'complete' || text.toLowerCase() === 'incomplete') continue;

                        // Check if it contains a type prefix
                        if (text.includes(':')) {
                            const parts = text.split(':');
                            const possibleType = parts[0].toLowerCase().trim();
                            if (this.isTaskTypePrefix(possibleType)) {
                                taskType = this.mapToTaskType(possibleType);
                                taskTitle = parts.slice(1).join(':').trim();
                                break;
                            }
                        }

                        // First meaningful text is likely the title
                        if (!taskTitle && this.looksLikeTitle(text)) {
                            taskTitle = text;
                        }
                    }
                }
            }

            if (taskTitle && taskTitle.length >= 2) {
                harvestedTasks.push({
                    id: this.generateStableId([taskTitle, taskType]),
                    type: taskType,
                    title: taskTitle,
                    dueDate: this.findDateInRow(row),
                    assignee: this.findAssigneeInRow(row),
                    linkedEntity: this.findLinkedEntityInRow(row, taskTitle),
                    extractedAt: Date.now(),
                    sourceUrl: window.location.href,
                });
            }
        }

        return harvestedTasks;
    }

    private isTaskTypePrefix(text: string): boolean {
        const taskPrefixes = ['meeting', 'call', 'email', 'todo', 'task', 'follow', 'reminder'];
        return taskPrefixes.some(prefix => text.includes(prefix));
    }

    private mapToTaskType(text: string): TaskType {
        const lowerText = text.toLowerCase();

        for (const [keyword, taskType] of Object.entries(TASK_TYPE_MAPPING)) {
            if (lowerText.includes(keyword)) {
                return taskType;
            }
        }

        return 'todo';
    }

    private looksLikeTitle(text: string): boolean {
        // A title should have letters, not just numbers or symbols
        return /[a-zA-Z]{2,}/.test(text);
    }

    private looksLikeDate(text: string): boolean {
        return /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(text) ||
            /\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/.test(text) ||
            /^\d+\s*(day|hour|minute|min|hr)/i.test(text);
    }

    private findDateInRow(row: Element): string {
        // Look for date patterns in the row
        const cells = row.querySelectorAll('td');
        for (const cell of cells) {
            const text = cell.textContent?.trim() ?? '';
            if (this.looksLikeDate(text)) {
                return this.normalizeDateString(text);
            }
        }

        // Look for time element
        const timeEl = row.querySelector('time');
        if (timeEl) {
            return timeEl.getAttribute('datetime') ?? timeEl.textContent?.trim() ?? '';
        }

        return '';
    }

    private normalizeDateString(rawDate: string): string {
        const trimmedDate = rawDate.trim();

        const isoMatch = trimmedDate.match(/\d{4}-\d{2}-\d{2}/);
        if (isoMatch) {
            return isoMatch[0];
        }

        try {
            const parsedDate = new Date(trimmedDate);
            if (!isNaN(parsedDate.getTime())) {
                return parsedDate.toISOString().split('T')[0];
            }
        } catch {
            // Return original if parsing fails
        }

        return trimmedDate;
    }

    private findAssigneeInRow(row: Element): string {
        // Look for assignee in cells
        const cells = row.querySelectorAll('td');
        for (const cell of cells) {
            // Assignee cells often have user avatars or icons
            if (cell.querySelector('img[alt], [class*="avatar"], [class*="user"]')) {
                const text = cell.textContent?.trim() ?? '';
                if (text.length > 1 && text.length < 100) {
                    return text;
                }
            }
        }

        return '';
    }

    private findLinkedEntityInRow(row: Element, taskTitle: string): LinkedEntity | null {
        // Look for links to contacts or deals
        const links = row.querySelectorAll('a');

        for (const link of links) {
            const href = link.getAttribute('href') ?? '';
            const text = link.textContent?.trim() ?? '';

            // Skip if it's the task title itself
            if (text === taskTitle || text.includes(taskTitle)) continue;

            // Check if it's a contact or deal link
            if (href.includes('/contact/') || href.includes('/deal/')) {
                const type = href.includes('/deal/') ? 'deal' : 'contact';
                return {
                    type,
                    id: this.extractIdFromHref(href),
                    name: text,
                };
            }
        }

        return null;
    }

    private extractIdFromHref(href: string): string {
        const match = href.match(/\/(\d+)/);
        return match ? match[1] : '';
    }

    private attemptGenericTaskExtraction(): Promise<ACTask[]> {
        const harvestedTasks: ACTask[] = [];

        // Look for any elements that look like task items
        const allElements = document.querySelectorAll('div, li, article');

        for (const element of allElements) {
            const text = element.textContent?.trim() ?? '';

            // Check if this element contains task-like content
            const lowerText = text.toLowerCase();
            if (lowerText.includes('call:') || lowerText.includes('meeting:') ||
                lowerText.includes('email:') || lowerText.includes('task:')) {

                // Extract task info
                const match = text.match(/(call|meeting|email|task):\s*(.+)/i);
                if (match) {
                    const taskType = this.mapToTaskType(match[1]);
                    const taskTitle = match[2].split('\n')[0].trim();

                    if (taskTitle.length >= 2) {
                        harvestedTasks.push({
                            id: this.generateStableId([taskTitle, taskType]),
                            type: taskType,
                            title: taskTitle,
                            dueDate: '',
                            assignee: '',
                            linkedEntity: null,
                            extractedAt: Date.now(),
                            sourceUrl: window.location.href,
                        });
                    }
                }
            }
        }

        return Promise.resolve(harvestedTasks);
    }
}
