/**
 * Contact data harvester for extracting contact records from ActiveCampaign
 * Handles both list view and individual contact pages
 */

import { ACContact } from '@shared/types';
import { SELECTOR_CHAINS } from '@shared/constants';
import { BaseDataHarvester } from './base-extractor';

export class ContactDataHarvester extends BaseDataHarvester<ACContact> {
    protected entityName = 'contact';

    async harvestRecords(): Promise<ACContact[]> {
        const containerElement = await this.waitForElement(SELECTOR_CHAINS.contacts.container);

        if (!containerElement) {
            return this.attemptGenericTableExtraction();
        }

        const contactRowElements = this.findAllMatchingElements(SELECTOR_CHAINS.contacts.row);

        if (contactRowElements.length === 0) {
            return this.attemptGenericTableExtraction();
        }

        const harvestedContacts: ACContact[] = [];

        for (const rowElement of contactRowElements) {
            const extractedContact = this.extractContactFromRow(rowElement);
            if (this.isValidContact(extractedContact)) {
                harvestedContacts.push(extractedContact);
            }
        }

        return harvestedContacts;
    }

    private extractContactFromRow(rowElement: Element): ACContact {
        const contactName = this.extractTextContent(rowElement, SELECTOR_CHAINS.contacts.name);
        const contactEmail = this.extractEmailAddress(rowElement);
        const contactPhone = this.extractPhoneNumber(rowElement);
        const contactTags = this.extractMultipleTextContents(rowElement, SELECTOR_CHAINS.contacts.tags);
        const contactOwner = this.extractTextContent(rowElement, SELECTOR_CHAINS.contacts.owner);

        return {
            id: this.generateStableId([contactName, contactEmail]),
            name: contactName,
            email: contactEmail,
            phone: contactPhone,
            tags: contactTags,
            owner: contactOwner,
            extractedAt: Date.now(),
            sourceUrl: window.location.href,
        };
    }

    private extractEmailAddress(parentElement: Element): string {
        const emailFromSelector = this.extractTextContent(parentElement, SELECTOR_CHAINS.contacts.email);
        if (emailFromSelector && this.looksLikeEmail(emailFromSelector)) {
            return emailFromSelector;
        }

        const mailtoLink = parentElement.querySelector('a[href^="mailto:"]');
        if (mailtoLink) {
            const hrefValue = mailtoLink.getAttribute('href') ?? '';
            return hrefValue.replace('mailto:', '').split('?')[0].trim();
        }

        const allTextNodes = parentElement.textContent ?? '';
        const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const foundEmails = allTextNodes.match(emailPattern);

        return foundEmails?.[0] ?? '';
    }

    private extractPhoneNumber(parentElement: Element): string {
        const phoneFromSelector = this.extractTextContent(parentElement, SELECTOR_CHAINS.contacts.phone);
        if (phoneFromSelector && this.looksLikePhone(phoneFromSelector)) {
            return this.formatPhoneNumber(phoneFromSelector);
        }

        const telLink = parentElement.querySelector('a[href^="tel:"]');
        if (telLink) {
            const hrefValue = telLink.getAttribute('href') ?? '';
            return this.formatPhoneNumber(hrefValue.replace('tel:', ''));
        }

        return '';
    }

    private attemptGenericTableExtraction(): Promise<ACContact[]> {
        // Try multiple table selectors
        const tableSelectors = [
            'table tbody tr',
            '[class*="contact"] tr',
            '[class*="list"] tr',
            'tr[data-contact-id]',
            'tr[data-id]',
            '.table-row',
            '[role="row"]'
        ];

        let tableRows: NodeListOf<Element> | Element[] = document.querySelectorAll('table tbody tr');

        if (tableRows.length === 0) {
            for (const selector of tableSelectors) {
                const rows = document.querySelectorAll(selector);
                if (rows.length > 0) {
                    tableRows = rows;
                    break;
                }
            }
        }

        const harvestedContacts: ACContact[] = [];

        for (const row of tableRows) {
            // Skip header rows
            if (row.querySelector('th')) continue;

            const contactEmail = this.findEmailInElement(row);
            const contactName = this.findNameInElement(row, contactEmail);
            const contactPhone = this.findPhoneInElement(row);

            if (contactName || contactEmail) {
                harvestedContacts.push({
                    id: this.generateStableId([contactName, contactEmail]),
                    name: contactName,
                    email: contactEmail,
                    phone: contactPhone,
                    tags: this.findTagsInElement(row),
                    owner: '',
                    extractedAt: Date.now(),
                    sourceUrl: window.location.href,
                });
            }
        }

        return Promise.resolve(harvestedContacts);
    }

    private findNameInElement(element: Element, email: string): string {
        // Look for links that aren't email links - often the name is a clickable link
        const links = element.querySelectorAll('a');
        for (const link of links) {
            const href = link.getAttribute('href') ?? '';
            const text = link.textContent?.trim() ?? '';

            // Skip email links and empty links
            if (href.startsWith('mailto:') || !text) continue;

            // Skip if it looks like an email
            if (text.includes('@')) continue;

            // Skip if it's the same as email or a phone number
            if (text === email || this.looksLikePhone(text)) continue;

            // Likely a name if it's 2+ words or a reasonable length
            if (text.length >= 2 && text.length < 100) {
                return text;
            }
        }

        // Fallback: scan cells for name-like content
        const cells = element.querySelectorAll('td');
        for (const cell of cells) {
            const text = cell.textContent?.trim() ?? '';

            // Skip emails, phones, dates, and very short text
            if (text.includes('@')) continue;
            if (this.looksLikePhone(text)) continue;
            if (this.looksLikeDate(text)) continue;
            if (text.length < 2 || text.length > 100) continue;

            // Check if it might be a name (has letters, possibly spaces)
            if (/^[A-Za-z\s\-\'\.]+$/.test(text) && text.length >= 2) {
                return text;
            }
        }

        return '';
    }

    private looksLikeDate(value: string): boolean {
        return /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(value) ||
            /\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/.test(value);
    }

    private findEmailInElement(element: Element): string {
        const textContent = element.textContent ?? '';
        const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const matches = textContent.match(emailPattern);
        return matches?.[0] ?? '';
    }

    private findPhoneInElement(element: Element): string {
        const textContent = element.textContent ?? '';
        const phonePattern = /[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}/g;
        const matches = textContent.match(phonePattern);
        return matches?.[0] ? this.formatPhoneNumber(matches[0]) : '';
    }

    private findTagsInElement(element: Element): string[] {
        const tagElements = element.querySelectorAll('.tag, .badge, .label, [class*="tag"]');
        return Array.from(tagElements)
            .map(tag => tag.textContent?.trim() ?? '')
            .filter(tag => tag.length > 0 && tag.length < 50);
    }

    private isValidContact(contact: ACContact): boolean {
        return contact.name.length > 0 || contact.email.length > 0;
    }

    private looksLikeEmail(value: string): boolean {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    private looksLikePhone(value: string): boolean {
        const digitsOnly = value.replace(/\D/g, '');
        return digitsOnly.length >= 7 && digitsOnly.length <= 15;
    }

    private formatPhoneNumber(rawPhone: string): string {
        return rawPhone.replace(/\s+/g, ' ').trim();
    }
}
