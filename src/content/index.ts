/**
 * Content script entry point for ActiveCampaign pages
 * Orchestrates extraction and communicates with service worker
 */

import { detectCurrentView, isActiveCampaignDomain } from './detectors/view-detector';
import { ContactDataHarvester } from './extractors/contact-extractor';
import { DealDataHarvester } from './extractors/deal-extractor';
import { TaskDataHarvester } from './extractors/task-extractor';
import { extractionIndicator } from './indicators/extraction-indicator';
import { storageOrchestrator } from '@shared/storage-service';
import { paginationHandler } from './handlers/pagination-handler';
import { domChangeObserver } from './handlers/dom-change-observer';
import {
    MESSAGE_ACTIONS,
    MessageResponse,
    createMessage,
    ExtractionCompleteMessage,
    ExtractionFailedMessage
} from '@shared/message-types';
import { ViewType, ACContact, ACDeal, ACTask } from '@shared/types';

class ContentScriptOrchestrator {
    private isExtracting = false;

    initialize(): void {
        if (!isActiveCampaignDomain()) {
            return;
        }

        this.registerMessageListeners();
        extractionIndicator.initialize();
        domChangeObserver.initialize();
    }

    private registerMessageListeners(): void {
        chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
            this.handleIncomingMessage(message, sendResponse);
            return true;
        });
    }

    private handleIncomingMessage(
        message: { action: string },
        sendResponse: (response: MessageResponse) => void
    ): void {
        switch (message.action) {
            case MESSAGE_ACTIONS.TRIGGER_EXTRACTION:
                this.executeExtraction(sendResponse);
                break;

            case MESSAGE_ACTIONS.CHECK_VIEW_TYPE:
                this.respondWithViewType(sendResponse);
                break;

            case MESSAGE_ACTIONS.PING_CONTENT_SCRIPT:
                sendResponse({ success: true, payload: { alive: true } });
                break;

            case MESSAGE_ACTIONS.EXTRACTION_FAILED:
                const errorMsg = (message as any).errorMessage;
                if (errorMsg === 'DOM_CHANGED') {
                    // Just log it or show toast if needed, but observer handles UI
                    console.log('[CRM Extractor] DOM change detected');
                }
                break;

            default:
                sendResponse({ success: false, errorMessage: 'Unrecognized action' });
        }
    }

    private respondWithViewType(sendResponse: (response: MessageResponse) => void): void {
        const viewResult = detectCurrentView();
        sendResponse({
            success: true,
            payload: viewResult
        });
    }

    private async executeExtraction(
        sendResponse: (response: MessageResponse) => void
    ): Promise<void> {
        if (this.isExtracting) {
            sendResponse({
                success: false,
                errorMessage: 'Extraction already in progress'
            });
            return;
        }

        // Pause observer during extraction to avoid loops
        domChangeObserver.stop();
        this.isExtracting = true;

        const viewResult = detectCurrentView();

        if (viewResult.detectedView === 'unknown') {
            this.isExtracting = false;
            domChangeObserver.initialize(); // Restart observer
            extractionIndicator.showError('Cannot detect page type');
            sendResponse({
                success: false,
                errorMessage: 'Unable to detect ActiveCampaign view type'
            });
            return;
        }

        try {
            const extractionResult = await this.performViewSpecificExtraction(viewResult.detectedView);

            sendResponse({
                success: true,
                payload: extractionResult
            });

            this.notifyServiceWorker(extractionResult);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown extraction error';
            extractionIndicator.showError(errorMessage);
            sendResponse({
                success: false,
                errorMessage
            });

            this.notifyExtractionFailure(errorMessage);

        } finally {
            this.isExtracting = false;
            domChangeObserver.initialize(); // Restart observer
        }
    }

    private async performViewSpecificExtraction(
        viewType: ViewType
    ): Promise<{ entityType: string; count: number }> {
        switch (viewType) {
            case 'contacts':
                return this.extractContacts();

            case 'deals':
                return this.extractDeals();

            case 'tasks':
                return this.extractTasks();

            default:
                throw new Error(`Unsupported view type: ${viewType}`);
        }
    }

    private async extractContacts(): Promise<{ entityType: string; count: number }> {
        extractionIndicator.showExtracting('Contacts');

        const harvester = new ContactDataHarvester();

        // Use pagination handler to extract across pages
        const contacts: ACContact[] = await paginationHandler.extractAllPages(
            () => harvester.harvestRecords(),
            'contacts'
        );

        if (contacts.length === 0) {
            throw new Error('No contacts found on this page');
        }

        const saveResult = await storageOrchestrator.insertRecordsWithDeduplication(
            'contacts',
            contacts
        );

        if (!saveResult.success) {
            throw new Error(saveResult.errorMessage ?? 'Failed to save contacts');
        }

        extractionIndicator.showSuccess('Contacts', contacts.length);

        return { entityType: 'contacts', count: contacts.length };
    }

    private async extractDeals(): Promise<{ entityType: string; count: number }> {
        extractionIndicator.showExtracting('Deals');

        const harvester = new DealDataHarvester();

        // Use pagination handler
        const deals: ACDeal[] = await paginationHandler.extractAllPages(
            () => harvester.harvestRecords(),
            'deals'
        );

        if (deals.length === 0) {
            throw new Error('No deals found on this page');
        }

        const saveResult = await storageOrchestrator.insertRecordsWithDeduplication(
            'deals',
            deals
        );

        if (!saveResult.success) {
            throw new Error(saveResult.errorMessage ?? 'Failed to save deals');
        }

        extractionIndicator.showSuccess('Deals', deals.length);

        return { entityType: 'deals', count: deals.length };
    }

    private async extractTasks(): Promise<{ entityType: string; count: number }> {
        extractionIndicator.showExtracting('Tasks');

        const harvester = new TaskDataHarvester();

        // Use pagination handler
        const tasks: ACTask[] = await paginationHandler.extractAllPages(
            () => harvester.harvestRecords(),
            'tasks'
        );

        if (tasks.length === 0) {
            throw new Error('No tasks found on this page');
        }

        const saveResult = await storageOrchestrator.insertRecordsWithDeduplication(
            'tasks',
            tasks
        );

        if (!saveResult.success) {
            throw new Error(saveResult.errorMessage ?? 'Failed to save tasks');
        }

        extractionIndicator.showSuccess('Tasks', tasks.length);

        return { entityType: 'tasks', count: tasks.length };
    }

    private notifyServiceWorker(result: { entityType: string; count: number }): void {
        const message = createMessage<ExtractionCompleteMessage>({
            action: MESSAGE_ACTIONS.EXTRACTION_COMPLETE,
            entityType: result.entityType as 'contacts' | 'deals' | 'tasks',
            extractedCount: result.count,
        });

        chrome.runtime.sendMessage(message).catch(() => {
            // Service worker may not be listening
        });
    }

    private notifyExtractionFailure(errorMessage: string): void {
        const message = createMessage<ExtractionFailedMessage>({
            action: MESSAGE_ACTIONS.EXTRACTION_FAILED,
            errorMessage,
        });

        chrome.runtime.sendMessage(message).catch(() => {
            // Service worker may not be listening
        });
    }
}

const orchestrator = new ContentScriptOrchestrator();
console.log('[CRM Extractor] Content script loaded on:', window.location.href);
orchestrator.initialize();
console.log('[CRM Extractor] Content script initialized');
