/**
 * Service worker for Chrome Extension background operations
 * Handles message routing and cross-tab coordination
 */

import {
    MESSAGE_ACTIONS,
    ExtensionMessage,
    MessageResponse
} from '@shared/message-types';
import { storageOrchestrator } from '@shared/storage-service';
import { STORAGE_KEYS } from '@shared/constants';

class BackgroundServiceOrchestrator {
    initialize(): void {
        this.registerMessageHandler();
        this.registerStorageListener();
        this.registerInstallHandler();
    }

    private registerInstallHandler(): void {
        chrome.runtime.onInstalled.addListener((details) => {
            if (details.reason === 'install') {
                this.initializeDefaultStorage();
            }
        });
    }

    private async initializeDefaultStorage(): Promise<void> {
        await storageOrchestrator.clearAllRecords();
    }

    private registerMessageHandler(): void {
        chrome.runtime.onMessage.addListener(
            (message: ExtensionMessage, sender, sendResponse) => {
                this.routeMessage(message, sender, sendResponse);
                return true;
            }
        );
    }

    private routeMessage(
        message: ExtensionMessage,
        sender: chrome.runtime.MessageSender,
        sendResponse: (response: MessageResponse) => void
    ): void {
        switch (message.action) {
            case MESSAGE_ACTIONS.TRIGGER_EXTRACTION:
                this.forwardToActiveTab(sendResponse);
                break;

            case MESSAGE_ACTIONS.GET_STORAGE_DATA:
                this.handleGetStorageData(sendResponse);
                break;

            case MESSAGE_ACTIONS.DELETE_RECORD:
                this.handleDeleteRecord(message, sendResponse);
                break;

            case MESSAGE_ACTIONS.CLEAR_ALL_DATA:
                this.handleClearAllData(sendResponse);
                break;

            case MESSAGE_ACTIONS.EXTRACTION_COMPLETE:
                this.handleExtractionComplete(message, sender);
                sendResponse({ success: true });
                break;

            case MESSAGE_ACTIONS.EXTRACTION_FAILED:
                this.handleExtractionFailed(message);
                sendResponse({ success: true });
                break;

            default:
                sendResponse({ success: false, errorMessage: 'Unknown action' });
        }
    }

    private async forwardToActiveTab(
        sendResponse: (response: MessageResponse) => void
    ): Promise<void> {
        try {
            const [activeTab] = await chrome.tabs.query({
                active: true,
                currentWindow: true
            });

            if (!activeTab?.id) {
                sendResponse({
                    success: false,
                    errorMessage: 'No active tab found'
                });
                return;
            }

            if (!this.isActiveCampaignUrl(activeTab.url)) {
                sendResponse({
                    success: false,
                    errorMessage: 'Navigate to ActiveCampaign to extract data'
                });
                return;
            }

            const response = await chrome.tabs.sendMessage(activeTab.id, {
                action: MESSAGE_ACTIONS.TRIGGER_EXTRACTION,
                tabId: activeTab.id,
                timestamp: Date.now(),
            });

            sendResponse(response as MessageResponse);

        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Failed to communicate with page';
            sendResponse({
                success: false,
                errorMessage: errorMsg.includes('Could not establish connection')
                    ? 'Please refresh the ActiveCampaign page and try again'
                    : errorMsg
            });
        }
    }

    private isActiveCampaignUrl(url: string | undefined): boolean {
        if (!url) return false;
        return url.includes('activecampaign.com') || url.includes('activehosted.com');
    }

    private async handleGetStorageData(
        sendResponse: (response: MessageResponse) => void
    ): Promise<void> {
        const result = await storageOrchestrator.retrieveAllData();
        sendResponse({
            success: result.success,
            payload: result.payload,
            errorMessage: result.errorMessage ?? undefined,
        });
    }

    private async handleDeleteRecord(
        message: ExtensionMessage & { entityType?: string; recordId?: string },
        sendResponse: (response: MessageResponse) => void
    ): Promise<void> {
        if (!message.entityType || !message.recordId) {
            sendResponse({
                success: false,
                errorMessage: 'Missing entity type or record ID'
            });
            return;
        }

        const result = await storageOrchestrator.removeRecord(
            message.entityType as 'contacts' | 'deals' | 'tasks',
            message.recordId
        );

        sendResponse({
            success: result.success,
            errorMessage: result.errorMessage ?? undefined,
        });

        if (result.success) {
            this.broadcastStorageUpdate();
        }
    }

    private async handleClearAllData(
        sendResponse: (response: MessageResponse) => void
    ): Promise<void> {
        const result = await storageOrchestrator.clearAllRecords();
        sendResponse({
            success: result.success,
            errorMessage: result.errorMessage ?? undefined,
        });

        if (result.success) {
            this.broadcastStorageUpdate();
        }
    }

    private handleExtractionComplete(
        message: ExtensionMessage & { entityType?: string; extractedCount?: number },
        _sender: chrome.runtime.MessageSender
    ): void {
        const count = message.extractedCount ?? 0;

        this.updateBadge(count.toString(), '#16a34a');

        setTimeout(() => {
            this.clearBadge();
        }, 3000);

        this.broadcastStorageUpdate();
    }

    private handleExtractionFailed(
        _message: ExtensionMessage & { errorMessage?: string }
    ): void {
        this.updateBadge('!', '#dc2626');

        setTimeout(() => {
            this.clearBadge();
        }, 3000);
    }

    private updateBadge(text: string, backgroundColor: string): void {
        chrome.action.setBadgeText({ text });
        chrome.action.setBadgeBackgroundColor({ color: backgroundColor });
    }

    private clearBadge(): void {
        chrome.action.setBadgeText({ text: '' });
    }

    private registerStorageListener(): void {
        chrome.storage.onChanged.addListener((changes, namespace) => {
            if (namespace === 'local' && changes[STORAGE_KEYS.CRM_DATA]) {
                this.broadcastStorageUpdate();
            }
        });
    }

    private broadcastStorageUpdate(): void {
        chrome.runtime.sendMessage({
            action: 'STORAGE_UPDATED',
            timestamp: Date.now(),
        }).catch(() => {
            // Popup may not be open
        });
    }
}

const serviceOrchestrator = new BackgroundServiceOrchestrator();
serviceOrchestrator.initialize();
