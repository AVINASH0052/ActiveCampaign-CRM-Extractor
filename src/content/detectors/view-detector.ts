/**
 * View detector for identifying current ActiveCampaign page type
 * Uses URL path analysis and DOM element presence
 */

import { ViewType, ViewDetectionResult } from '@shared/types';
import { ACTIVE_CAMPAIGN_PATHS, SELECTOR_CHAINS } from '@shared/constants';

function analyzeUrlPath(): ViewType {
    const currentPath = window.location.pathname.toLowerCase();

    if (currentPath.includes(ACTIVE_CAMPAIGN_PATHS.CONTACTS)) {
        return 'contacts';
    }

    if (currentPath.includes(ACTIVE_CAMPAIGN_PATHS.PIPELINE) ||
        currentPath.includes(ACTIVE_CAMPAIGN_PATHS.DEALS)) {
        return 'deals';
    }

    if (currentPath.includes(ACTIVE_CAMPAIGN_PATHS.TASKS)) {
        return 'tasks';
    }

    return 'unknown';
}

function findElementBySelectors(selectors: readonly string[]): Element | null {
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
    return null;
}

function detectViewByDOMPresence(): ViewType {
    const contactsContainer = findElementBySelectors(SELECTOR_CHAINS.contacts.container);
    if (contactsContainer) {
        return 'contacts';
    }

    const dealsContainer = findElementBySelectors(SELECTOR_CHAINS.deals.container);
    if (dealsContainer) {
        return 'deals';
    }

    const tasksContainer = findElementBySelectors(SELECTOR_CHAINS.tasks.container);
    if (tasksContainer) {
        return 'tasks';
    }

    return 'unknown';
}

function determineConfidenceLevel(
    urlBasedView: ViewType,
    domBasedView: ViewType
): 'high' | 'medium' | 'low' {
    if (urlBasedView === domBasedView && urlBasedView !== 'unknown') {
        return 'high';
    }

    if (urlBasedView !== 'unknown' || domBasedView !== 'unknown') {
        return 'medium';
    }

    return 'low';
}

export function detectCurrentView(): ViewDetectionResult {
    const urlBasedView = analyzeUrlPath();
    const domBasedView = detectViewByDOMPresence();

    const confidence = determineConfidenceLevel(urlBasedView, domBasedView);

    const detectedView = urlBasedView !== 'unknown' ? urlBasedView : domBasedView;

    return {
        detectedView,
        confidence,
        urlPath: window.location.pathname,
    };
}

export function isActiveCampaignDomain(): boolean {
    const hostname = window.location.hostname;
    return hostname.includes('activecampaign.com') ||
        hostname.includes('activehosted.com');
}
