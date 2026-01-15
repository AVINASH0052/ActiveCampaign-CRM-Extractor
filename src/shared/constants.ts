/**
 * Application constants and configuration values
 * Centralized configuration for the extension
 */

export const STORAGE_KEYS = {
    CRM_DATA: 'crm_extracted_data',
    SYNC_LOCK: 'sync_lock_timestamp',
    USER_PREFERENCES: 'user_preferences',
} as const;

export const EXTRACTION_CONFIG = {
    ELEMENT_WAIT_TIMEOUT_MS: 5000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY_MS: 1000,
    PAGINATION_DELAY_MS: 500,
    MUTATION_DEBOUNCE_MS: 300,
} as const;

export const UI_CONFIG = {
    POPUP_WIDTH: 420,
    POPUP_HEIGHT: 540,
    INDICATOR_AUTO_HIDE_MS: 3000,
    SEARCH_DEBOUNCE_MS: 250,
    TOAST_DURATION_MS: 4000,
} as const;

export const ACTIVE_CAMPAIGN_PATHS = {
    CONTACTS: '/app/contacts',
    DEALS: '/app/deals',
    TASKS: '/app/tasks',
    PIPELINE: '/app/deals/pipeline',
} as const;

export const SELECTOR_CHAINS = {
    contacts: {
        container: [
            '[data-testid="contacts-list"]',
            '.contacts-list-container',
            '#contacts-list-view',
            '[class*="ContactsList"]',
        ],
        row: [
            '[data-testid="contact-row"]',
            '.contact-list-item',
            'tr[data-contact-id]',
            '[class*="ContactRow"]',
        ],
        name: [
            '[data-testid="contact-name"]',
            '.contact-name-cell a',
            'td.name-column a',
            '[class*="contactName"]',
        ],
        email: [
            '[data-testid="contact-email"]',
            '.contact-email-cell',
            'a[href^="mailto:"]',
            '[class*="emailField"]',
        ],
        phone: [
            '[data-testid="contact-phone"]',
            '.contact-phone-cell',
            'a[href^="tel:"]',
            '[class*="phoneField"]',
        ],
        tags: [
            '[data-testid="contact-tags"] .tag',
            '.contact-tags .tag-badge',
            '.tag-pill',
            '[class*="tagChip"]',
        ],
        owner: [
            '[data-testid="contact-owner"]',
            '.contact-owner-cell',
            '.assigned-user',
            '[class*="ownerName"]',
        ],
    },
    deals: {
        container: [
            '[data-testid="deals-board"]',
            '.pipeline-board',
            '#deals-pipeline-view',
            '[class*="PipelineBoard"]',
        ],
        card: [
            '[data-testid="deal-card"]',
            '.deal-card',
            '.pipeline-card',
            '[class*="DealCard"]',
        ],
        title: [
            '[data-testid="deal-title"]',
            '.deal-title',
            '.deal-name',
            '[class*="dealTitle"]',
        ],
        value: [
            '[data-testid="deal-value"]',
            '.deal-value',
            '.deal-amount',
            '[class*="dealValue"]',
        ],
        stage: [
            '[data-testid="deal-stage"]',
            '.deal-stage-name',
            '.stage-column-header',
            '[class*="stageName"]',
        ],
        pipeline: [
            '[data-testid="pipeline-name"]',
            '.pipeline-header-title',
            'h1.pipeline-name',
            '[class*="pipelineName"]',
        ],
        contact: [
            '[data-testid="deal-contact"]',
            '.deal-primary-contact',
            '.linked-contact a',
            '[class*="primaryContact"]',
        ],
        owner: [
            '[data-testid="deal-owner"]',
            '.deal-owner-name',
            '.deal-assigned-user',
            '[class*="dealOwner"]',
        ],
    },
    tasks: {
        container: [
            '[data-testid="tasks-list"]',
            '.tasks-list-container',
            '#tasks-view',
            '[class*="TasksList"]',
        ],
        item: [
            '[data-testid="task-item"]',
            '.task-list-item',
            '.task-row',
            '[class*="TaskItem"]',
        ],
        title: [
            '[data-testid="task-title"]',
            '.task-title',
            '.task-subject',
            '[class*="taskTitle"]',
        ],
        type: [
            '[data-testid="task-type"]',
            '.task-type-icon',
            '.task-category',
            '[class*="taskType"]',
        ],
        dueDate: [
            '[data-testid="task-due-date"]',
            '.task-due-date',
            '.due-date-value',
            '[class*="dueDate"]',
        ],
        assignee: [
            '[data-testid="task-assignee"]',
            '.task-assignee',
            '.assigned-to',
            '[class*="taskAssignee"]',
        ],
        linkedEntity: [
            '[data-testid="task-linked"]',
            '.task-linked-entity',
            '.related-to a',
            '[class*="linkedRecord"]',
        ],
    },
    pagination: {
        nextButton: [
            '[data-testid="next-page"]',
            '.pagination-next',
            'button[aria-label="Next page"]',
            '[class*="nextPage"]',
        ],
        pageIndicator: [
            '[data-testid="page-indicator"]',
            '.pagination-info',
            '.page-count',
            '[class*="pageIndicator"]',
        ],
    },
} as const;

export const TASK_TYPE_MAPPING: Record<string, 'call' | 'email' | 'meeting' | 'todo'> = {
    call: 'call',
    phone: 'call',
    email: 'email',
    message: 'email',
    meeting: 'meeting',
    calendar: 'meeting',
    event: 'meeting',
    task: 'todo',
    todo: 'todo',
    reminder: 'todo',
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
    USD: '$',
    EUR: '\u20AC',
    GBP: '\u00A3',
    INR: '\u20B9',
    AUD: 'A$',
    CAD: 'C$',
};

export const DEFAULT_STORAGE_STATE: {
    contacts: never[];
    deals: never[];
    tasks: never[];
    lastSync: number;
    syncInProgress: boolean;
} = {
    contacts: [],
    deals: [],
    tasks: [],
    lastSync: 0,
    syncInProgress: false,
};
