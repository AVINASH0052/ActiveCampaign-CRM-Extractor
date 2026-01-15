import React from 'react';
import CircularProgress from '@mui/material/CircularProgress';

interface ACLoadingSpinnerProps {
    size?: 'small' | 'medium' | 'large';
    message?: string;
}

const sizeMap = {
    small: 20,
    medium: 32,
    large: 48,
};

export function ACLoadingSpinner({
    size = 'medium',
    message
}: ACLoadingSpinnerProps): React.ReactElement {
    return (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
            <CircularProgress
                size={sizeMap[size]}
                sx={{ color: '#2563eb' }}
            />
            {message && (
                <p className="text-sm text-text-secondary">{message}</p>
            )}
        </div>
    );
}
