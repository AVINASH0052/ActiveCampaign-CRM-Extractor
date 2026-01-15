/**
 * Deal data harvester for extracting deal records from ActiveCampaign
 * Handles pipeline board (Kanban) view and list view
 */

import { ACDeal } from '@shared/types';
import { BaseDataHarvester } from './base-extractor';

export class DealDataHarvester extends BaseDataHarvester<ACDeal> {
    protected entityName = 'deal';

    async harvestRecords(): Promise<ACDeal[]> {
        // Wait for page to fully load
        await this.pauseExecution(500);

        // Try Kanban board extraction first
        const kanbanDeals = this.extractFromKanbanBoard();
        if (kanbanDeals.length > 0) {
            return kanbanDeals;
        }

        // Fall back to list/table extraction
        return this.extractFromListView();
    }

    private extractFromKanbanBoard(): ACDeal[] {
        const harvestedDeals: ACDeal[] = [];

        // Find columns by looking for containers with headers like "To Contact"
        const allDivs = document.querySelectorAll('div');
        const stageColumns: Element[] = [];

        for (const div of allDivs) {
            // Check if this div has a header text that looks like a stage name
            const possibleHeader = div.querySelector('div, span, h3, h4');
            const headerText = possibleHeader?.textContent?.trim() ?? '';

            // Stage headers typically have deal count pattern like "3 deals"
            if (headerText.includes('deal') ||
                headerText.match(/\$[\d,]+/) ||
                div.className.toLowerCase().includes('stage') ||
                div.className.toLowerCase().includes('column')) {

                // Check if this contains deal-like cards
                const cards = div.querySelectorAll('a, [class*="card"], [class*="Card"]');
                if (cards.length > 0) {
                    stageColumns.push(div);
                }
            }
        }

        // Extract pipeline name from page header
        const pipelineName = this.extractPipelineName();

        // Find all deal cards across the page
        const dealCardSelectors = [
            'a[href*="/deals/"]',  // Links to deal detail pages
            '[class*="deal-card"]',
            '[class*="DealCard"]',
            '[class*="pipeline-card"]',
            '[data-deal-id]',
        ];

        let dealCards: Element[] = [];
        for (const selector of dealCardSelectors) {
            const found = document.querySelectorAll(selector);
            if (found.length > 0) {
                dealCards = Array.from(found);
                break;
            }
        }

        // If no cards found with specific selectors, look for pattern-matched elements
        if (dealCards.length === 0) {
            dealCards = this.findDealCardsByPattern();
        }

        for (const card of dealCards) {
            const deal = this.extractDealFromCard(card, pipelineName);
            if (deal && deal.title.length > 0) {
                harvestedDeals.push(deal);
            }
        }

        return harvestedDeals;
    }

    private findDealCardsByPattern(): Element[] {
        const potentialCards: Element[] = [];

        // Look for elements that contain: a name link + a value like $15k
        const allLinks = document.querySelectorAll('a');

        for (const link of allLinks) {
            const href = link.getAttribute('href') ?? '';
            const text = link.textContent?.trim() ?? '';

            // Skip navigation/menu links
            if (href.startsWith('#') || href === '/' || text.length < 2) continue;

            // Find parent container that might be a card
            const parent = link.closest('div');
            if (!parent) continue;

            // Check if parent or nearby elements have currency/value patterns
            const parentText = parent.textContent ?? '';
            if (parentText.match(/\$[\d,]+[kKmM]?/) ||
                parentText.match(/[\d,]+\s*USD/) ||
                parentText.match(/\$\d+/)) {

                // This looks like a deal card
                if (!potentialCards.includes(parent)) {
                    potentialCards.push(parent);
                }
            }
        }

        return potentialCards;
    }

    private extractDealFromCard(cardElement: Element, pipelineName: string): ACDeal | null {
        // Extract deal title - usually a link
        const titleLink = cardElement.querySelector('a');
        const dealTitle = titleLink?.textContent?.trim() ?? '';

        if (!dealTitle || dealTitle.length < 2) {
            // Try getting title from card text
            const textNodes = cardElement.querySelectorAll('div, span');
            for (const node of textNodes) {
                const text = node.textContent?.trim() ?? '';
                if (text.length >= 2 && text.length < 100 && !text.includes('$')) {
                    if (!text.match(/^\d/) && !text.includes('deal') && !text.includes('task')) {
                        return this.buildDeal(text, cardElement, pipelineName);
                    }
                }
            }
            return null;
        }

        return this.buildDeal(dealTitle, cardElement, pipelineName);
    }

    private buildDeal(title: string, cardElement: Element, pipelineName: string): ACDeal {
        // Extract value from card - look for currency patterns
        const cardText = cardElement.textContent ?? '';
        const valueMatch = cardText.match(/\$[\d,]+(?:\.\d{2})?[kKmM]?/);
        let dealValue = 0;
        let valueStr = '$0';

        if (valueMatch) {
            valueStr = valueMatch[0];
            dealValue = this.parseValueWithSuffix(valueStr);
        }

        // Find stage by looking at parent column header
        const stageName = this.findParentStageName(cardElement);

        // Find contact name - often appears as a linked name
        const contactName = this.findContactInCard(cardElement, title);

        return {
            id: this.generateStableId([title, pipelineName, stageName]),
            title: title,
            value: dealValue,
            currency: 'USD',
            pipeline: pipelineName,
            stage: stageName,
            primaryContact: contactName,
            owner: '',
            extractedAt: Date.now(),
            sourceUrl: window.location.href,
        };
    }

