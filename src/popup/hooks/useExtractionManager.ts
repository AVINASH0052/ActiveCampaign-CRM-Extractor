/**
 * Custom hook for triggering data extraction
 * Manages extraction state and communicates with content script
 */

import { useState, useCallback } from 'react';
import { MESSAGE_ACTIONS, MessageResponse } from '@shared/message-types';

interface ExtractionManagerState {
    isExtracting: boolean;
    extractionError: string | null;
    lastExtractionResult: {
        entityType: string;
        count: number;
    } | null;
}

interface ExtractionManagerActions {
    triggerExtraction: () => Promise<boolean>;
    clearExtractionError: () => void;
}

type UseExtractionManagerReturn = ExtractionManagerState & ExtractionManagerActions;

export function useExtractionManager(): UseExtractionManagerReturn {
    const [isExtracting, setIsExtracting] = useState(false);
    const [extractionError, setExtractionError] = useState<string | null>(null);
    const [lastExtractionResult, setLastExtractionResult] = useState<{
        entityType: string;
        count: number;
    } | null>(null);

    const triggerExtraction = useCallback(async (): Promise<boolean> => {
        setIsExtracting(true);
        setExtractionError(null);
        setLastExtractionResult(null);

        try {
            const response = await chrome.runtime.sendMessage({
                action: MESSAGE_ACTIONS.TRIGGER_EXTRACTION,
                timestamp: Date.now(),
            }) as MessageResponse<{ entityType: string; count: number }>;

            if (response.success && response.payload) {
                setLastExtractionResult(response.payload);
                return true;
            }

            setExtractionError(response.errorMessage ?? 'Extraction failed');
            return false;

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            if (errorMessage.includes('Could not establish connection')) {
                setExtractionError('Please refresh the ActiveCampaign page and try again');
            } else {
                setExtractionError(errorMessage);
            }

            return false;

        } finally {
            setIsExtracting(false);
        }
    }, []);

    const clearExtractionError = useCallback(() => {
        setExtractionError(null);
    }, []);

    return {
        isExtracting,
        extractionError,
        lastExtractionResult,
        triggerExtraction,
        clearExtractionError,
    };
}
