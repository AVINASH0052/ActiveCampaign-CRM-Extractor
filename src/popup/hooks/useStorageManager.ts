/**
 * Custom hook for managing Chrome storage operations
 * Provides reactive data access with loading and error states
 */

import { useState, useEffect, useCallback } from 'react';
import { ACStorageSchema } from '@shared/types';
import { MESSAGE_ACTIONS, MessageResponse } from '@shared/message-types';
import { DEFAULT_STORAGE_STATE, STORAGE_KEYS } from '@shared/constants';

interface StorageManagerState {
    storageData: ACStorageSchema;
    isLoading: boolean;
    fetchError: string | null;
}

interface StorageManagerActions {
    refreshStorageData: () => Promise<void>;
    removeContact: (contactId: string) => Promise<boolean>;
    removeDeal: (dealId: string) => Promise<boolean>;
    removeTask: (taskId: string) => Promise<boolean>;
    clearAllStoredData: () => Promise<boolean>;
}

type UseStorageManagerReturn = StorageManagerState & StorageManagerActions;

export function useStorageManager(): UseStorageManagerReturn {
    const [storageData, setStorageData] = useState<ACStorageSchema>({
        ...DEFAULT_STORAGE_STATE,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const refreshStorageData = useCallback(async () => {
        setIsLoading(true);
        setFetchError(null);

        try {
            const response = await chrome.runtime.sendMessage({
                action: MESSAGE_ACTIONS.GET_STORAGE_DATA,
                timestamp: Date.now(),
            }) as MessageResponse<ACStorageSchema>;

            if (response.success && response.payload) {
                setStorageData(response.payload);
            } else {
                setFetchError(response.errorMessage ?? 'Failed to load data');
            }
        } catch (error) {
            setFetchError(error instanceof Error ? error.message : 'Connection error');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const removeRecord = useCallback(async (
        entityType: 'contacts' | 'deals' | 'tasks',
        recordId: string
    ): Promise<boolean> => {
        try {
            const response = await chrome.runtime.sendMessage({
                action: MESSAGE_ACTIONS.DELETE_RECORD,
                entityType,
                recordId,
                timestamp: Date.now(),
            }) as MessageResponse;

            if (response.success) {
                await refreshStorageData();
                return true;
            }

            setFetchError(response.errorMessage ?? 'Delete failed');
            return false;
        } catch (error) {
            setFetchError(error instanceof Error ? error.message : 'Delete error');
            return false;
        }
    }, [refreshStorageData]);

    const removeContact = useCallback(
        (contactId: string) => removeRecord('contacts', contactId),
        [removeRecord]
    );

    const removeDeal = useCallback(
        (dealId: string) => removeRecord('deals', dealId),
        [removeRecord]
    );

    const removeTask = useCallback(
        (taskId: string) => removeRecord('tasks', taskId),
        [removeRecord]
    );

    const clearAllStoredData = useCallback(async (): Promise<boolean> => {
        try {
            const response = await chrome.runtime.sendMessage({
                action: MESSAGE_ACTIONS.CLEAR_ALL_DATA,
                timestamp: Date.now(),
            }) as MessageResponse;

            if (response.success) {
                await refreshStorageData();
                return true;
            }

            setFetchError(response.errorMessage ?? 'Clear failed');
            return false;
        } catch (error) {
            setFetchError(error instanceof Error ? error.message : 'Clear error');
            return false;
        }
    }, [refreshStorageData]);

    useEffect(() => {
        refreshStorageData();
    }, [refreshStorageData]);

    useEffect(() => {
        const handleStorageChange = (
            changes: { [key: string]: chrome.storage.StorageChange },
            namespace: string
        ) => {
            if (namespace === 'local' && changes[STORAGE_KEYS.CRM_DATA]) {
                const newData = changes[STORAGE_KEYS.CRM_DATA].newValue as ACStorageSchema;
                if (newData) {
                    setStorageData(newData);
                }
            }
        };

        chrome.storage.onChanged.addListener(handleStorageChange);

        return () => {
            chrome.storage.onChanged.removeListener(handleStorageChange);
        };
    }, []);

    return {
        storageData,
        isLoading,
        fetchError,
        refreshStorageData,
        removeContact,
        removeDeal,
        removeTask,
        clearAllStoredData,
    };
}
