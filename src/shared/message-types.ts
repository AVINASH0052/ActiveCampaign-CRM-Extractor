/**
 * Message types for communication between popup, service worker, and content scripts
 * Defines the contract for chrome.runtime message passing
 */

export const MESSAGE_ACTIONS = {
    TRIGGER_EXTRACTION: 'TRIGGER_EXTRACTION',
    EXTRACTION_STARTED: 'EXTRACTION_STARTED',
    EXTRACTION_PROGRESS: 'EXTRACTION_PROGRESS',
    EXTRACTION_COMPLETE: 'EXTRACTION_COMPLETE',
    EXTRACTION_FAILED: 'EXTRACTION_FAILED',
    GET_STORAGE_DATA: 'GET_STORAGE_DATA',
    DELETE_RECORD: 'DELETE_RECORD',
    CLEAR_ALL_DATA: 'CLEAR_ALL_DATA',
    EXPORT_DATA: 'EXPORT_DATA',
    CHECK_VIEW_TYPE: 'CHECK_VIEW_TYPE',
    PING_CONTENT_SCRIPT: 'PING_CONTENT_SCRIPT',
} as const;

export type MessageAction = typeof MESSAGE_ACTIONS[keyof typeof MESSAGE_ACTIONS];

interface BaseMessage {
    action: MessageAction;
    timestamp: number;
}

export interface TriggerExtractionMessage extends BaseMessage {
    action: typeof MESSAGE_ACTIONS.TRIGGER_EXTRACTION;
    tabId: number;
}

export interface ExtractionStartedMessage extends BaseMessage {
    action: typeof MESSAGE_ACTIONS.EXTRACTION_STARTED;
    viewType: string;
}

export interface ExtractionProgressMessage extends BaseMessage {
    action: typeof MESSAGE_ACTIONS.EXTRACTION_PROGRESS;
    phase: string;
    progressPercent: number;
    statusMessage: string;
}

export interface ExtractionCompleteMessage extends BaseMessage {
    action: typeof MESSAGE_ACTIONS.EXTRACTION_COMPLETE;
    entityType: 'contacts' | 'deals' | 'tasks';
    extractedCount: number;
}

export interface ExtractionFailedMessage extends BaseMessage {
    action: typeof MESSAGE_ACTIONS.EXTRACTION_FAILED;
    errorMessage: string;
    errorCode?: string;
}

export interface GetStorageDataMessage extends BaseMessage {
    action: typeof MESSAGE_ACTIONS.GET_STORAGE_DATA;
}

export interface DeleteRecordMessage extends BaseMessage {
    action: typeof MESSAGE_ACTIONS.DELETE_RECORD;
    entityType: 'contacts' | 'deals' | 'tasks';
    recordId: string;
}

export interface ClearAllDataMessage extends BaseMessage {
    action: typeof MESSAGE_ACTIONS.CLEAR_ALL_DATA;
}

export interface ExportDataMessage extends BaseMessage {
    action: typeof MESSAGE_ACTIONS.EXPORT_DATA;
    format: 'csv' | 'json';
    entityTypes: ('contacts' | 'deals' | 'tasks')[];
}

export interface CheckViewTypeMessage extends BaseMessage {
    action: typeof MESSAGE_ACTIONS.CHECK_VIEW_TYPE;
}

export interface PingContentScriptMessage extends BaseMessage {
    action: typeof MESSAGE_ACTIONS.PING_CONTENT_SCRIPT;
}

export type ExtensionMessage =
    | TriggerExtractionMessage
    | ExtractionStartedMessage
    | ExtractionProgressMessage
    | ExtractionCompleteMessage
    | ExtractionFailedMessage
    | GetStorageDataMessage
    | DeleteRecordMessage
    | ClearAllDataMessage
    | ExportDataMessage
    | CheckViewTypeMessage
    | PingContentScriptMessage;

export interface MessageResponse<T = unknown> {
    success: boolean;
    payload?: T;
    errorMessage?: string;
}

export function createMessage<T extends ExtensionMessage>(
    messageData: Omit<T, 'timestamp'>
): T {
    return {
        ...messageData,
        timestamp: Date.now(),
    } as T;
}
