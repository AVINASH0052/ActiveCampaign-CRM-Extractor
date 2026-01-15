import React from 'react';
import { ACDeal } from '@shared/types';
import { useDealSearchManager } from '../hooks/useSearchManager';
import { useDeleteConfirmation, ACDeleteConfirmDialog } from './ACDeleteConfirm';
import { ACSearchBar } from './ACSearchBar';
import { ACDealCard } from './ACDealCard';
import { ACEmptyState } from './ACEmptyState';

interface ACDealsTabProps {
    deals: ACDeal[];
    onDeleteDeal: (dealId: string) => Promise<boolean>;
}

export function ACDealsTab({
    deals,
    onDeleteDeal,
}: ACDealsTabProps): React.ReactElement {
    const {
        searchQuery,
        filteredRecords,
        totalCount,
        filteredCount,
        updateSearchQuery,
        clearAllFilters,
    } = useDealSearchManager(deals);

    const {
        isConfirmOpen,
        targetEntity,
        requestDelete,
        confirmDelete,
        cancelDelete,
    } = useDeleteConfirmation(onDeleteDeal);

    const isFiltered = searchQuery.trim().length > 0;
    const hasRecords = filteredRecords.length > 0;

    return (
        <div className="flex flex-col h-full">
            <ACSearchBar
                searchValue={searchQuery}
                onSearchChange={updateSearchQuery}
                placeholder="Search deals by title, contact, pipeline..."
                resultCount={filteredCount}
                totalCount={totalCount}
            />

            <div className="flex-1 overflow-y-auto">
                {hasRecords ? (
                    <div className="p-3 space-y-2">
                        {filteredRecords.map((deal) => (
                            <ACDealCard
                                key={deal.id}
                                deal={deal}
                                onDelete={requestDelete}
                            />
                        ))}
                    </div>
                ) : (
                    <ACEmptyState
                        entityType="deals"
                        isFiltered={isFiltered}
                        onClearFilter={clearAllFilters}
                    />
                )}
            </div>

            {isConfirmOpen && targetEntity && (
                <ACDeleteConfirmDialog
                    entityName={targetEntity.name}
                    onConfirm={confirmDelete}
                    onCancel={cancelDelete}
                />
            )}
        </div>
    );
}
