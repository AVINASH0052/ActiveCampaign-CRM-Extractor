import React from 'react';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

interface ACSearchBarProps {
    searchValue: string;
    onSearchChange: (value: string) => void;
    placeholder?: string;
    resultCount?: number;
    totalCount?: number;
}

export function ACSearchBar({
    searchValue,
    onSearchChange,
    placeholder = 'Search records...',
    resultCount,
    totalCount,
}: ACSearchBarProps): React.ReactElement {
    const showResultCount = resultCount !== undefined && totalCount !== undefined;
    const isFiltered = searchValue.trim().length > 0;

    return (
        <div className="px-3 py-2 bg-surface-secondary border-b border-border-light">
            <div className="relative">
                <SearchIcon
                    sx={{ fontSize: 18 }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
                />
                <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={placeholder}
                    className="input-field pl-9 pr-9 py-2 text-sm"
                />
                {isFiltered && (
                    <button
                        onClick={() => onSearchChange('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary 
                       hover:text-text-secondary transition-colors"
                    >
                        <ClearIcon sx={{ fontSize: 18 }} />
                    </button>
                )}
            </div>

            {showResultCount && isFiltered && (
                <p className="text-xs text-text-secondary mt-1.5 px-1">
                    Showing <span className="font-medium">{resultCount}</span> of{' '}
                    <span className="font-medium">{totalCount}</span> records
                </p>
            )}
        </div>
    );
}
