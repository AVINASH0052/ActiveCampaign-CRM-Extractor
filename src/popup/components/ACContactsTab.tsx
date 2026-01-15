import React from 'react';
import { ACContact } from '@shared/types';
import { useContactSearchManager } from '../hooks/useSearchManager';
import { useDeleteConfirmation, ACDeleteConfirmDialog } from './ACDeleteConfirm';
import { ACSearchBar } from './ACSearchBar';
import { ACContactCard } from './ACContactCard';
import { ACEmptyState } from './ACEmptyState';

interface ACContactsTabProps {
    contacts: ACContact[];
    onDeleteContact: (contactId: string) => Promise<boolean>;
}

export function ACContactsTab({
    contacts,
    onDeleteContact,
}: ACContactsTabProps): React.ReactElement {
    const {
        searchQuery,
        filteredRecords,
        totalCount,
        filteredCount,
        updateSearchQuery,
        clearAllFilters,
    } = useContactSearchManager(contacts);

    const {
        isConfirmOpen,
        targetEntity,
        requestDelete,
        confirmDelete,
        cancelDelete,
    } = useDeleteConfirmation(onDeleteContact);

    const isFiltered = searchQuery.trim().length > 0;
    const hasRecords = filteredRecords.length > 0;

    return (
        <div className="flex flex-col h-full">
            <ACSearchBar
                searchValue={searchQuery}
                onSearchChange={updateSearchQuery}
                placeholder="Search contacts by name, email, phone..."
                resultCount={filteredCount}
                totalCount={totalCount}
            />

            <div className="flex-1 overflow-y-auto">
                {hasRecords ? (
                    <div className="p-3 space-y-2">
                        {filteredRecords.map((contact) => (
                            <ACContactCard
                                key={contact.id}
                                contact={contact}
                                onDelete={requestDelete}
                            />
                        ))}
                    </div>
                ) : (
                    <ACEmptyState
                        entityType="contacts"
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
