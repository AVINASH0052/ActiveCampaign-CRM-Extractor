import React from 'react';
import SyncIcon from '@mui/icons-material/Sync';
import StorageIcon from '@mui/icons-material/Storage';

interface ACDashboardHeaderProps {
    lastSyncTimestamp: number;
    totalRecordCount: number;
    isExtracting: boolean;
    onExtractClick: () => void;
}

function formatTimestampDisplay(timestamp: number): string {
    if (timestamp === 0) {
        return 'Never synced';
    }

    const syncDate = new Date(timestamp);
    const currentDate = new Date();
    const timeDiffMs = currentDate.getTime() - syncDate.getTime();
    const timeDiffMins = Math.floor(timeDiffMs / 60000);
    const timeDiffHours = Math.floor(timeDiffMins / 60);
    const timeDiffDays = Math.floor(timeDiffHours / 24);

    if (timeDiffMins < 1) {
        return 'Just now';
    }
    if (timeDiffMins < 60) {
        return `${timeDiffMins}m ago`;
    }
    if (timeDiffHours < 24) {
        return `${timeDiffHours}h ago`;
    }
    if (timeDiffDays < 7) {
        return `${timeDiffDays}d ago`;
    }

    return syncDate.toLocaleDateString();
}

export function ACDashboardHeader({
    lastSyncTimestamp,
    totalRecordCount,
    isExtracting,
    onExtractClick,
}: ACDashboardHeaderProps): React.ReactElement {
    return (
        <header className="bg-surface-primary border-b border-border-light px-4 py-3">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
                        <StorageIcon sx={{ color: '#ffffff', fontSize: 18 }} />
                    </div>
                    <div>
                        <h1 className="text-base font-semibold text-text-primary leading-tight">
                            CRM Extractor
                        </h1>
                        <p className="text-xs text-text-tertiary">
                            ActiveCampaign Data
                        </p>
                    </div>
                </div>

                <button
                    onClick={onExtractClick}
                    disabled={isExtracting}
                    className="btn-primary flex items-center gap-2 text-sm py-2 px-3"
                >
                    <SyncIcon
                        sx={{ fontSize: 18 }}
                        className={isExtracting ? 'animate-spin' : ''}
                    />
                    {isExtracting ? 'Extracting...' : 'Extract Now'}
                </button>
            </div>

            <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">
                    Last sync: <span className="font-medium text-text-primary">
                        {formatTimestampDisplay(lastSyncTimestamp)}
                    </span>
                </span>
                <span className="text-text-secondary">
                    <span className="font-medium text-text-primary">{totalRecordCount}</span> records stored
                </span>
            </div>
        </header>
    );
}
