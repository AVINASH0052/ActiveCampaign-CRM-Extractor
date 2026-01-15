/**
 * Base extractor class providing common DOM extraction utilities
 * Abstract foundation for entity-specific extractors
 */

import { EXTRACTION_CONFIG } from '@shared/constants';

export abstract class BaseDataHarvester<T> {
    protected abstract entityName: string;

    protected async waitForElement(
        selectors: readonly string[],
        timeoutMs: number = EXTRACTION_CONFIG.ELEMENT_WAIT_TIMEOUT_MS
    ): Promise<Element | null> {
        const startTime = Date.now();

        while (Date.now() - startTime < timeoutMs) {
            for (const selector of selectors) {
                try {
                    const element = document.querySelector(selector);
                    if (element) {
                        return element;
                    }
                } catch {
                    continue;
                }
            }
            await this.pauseExecution(100);
        }

        return null;
    }

    protected findAllMatchingElements(selectors: readonly string[]): Element[] {
        for (const selector of selectors) {
            try {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                    return Array.from(elements);
                }
            } catch {
                continue;
            }
        }
        return [];
    }

    protected extractTextContent(
        parentElement: Element,
        selectors: readonly string[]
    ): string {
        for (const selector of selectors) {
            try {
                const childElement = parentElement.querySelector(selector);
                if (childElement) {
                    const textContent = childElement.textContent?.trim() ?? '';
                    if (textContent.length > 0) {
                        return textContent;
                    }
                }
            } catch {
                continue;
            }
        }
        return '';
    }

    protected extractAttributeValue(
        parentElement: Element,
        selectors: readonly string[],
        attributeName: string
    ): string {
        for (const selector of selectors) {
            try {
                const childElement = parentElement.querySelector(selector);
                if (childElement) {
                    const attrValue = childElement.getAttribute(attributeName) ?? '';
                    if (attrValue.length > 0) {
                        return attrValue;
                    }
                }
            } catch {
                continue;
            }
        }
        return '';
    }

    protected extractMultipleTextContents(
        parentElement: Element,
        selectors: readonly string[]
    ): string[] {
        for (const selector of selectors) {
            try {
                const elements = parentElement.querySelectorAll(selector);
                if (elements.length > 0) {
                    return Array.from(elements)
                        .map(el => el.textContent?.trim() ?? '')
                        .filter(text => text.length > 0);
                }
            } catch {
                continue;
            }
        }
        return [];
    }

    protected parseNumericValue(rawValue: string): number {
        const cleanedValue = rawValue
            .replace(/[^\d.,\-]/g, '')
            .replace(/,/g, '');

        const parsedNumber = parseFloat(cleanedValue);
        return isNaN(parsedNumber) ? 0 : parsedNumber;
    }

    protected extractCurrencyCode(rawValue: string): string {
        const currencyPatterns: Record<string, string> = {
            '\\$': 'USD',
            '\u20AC': 'EUR',
            '\u00A3': 'GBP',
            '\u20B9': 'INR',
            'A\\$': 'AUD',
            'C\\$': 'CAD',
        };

        for (const [pattern, code] of Object.entries(currencyPatterns)) {
            if (new RegExp(pattern).test(rawValue)) {
                return code;
            }
        }

        return 'USD';
    }

    protected generateStableId(identifyingParts: string[]): string {
        const joinedString = identifyingParts
            .map(part => part.toLowerCase().trim())
            .filter(part => part.length > 0)
            .join('_');

        let hashValue = 0;
        for (let charIndex = 0; charIndex < joinedString.length; charIndex++) {
            const charCode = joinedString.charCodeAt(charIndex);
            hashValue = ((hashValue << 5) - hashValue) + charCode;
            hashValue = hashValue & hashValue;
        }

        return `${this.entityName}_${Math.abs(hashValue).toString(36)}`;
    }

    protected pauseExecution(milliseconds: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }

    abstract harvestRecords(): Promise<T[]>;
}
