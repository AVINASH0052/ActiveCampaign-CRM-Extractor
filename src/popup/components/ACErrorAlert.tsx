import React from 'react';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CloseIcon from '@mui/icons-material/Close';

interface ACErrorAlertProps {
    message: string;
    onDismiss: () => void;
}

export function ACErrorAlert({
    message,
    onDismiss,
}: ACErrorAlertProps): React.ReactElement {
    return (
        <div className="mx-3 mt-2 p-3 bg-status-errorLight border border-red-200 
                    rounded-lg flex items-start gap-2 animate-slide-in">
            <ErrorOutlineIcon sx={{ color: '#dc2626', fontSize: 18, flexShrink: 0, marginTop: '1px' }} />
            <p className="flex-1 text-sm text-status-error">
                {message}
            </p>
            <button
                onClick={onDismiss}
                className="text-status-error hover:text-red-800 transition-colors"
            >
                <CloseIcon sx={{ fontSize: 16 }} />
            </button>
        </div>
    );
}
