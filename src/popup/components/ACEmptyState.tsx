import React from 'react';
import InboxIcon from '@mui/icons-material/Inbox';

interface ACEmptyStateProps {
    entityType: 'contacts' | 'deals' | 'tasks';
    isFiltered: boolean;
    onClearFilter?: () => void;
}

const entityMessages = {
    contacts: {
        empty: 'No contacts extracted yet',
        filtered: 'No contacts match your search',
        hint: 'Navigate to Contacts in ActiveCampaign and click Extract Now',
    },
    deals: {
        empty: 'No deals extracted yet',
        filtered: 'No deals match your search',
        hint: 'Navigate to Deals in ActiveCampaign and click Extract Now',
    },
    tasks: {
        empty: 'No tasks extracted yet',
        filtered: 'No tasks match your search',
        hint: 'Navigate to Tasks in ActiveCampaign and click Extract Now',
    },
};

export function ACEmptyState({
    entityType,
    isFiltered,
    onClearFilter,
}: ACEmptyStateProps): React.ReactElement {
    const messages = entityMessages[entityType];

    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-14 h-14 rounded-full bg-surface-tertiary flex items-center justify-center mb-4">
                <InboxIcon sx={{ color: '#94a3b8', fontSize: 28 }} />
            </div>

            <h3 className="text-sm font-semibold text-text-primary mb-1">
                {isFiltered ? messages.filtered : messages.empty}
            </h3>

            <p className="text-xs text-text-secondary max-w-xs mb-4">
                {isFiltered
                    ? 'Try adjusting your search terms'
                    : messages.hint
                }
            </p>

            {isFiltered && onClearFilter && (
                <button
                    onClick={onClearFilter}
                    className="btn-secondary text-sm py-1.5 px-3"
                >
                    Clear Search
                </button>
            )}
        </div>
    );
}
