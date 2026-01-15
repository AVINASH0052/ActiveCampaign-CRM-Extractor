/**
 * DOM Change Observer for detecting content updates
 * Uses MutationObserver to watch for new data being loaded
 */

import { MESSAGE_ACTIONS, createMessage, ExtractionFailedMessage } from '@shared/message-types';

export class DOMChangeObserver {
    private observer: MutationObserver | null = null;
    private debounceTimer: number | null = null;
    private readonly debounceDelay = 2000;
    private isWatching = false;
    private lastContentHash = '';

    initialize(): void {
        if (this.isWatching) return;

        this.observer = new MutationObserver(this.handleMutations.bind(this));
        this.startObserving();
        this.isWatching = true;

        console.log('[CRM Extractor] DOM change observer initialized');
    }

    private startObserving(): void {
        const targetNode = document.body;

        this.observer?.observe(targetNode, {
            childList: true,
            subtree: true,
            characterData: false,
            attributes: false,
        });

        // Store initial content hash
        this.lastContentHash = this.computeContentHash();
    }

    private handleMutations(mutations: MutationRecord[]): void {
        // Filter for significant changes
        const significantChange = mutations.some(mutation => {
            return this.isSignificantMutation(mutation);
        });

        if (!significantChange) return;

        // Debounce to avoid flooding
        if (this.debounceTimer) {
            window.clearTimeout(this.debounceTimer);
        }

        this.debounceTimer = window.setTimeout(() => {
            this.checkForDataChanges();
        }, this.debounceDelay);
    }

    private isSignificantMutation(mutation: MutationRecord): boolean {
        // Check if added nodes contain data elements
        for (const node of mutation.addedNodes) {
            if (node instanceof HTMLElement) {
                // Look for table rows, cards, or list items
                if (node.matches?.('tr, [class*="card"], [class*="Card"], li, [class*="row"]')) {
                    return true;
                }
                // Check children
                if (node.querySelector?.('tr, [class*="card"], [class*="Card"], li')) {
                    return true;
                }
            }
        }
        return false;
    }

    private checkForDataChanges(): void {
        const newHash = this.computeContentHash();

        if (newHash !== this.lastContentHash) {
            this.lastContentHash = newHash;
            this.notifyDataChange();
        }
    }

    private computeContentHash(): string {
        // Create a simple hash of the main content area
        const contentSelectors = [
            'table tbody',
            '[class*="pipeline"]',
            '[class*="contact-list"]',
            '[class*="task-list"]',
            'main',
        ];

        let content = '';
        for (const selector of contentSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                content += element.children.length.toString();
            }
        }

        return content;
    }

    private notifyDataChange(): void {
        // Show notification indicator
        this.showChangeIndicator();

        // Notify service worker
        const message = createMessage<ExtractionFailedMessage>({
            action: MESSAGE_ACTIONS.EXTRACTION_FAILED,
            errorMessage: 'DOM_CHANGED',
        });

        chrome.runtime.sendMessage(message).catch(() => {
            // Service worker may not be listening
        });
    }

    private showChangeIndicator(): void {
        // Check if indicator already exists
        if (document.getElementById('crm-change-indicator')) return;

        const indicator = document.createElement('div');
        indicator.id = 'crm-change-indicator';
        indicator.innerHTML = `
            <div style="
                position: fixed;
                bottom: 80px;
                right: 20px;
                background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                color: white;
                padding: 12px 16px;
                border-radius: 8px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                font-size: 13px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 999999;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
            ">
                <span style="font-size: 16px;">🔄</span>
                <span>New data detected. Click to re-extract.</span>
            </div>
        `;

        indicator.onclick = () => {
            indicator.remove();
            // Trigger extraction via message
            chrome.runtime.sendMessage({
                action: MESSAGE_ACTIONS.TRIGGER_EXTRACTION,
            });
        };

        document.body.appendChild(indicator);

        // Auto-remove after 10 seconds
        setTimeout(() => {
            indicator.remove();
        }, 10000);
    }

    stop(): void {
        this.observer?.disconnect();
        this.isWatching = false;
    }
}

export const domChangeObserver = new DOMChangeObserver();