    private parseValueWithSuffix(valueStr: string): number {
        // Remove $ and commas
        let numStr = valueStr.replace(/[$,]/g, '');
        let multiplier = 1;

        if (numStr.toLowerCase().endsWith('k')) {
            multiplier = 1000;
            numStr = numStr.slice(0, -1);
        } else if (numStr.toLowerCase().endsWith('m')) {
            multiplier = 1000000;
            numStr = numStr.slice(0, -1);
        }

        const value = parseFloat(numStr);
        return isNaN(value) ? 0 : value * multiplier;
    }

    private findParentStageName(element: Element): string {
        // Walk up the DOM to find a stage column header
        let current: Element | null = element;

        while (current && current !== document.body) {
            // Look for siblings or parent headers
            const parentEl: Element | null = current.parentElement;
            if (!parentEl) break;

            // Check for header-like elements at this level
            const headers = parentEl.querySelectorAll('div > div:first-child, h3, h4, span');
            for (const header of headers) {
                const text = header.textContent?.trim() ?? '';
                // Stage names often have deal counts like "3 deals" or values
                if (text.includes('deal') && text.match(/^\d+ deal/)) {
                    // This is a count, look at previous sibling or parent for actual name
                    const siblingOrParent = header.previousElementSibling || header.parentElement;
                    const stageName = this.extractCleanStageName(siblingOrParent);
                    if (stageName) return stageName;
                }

                // Common stage names
                const stagePatterns = ['To Contact', 'In Contact', 'Follow Up', 'Closed', 'Won', 'Lost', 'Proposal', 'Negotiation', 'Qualification'];
                for (const pattern of stagePatterns) {
                    if (text.includes(pattern)) {
                        return pattern;
                    }
                }
            }

            current = parentEl;
        }

        return 'Unknown Stage';
    }

    private extractCleanStageName(element: Element | null): string {
        if (!element) return '';
        const text = element.textContent?.trim() ?? '';

        // Remove deal count and $ value patterns
        const cleaned = text
            .replace(/\d+ deals?/gi, '')
            .replace(/\$[\d,]+[kKmM]?\s*(USD)?/gi, '')
            .trim();

        return cleaned.length > 1 && cleaned.length < 50 ? cleaned : '';
    }

    private findContactInCard(cardElement: Element, dealTitle: string): string {
        // Look for links that aren't the deal title
        const links = cardElement.querySelectorAll('a');
        for (const link of links) {
            const text = link.textContent?.trim() ?? '';
            if (text !== dealTitle && text.length >= 2 && text.length < 100) {
                // Likely a contact name
                if (!text.includes('$') && !text.match(/^\d/)) {
                    return text;
                }
            }
        }

        return '';
    }

    private extractPipelineName(): string {
        // Look for pipeline selector/dropdown or page title
        const selectors = [
            '[class*="pipeline-selector"]',
            '[class*="PipelineSelector"]',
            'h1',
            '.page-title',
            'button[class*="pipeline"]',
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                const text = element.textContent?.trim() ?? '';
                // Clean up - remove dropdown arrows etc
                const cleaned = text.replace(/[\u25BC\u25B6\u2193\u2191]/g, '').trim();
                if (cleaned.length > 0 && cleaned.length < 100) {
                    // Extract just the pipeline name if format is "Deals / Pipeline Name"
                    const parts = cleaned.split('/');
                    if (parts.length > 1) {
                        return parts[1].trim().split('(')[0].trim();
                    }
                    return cleaned.split('(')[0].trim();
                }
            }
        }

        return 'Sales Pipeline';
    }

    private extractFromListView(): Promise<ACDeal[]> {
        const tableRows = document.querySelectorAll('table tbody tr, .deals-list-item');
        const harvestedDeals: ACDeal[] = [];

        for (const row of tableRows) {
            const link = row.querySelector('a');
            const dealTitle = link?.textContent?.trim() ?? '';

            if (dealTitle.length >= 2) {
                const rowText = row.textContent ?? '';
                const valueMatch = rowText.match(/\$[\d,]+(?:\.\d{2})?[kKmM]?/);

                harvestedDeals.push({
                    id: this.generateStableId([dealTitle]),
                    title: dealTitle,
                    value: valueMatch ? this.parseValueWithSuffix(valueMatch[0]) : 0,
                    currency: 'USD',
                    pipeline: this.extractPipelineName(),
                    stage: 'Unknown Stage',
                    primaryContact: this.findContactInCard(row, dealTitle),
                    owner: '',
                    extractedAt: Date.now(),
                    sourceUrl: window.location.href,
                });
            }
        }

        return Promise.resolve(harvestedDeals);
    }
}
