/**
 * TypeScript interfaces for ActiveCampaign CRM data extraction
 * Defines storage schema and extraction result types
 */

export interface ACContact {
    id: string;
    name: string;
    email: string;
    phone: string;
    tags: string[];
    owner: string;
    extractedAt: number;
    sourceUrl: string;
}

export interface ACDeal {
    id: string;
    title: string;
    value: number;
    currency: string;
    pipeline: string;
    stage: string;
    primaryContact: string;
    owner: string;
    extractedAt: number;
    sourceUrl: string;
}

export type TaskType = 'call' | 'email' | 'meeting' | 'todo';

export interface LinkedEntity {
    type: 'contact' | 'deal';
    id: string;
    name: string;
}

export interface ACTask {
    id: string;
    type: TaskType;
    title: string;
    dueDate: string;
    assignee: string;
    linkedEntity: LinkedEntity | null;
    extractedAt: number;
    sourceUrl: string;
}

export interface ACStorageSchema {
    contacts: ACContact[];
    deals: ACDeal[];
    tasks: ACTask[];
    lastSync: number;
    syncInProgress: boolean;
}

export interface ExtractionOutcome {
    success: boolean;
    entityType: 'contacts' | 'deals' | 'tasks';
    extractedCount: number;
    errorMessage: string | null;
    timestamp: number;
}

export interface ExtractionProgress {
    currentPhase: 'idle' | 'detecting' | 'extracting' | 'saving' | 'complete' | 'failed';
    progressPercent: number;
    statusMessage: string;
}

export type ViewType = 'contacts' | 'deals' | 'tasks' | 'unknown';

export interface ViewDetectionResult {
    detectedView: ViewType;
    confidence: 'high' | 'medium' | 'low';
    urlPath: string;
}

export interface StorageOperationResult<T> {
    success: boolean;
    payload: T | null;
    errorMessage: string | null;
}

export interface DeleteConfirmation {
    entityType: 'contact' | 'deal' | 'task';
    entityId: string;
    entityName: string;
}

export interface FilterCriteria {
    searchQuery: string;
    pipeline?: string;
    stage?: string;
    taskType?: TaskType;
    sortField?: string;
    sortDirection?: 'asc' | 'desc';
}

export interface ExportConfiguration {
    format: 'csv' | 'json';
    entityTypes: ('contacts' | 'deals' | 'tasks')[];
    filename: string;
}
