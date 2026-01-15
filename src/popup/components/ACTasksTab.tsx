import React from 'react';
import { ACTask } from '@shared/types';
import { useTaskSearchManager } from '../hooks/useSearchManager';
import { useDeleteConfirmation, ACDeleteConfirmDialog } from './ACDeleteConfirm';
import { ACSearchBar } from './ACSearchBar';
import { ACTaskCard } from './ACTaskCard';
import { ACEmptyState } from './ACEmptyState';

interface ACTasksTabProps {
    tasks: ACTask[];
    onDeleteTask: (taskId: string) => Promise<boolean>;
}

export function ACTasksTab({
    tasks,
    onDeleteTask,
}: ACTasksTabProps): React.ReactElement {
    const {
        searchQuery,
        filteredRecords,
        totalCount,
        filteredCount,
        updateSearchQuery,
        clearAllFilters,
    } = useTaskSearchManager(tasks);

    const {
        isConfirmOpen,
        targetEntity,
        requestDelete,
        confirmDelete,
        cancelDelete,
    } = useDeleteConfirmation(onDeleteTask);

    const isFiltered = searchQuery.trim().length > 0;
    const hasRecords = filteredRecords.length > 0;

    return (
        <div className="flex flex-col h-full">
            <ACSearchBar
                searchValue={searchQuery}
                onSearchChange={updateSearchQuery}
                placeholder="Search tasks by title, assignee, type..."
                resultCount={filteredCount}
                totalCount={totalCount}
            />

            <div className="flex-1 overflow-y-auto">
                {hasRecords ? (
                    <div className="p-3 space-y-2">
                        {filteredRecords.map((task) => (
                            <ACTaskCard
                                key={task.id}
                                task={task}
                                onDelete={requestDelete}
                            />
                        ))}
                    </div>
                ) : (
                    <ACEmptyState
                        entityType="tasks"
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
