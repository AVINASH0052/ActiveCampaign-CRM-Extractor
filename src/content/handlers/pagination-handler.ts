/**
 * Pagination handler for extracting data across multiple pages
 */

export class PaginationHandler {
    private readonly maxPages = 10;
    private readonly pageLoadDelay = 1500;

    async extractAllPages<T>(
        extractCurrentPage: () => Promise<T[]>,
        entityType: string
    ): Promise<T[]> {
        const allRecords: T[] = [];
        let currentPage = 1;

        while (currentPage <= this.maxPages) {
            // Extract current page
            const pageRecords = await extractCurrentPage();
            allRecords.push(...pageRecords);

            // Check for next page
            const nextButton = this.findNextButton();
            if (!nextButton || this.isLastPage()) {
                break;
            }

            // Click next and wait for load
            nextButton.click();
            await this.waitForPageLoad();
            currentPage++;
        }

        console.log(`[CRM Extractor] Extracted ${allRecords.length} ${entityType} across ${currentPage} pages`);
        return allRecords;
    }

    private findNextButton(): HTMLElement | null {
        const nextSelectors = [
            'button[aria-label="Next"]',
            'button[aria-label="Next page"]',
            '.pagination-next',
            '[class*="pagination"] button:last-child',
            'a[rel="next"]',
            'button:has(svg[class*="chevron-right"])',
            '[class*="Pagination"] button:last-of-type',
            'nav button:last-child',
        ];

        for (const selector of nextSelectors) {
            try {
                const element = document.querySelector(selector) as HTMLElement;
                if (element && this.isVisible(element)) {
                    if (element instanceof HTMLButtonElement || element instanceof HTMLInputElement) {
                        if (!element.disabled) return element;
                    } else {
                        return element;
                    }
                }
            } catch {
                continue;
            }
        }

        // Fallback: find button with "Next" text
        const buttons = document.querySelectorAll('button, a');
        for (const btn of buttons) {
            const text = btn.textContent?.toLowerCase().trim() ?? '';
            if (text === 'next' || text === '>' || text === '→') {
                return btn as HTMLElement;
            }
        }

        return null;
    }

    private isLastPage(): boolean {
        const nextBtn = this.findNextButton();
        if (!nextBtn) return true;

        // Check if disabled
        if (nextBtn instanceof HTMLButtonElement || nextBtn instanceof HTMLInputElement) {
            if (nextBtn.disabled) return true;
        }

        if (nextBtn.hasAttribute('disabled')) return true;
        if (nextBtn.classList.contains('disabled')) return true;
        if (nextBtn.getAttribute('aria-disabled') === 'true') return true;

        return false;
    }

    private isVisible(element: HTMLElement): boolean {
        const style = window.getComputedStyle(element);
        return style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            style.opacity !== '0';
    }

    private waitForPageLoad(): Promise<void> {
        return new Promise(resolve => {
            setTimeout(resolve, this.pageLoadDelay);
        });
    }
}

export const paginationHandler = new PaginationHandler();
