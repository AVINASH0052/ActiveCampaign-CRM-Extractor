import React, { useState } from 'react';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

interface ACDeleteConfirmProps {
    entityName: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ACDeleteConfirmDialog({
    entityName,
    onConfirm,
    onCancel,
}: ACDeleteConfirmProps): React.ReactElement {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-surface-primary rounded-lg shadow-dropdown p-5 mx-4 max-w-xs w-full animate-fade-in">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-status-warningLight flex items-center justify-center">
                        <WarningAmberIcon sx={{ color: '#d97706', fontSize: 22 }} />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-text-primary">
                            Delete Record?
                        </h3>
                        <p className="text-xs text-text-secondary">
                            This action cannot be undone
                        </p>
                    </div>
                </div>

                <p className="text-sm text-text-secondary mb-4 pl-13">
                    Are you sure you want to delete{' '}
                    <span className="font-medium text-text-primary">"{entityName}"</span>?
                </p>

                <div className="flex gap-2 justify-end">
                    <button
                        onClick={onCancel}
                        className="btn-secondary text-sm py-1.5 px-3"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="btn-danger flex items-center gap-1.5"
                    >
                        <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

interface UseDeleteConfirmReturn {
    isConfirmOpen: boolean;
    targetEntity: { id: string; name: string } | null;
    requestDelete: (id: string, name: string) => void;
    confirmDelete: () => void;
    cancelDelete: () => void;
}

export function useDeleteConfirmation(
    onDelete: (id: string) => Promise<boolean>
): UseDeleteConfirmReturn {
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [targetEntity, setTargetEntity] = useState<{ id: string; name: string } | null>(null);

    const requestDelete = (id: string, name: string): void => {
        setTargetEntity({ id, name });
        setIsConfirmOpen(true);
    };

    const confirmDelete = async (): Promise<void> => {
        if (targetEntity) {
            await onDelete(targetEntity.id);
        }
        setIsConfirmOpen(false);
        setTargetEntity(null);
    };

    const cancelDelete = (): void => {
        setIsConfirmOpen(false);
        setTargetEntity(null);
    };

    return {
        isConfirmOpen,
        targetEntity,
        requestDelete,
        confirmDelete,
        cancelDelete,
    };
}
