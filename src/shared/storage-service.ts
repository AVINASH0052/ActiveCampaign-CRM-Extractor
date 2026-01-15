/**
 * Storage service for managing CRM data persistence
 * Handles CRUD operations, deduplication, and race condition prevention
 */

import {
    ACStorageSchema,
    ACContact,
    ACDeal,
    ACTask,
    StorageOperationResult
} from './types';
import { STORAGE_KEYS, DEFAULT_STORAGE_STATE, EXTRACTION_CONFIG } from './constants';

type EntityType = 'contacts' | 'deals' | 'tasks';
type EntityRecord = ACContact | ACDeal | ACTask;

class CRMStorageOrchestrator {
    private lockTimeout = 30000;

    async retrieveAllData(): Promise<StorageOperationResult<ACStorageSchema>> {
        try {
            const storageResult = await chrome.storage.local.get(STORAGE_KEYS.CRM_DATA);
            const storedData = storageResult[STORAGE_KEYS.CRM_DATA] as ACStorageSchema | undefined;

            return {
                success: true,
                payload: storedData ?? { ...DEFAULT_STORAGE_STATE },
                errorMessage: null,
            };
        } catch (error) {
            return {
                success: false,
                payload: null,
                errorMessage: error instanceof Error ? error.message : 'Failed to retrieve storage data',
            };
        }
    }

    async persistData(updatedData: ACStorageSchema): Promise<StorageOperationResult<void>> {
        try {
            await chrome.storage.local.set({
                [STORAGE_KEYS.CRM_DATA]: updatedData,
            });

            return {
                success: true,
                payload: undefined,
                errorMessage: null,
            };
        } catch (error) {
            return {
                success: false,
                payload: null,
                errorMessage: error instanceof Error ? error.message : 'Failed to persist data',
            };
        }
    }

    async acquireSyncLock(): Promise<boolean> {
        try {
            const currentData = await this.retrieveAllData();
            if (!currentData.success || !currentData.payload) {
                return false;
            }

            const lockResult = await chrome.storage.local.get(STORAGE_KEYS.SYNC_LOCK);
            const existingLock = lockResult[STORAGE_KEYS.SYNC_LOCK] as number | undefined;

            const currentTime = Date.now();

            if (existingLock && (currentTime - existingLock) < this.lockTimeout) {
                return false;
            }

            await chrome.storage.local.set({
                [STORAGE_KEYS.SYNC_LOCK]: currentTime,
            });

            const updatedData: ACStorageSchema = {
                ...currentData.payload,
                syncInProgress: true,
            };
            await this.persistData(updatedData);

            return true;
        } catch {
            return false;
        }
    }

    async releaseSyncLock(): Promise<void> {
        try {
            await chrome.storage.local.remove(STORAGE_KEYS.SYNC_LOCK);

            const currentData = await this.retrieveAllData();
            if (currentData.success && currentData.payload) {
                const updatedData: ACStorageSchema = {
                    ...currentData.payload,
                    syncInProgress: false,
                };
                await this.persistData(updatedData);
            }
        } catch {
            console.warn('Failed to release sync lock');
        }
    }

    async insertRecordsWithDeduplication<T extends EntityRecord>(
        entityType: EntityType,
        newRecords: T[]
    ): Promise<StorageOperationResult<number>> {
        const maxRetries = EXTRACTION_CONFIG.RETRY_ATTEMPTS;
        let attemptCount = 0;

        while (attemptCount < maxRetries) {
            try {
                const lockAcquired = await this.acquireSyncLock();
                if (!lockAcquired) {
                    attemptCount++;
                    await this.delayExecution(EXTRACTION_CONFIG.RETRY_DELAY_MS);
                    continue;
                }

                const currentData = await this.retrieveAllData();
                if (!currentData.success || !currentData.payload) {
                    await this.releaseSyncLock();
                    return {
                        success: false,
                        payload: null,
                        errorMessage: 'Failed to retrieve current data for deduplication',
                    };
                }

                const existingRecords = currentData.payload[entityType] as T[];
                const deduplicatedRecords = this.performDeduplication(existingRecords, newRecords);

                const updatedData: ACStorageSchema = {
                    ...currentData.payload,
                    [entityType]: deduplicatedRecords,
                    lastSync: Date.now(),
                };

                const persistResult = await this.persistData(updatedData);
                await this.releaseSyncLock();

                if (!persistResult.success) {
                    return {
                        success: false,
                        payload: null,
                        errorMessage: persistResult.errorMessage,
                    };
                }

                const insertedCount = deduplicatedRecords.length - existingRecords.length;
                return {
                    success: true,
                    payload: Math.max(0, insertedCount),
                    errorMessage: null,
                };
            } catch (error) {
                await this.releaseSyncLock();
                attemptCount++;

                if (attemptCount >= maxRetries) {
                    return {
                        success: false,
                        payload: null,
                        errorMessage: error instanceof Error ? error.message : 'Insert operation failed after retries',
                    };
                }

                await this.delayExecution(EXTRACTION_CONFIG.RETRY_DELAY_MS);
            }
        }

        return {
            success: false,
            payload: null,
            errorMessage: 'Failed to acquire sync lock after maximum retries',
        };
    }

    private performDeduplication<T extends EntityRecord>(
        existingRecords: T[],
        newRecords: T[]
    ): T[] {
        const recordMap = new Map<string, T>();

        for (const record of existingRecords) {
            recordMap.set(record.id, record);
        }

        for (const newRecord of newRecords) {
            const existingRecord = recordMap.get(newRecord.id);

            if (!existingRecord) {
                recordMap.set(newRecord.id, newRecord);
            } else if (newRecord.extractedAt > existingRecord.extractedAt) {
                recordMap.set(newRecord.id, newRecord);
            }
        }

        return Array.from(recordMap.values());
    }

    async removeRecord(
        entityType: EntityType,
        recordId: string
    ): Promise<StorageOperationResult<void>> {
        try {
            const currentData = await this.retrieveAllData();
            if (!currentData.success || !currentData.payload) {
                return {
                    success: false,
                    payload: null,
                    errorMessage: 'Failed to retrieve current data',
                };
            }

            const existingRecords = currentData.payload[entityType] as EntityRecord[];
            const filteredRecords = existingRecords.filter(record => record.id !== recordId);

            if (filteredRecords.length === existingRecords.length) {
                return {
                    success: false,
                    payload: null,
                    errorMessage: 'Record not found',
                };
            }

            const updatedData: ACStorageSchema = {
                ...currentData.payload,
                [entityType]: filteredRecords,
            };

            return await this.persistData(updatedData);
        } catch (error) {
            return {
                success: false,
                payload: null,
                errorMessage: error instanceof Error ? error.message : 'Delete operation failed',
            };
        }
    }

    async clearAllRecords(): Promise<StorageOperationResult<void>> {
        try {
            await chrome.storage.local.set({
                [STORAGE_KEYS.CRM_DATA]: { ...DEFAULT_STORAGE_STATE },
            });

            return {
                success: true,
                payload: undefined,
                errorMessage: null,
            };
        } catch (error) {
            return {
                success: false,
                payload: null,
                errorMessage: error instanceof Error ? error.message : 'Clear operation failed',
            };
        }
    }

    private delayExecution(milliseconds: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }
}

export const storageOrchestrator = new CRMStorageOrchestrator();
