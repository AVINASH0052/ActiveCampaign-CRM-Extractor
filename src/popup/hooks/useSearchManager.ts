/**
 * Custom hook for filtering and searching records
 * Provides debounced search across multiple fields
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { ACContact, ACDeal, ACTask, FilterCriteria, TaskType } from '@shared/types';
import { UI_CONFIG } from '@shared/constants';

interface SearchManagerState {
    searchQuery: string;
    activeFilters: FilterCriteria;
}

interface SearchManagerActions {
    updateSearchQuery: (query: string) => void;
    updatePipelineFilter: (pipeline: string) => void;
    updateStageFilter: (stage: string) => void;
    updateTaskTypeFilter: (taskType: TaskType | '') => void;
    clearAllFilters: () => void;
}

interface FilteredResults<T> {
    filteredRecords: T[];
    totalCount: number;
    filteredCount: number;
}

type UseSearchManagerReturn<T> = SearchManagerState &
    SearchManagerActions &
    FilteredResults<T>;

const initialFilters: FilterCriteria = {
    searchQuery: '',
    pipeline: '',
    stage: '',
    taskType: undefined,
};

function useDebounce<T>(value: T, delayMs: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delayMs);

        return () => clearTimeout(timer);
    }, [value, delayMs]);

    return debouncedValue;
}

export function useContactSearchManager(
    contacts: ACContact[]
): UseSearchManagerReturn<ACContact> {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilters, setActiveFilters] = useState<FilterCriteria>(initialFilters);

    const debouncedQuery = useDebounce(searchQuery, UI_CONFIG.SEARCH_DEBOUNCE_MS);

    const filteredRecords = useMemo(() => {
        if (!debouncedQuery.trim()) {
            return contacts;
        }

        const queryLower = debouncedQuery.toLowerCase();

        return contacts.filter(contact =>
            contact.name.toLowerCase().includes(queryLower) ||
            contact.email.toLowerCase().includes(queryLower) ||
            contact.phone.toLowerCase().includes(queryLower) ||
            contact.tags.some(tag => tag.toLowerCase().includes(queryLower)) ||
            contact.owner.toLowerCase().includes(queryLower)
        );
    }, [contacts, debouncedQuery]);

    const updateSearchQuery = useCallback((query: string) => {
        setSearchQuery(query);
        setActiveFilters(prev => ({ ...prev, searchQuery: query }));
    }, []);

    const updatePipelineFilter = useCallback((pipeline: string) => {
        setActiveFilters(prev => ({ ...prev, pipeline }));
    }, []);

    const updateStageFilter = useCallback((stage: string) => {
        setActiveFilters(prev => ({ ...prev, stage }));
    }, []);

    const updateTaskTypeFilter = useCallback((taskType: TaskType | '') => {
        setActiveFilters(prev => ({
            ...prev,
            taskType: taskType || undefined
        }));
    }, []);

    const clearAllFilters = useCallback(() => {
        setSearchQuery('');
        setActiveFilters(initialFilters);
    }, []);

    return {
        searchQuery,
        activeFilters,
        filteredRecords,
        totalCount: contacts.length,
        filteredCount: filteredRecords.length,
        updateSearchQuery,
        updatePipelineFilter,
        updateStageFilter,
        updateTaskTypeFilter,
        clearAllFilters,
    };
}

export function useDealSearchManager(
    deals: ACDeal[]
): UseSearchManagerReturn<ACDeal> {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilters, setActiveFilters] = useState<FilterCriteria>(initialFilters);

    const debouncedQuery = useDebounce(searchQuery, UI_CONFIG.SEARCH_DEBOUNCE_MS);

    const filteredRecords = useMemo(() => {
        let filtered = deals;

        if (debouncedQuery.trim()) {
            const queryLower = debouncedQuery.toLowerCase();
            filtered = filtered.filter(deal =>
                deal.title.toLowerCase().includes(queryLower) ||
                deal.primaryContact.toLowerCase().includes(queryLower) ||
                deal.owner.toLowerCase().includes(queryLower) ||
                deal.pipeline.toLowerCase().includes(queryLower) ||
                deal.stage.toLowerCase().includes(queryLower)
            );
        }

        if (activeFilters.pipeline) {
            filtered = filtered.filter(deal =>
                deal.pipeline === activeFilters.pipeline
            );
        }

        if (activeFilters.stage) {
            filtered = filtered.filter(deal =>
                deal.stage === activeFilters.stage
            );
        }

        return filtered;
    }, [deals, debouncedQuery, activeFilters.pipeline, activeFilters.stage]);

    const updateSearchQuery = useCallback((query: string) => {
        setSearchQuery(query);
        setActiveFilters(prev => ({ ...prev, searchQuery: query }));
    }, []);

    const updatePipelineFilter = useCallback((pipeline: string) => {
        setActiveFilters(prev => ({ ...prev, pipeline }));
    }, []);

    const updateStageFilter = useCallback((stage: string) => {
        setActiveFilters(prev => ({ ...prev, stage }));
    }, []);

    const updateTaskTypeFilter = useCallback((taskType: TaskType | '') => {
        setActiveFilters(prev => ({
            ...prev,
            taskType: taskType || undefined
        }));
    }, []);

    const clearAllFilters = useCallback(() => {
        setSearchQuery('');
        setActiveFilters(initialFilters);
    }, []);

    return {
        searchQuery,
        activeFilters,
        filteredRecords,
        totalCount: deals.length,
        filteredCount: filteredRecords.length,
        updateSearchQuery,
        updatePipelineFilter,
        updateStageFilter,
        updateTaskTypeFilter,
        clearAllFilters,
    };
}

export function useTaskSearchManager(
    tasks: ACTask[]
): UseSearchManagerReturn<ACTask> {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilters, setActiveFilters] = useState<FilterCriteria>(initialFilters);

    const debouncedQuery = useDebounce(searchQuery, UI_CONFIG.SEARCH_DEBOUNCE_MS);

    const filteredRecords = useMemo(() => {
        let filtered = tasks;

        if (debouncedQuery.trim()) {
            const queryLower = debouncedQuery.toLowerCase();
            filtered = filtered.filter(task =>
                task.title.toLowerCase().includes(queryLower) ||
                task.assignee.toLowerCase().includes(queryLower) ||
                task.type.toLowerCase().includes(queryLower) ||
                (task.linkedEntity?.name.toLowerCase().includes(queryLower) ?? false)
            );
        }

        if (activeFilters.taskType) {
            filtered = filtered.filter(task =>
                task.type === activeFilters.taskType
            );
        }

        return filtered;
    }, [tasks, debouncedQuery, activeFilters.taskType]);

    const updateSearchQuery = useCallback((query: string) => {
        setSearchQuery(query);
        setActiveFilters(prev => ({ ...prev, searchQuery: query }));
    }, []);

    const updatePipelineFilter = useCallback((pipeline: string) => {
        setActiveFilters(prev => ({ ...prev, pipeline }));
    }, []);

    const updateStageFilter = useCallback((stage: string) => {
        setActiveFilters(prev => ({ ...prev, stage }));
    }, []);

    const updateTaskTypeFilter = useCallback((taskType: TaskType | '') => {
        setActiveFilters(prev => ({
            ...prev,
            taskType: taskType || undefined
        }));
    }, []);

    const clearAllFilters = useCallback(() => {
        setSearchQuery('');
        setActiveFilters(initialFilters);
    }, []);

    return {
        searchQuery,
        activeFilters,
        filteredRecords,
        totalCount: tasks.length,
        filteredCount: filteredRecords.length,
        updateSearchQuery,
        updatePipelineFilter,
        updateStageFilter,
        updateTaskTypeFilter,
        clearAllFilters,
    };
}
