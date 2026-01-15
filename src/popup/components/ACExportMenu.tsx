import React, { useState } from 'react';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DescriptionIcon from '@mui/icons-material/Description';
import DataObjectIcon from '@mui/icons-material/DataObject';
import { ACStorageSchema, ACContact, ACDeal, ACTask } from '@shared/types';

interface ACExportMenuProps {
    storageData: ACStorageSchema;
}

type ExportFormat = 'csv' | 'json';

function generateContactsCsv(contacts: ACContact[]): string {
    const headers = ['Name', 'Email', 'Phone', 'Tags', 'Owner', 'Extracted At'];
    const rows = contacts.map(contact => [
        escapeCsvField(contact.name),
        escapeCsvField(contact.email),
        escapeCsvField(contact.phone),
        escapeCsvField(contact.tags.join('; ')),
        escapeCsvField(contact.owner),
        new Date(contact.extractedAt).toISOString(),
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

function generateDealsCsv(deals: ACDeal[]): string {
    const headers = ['Title', 'Value', 'Currency', 'Pipeline', 'Stage', 'Contact', 'Owner', 'Extracted At'];
    const rows = deals.map(deal => [
        escapeCsvField(deal.title),
        deal.value.toString(),
        deal.currency,
        escapeCsvField(deal.pipeline),
        escapeCsvField(deal.stage),
        escapeCsvField(deal.primaryContact),
        escapeCsvField(deal.owner),
        new Date(deal.extractedAt).toISOString(),
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

function generateTasksCsv(tasks: ACTask[]): string {
    const headers = ['Type', 'Title', 'Due Date', 'Assignee', 'Linked To', 'Extracted At'];
    const rows = tasks.map(task => [
        task.type,
        escapeCsvField(task.title),
        task.dueDate,
        escapeCsvField(task.assignee),
        task.linkedEntity ? `${task.linkedEntity.type}: ${task.linkedEntity.name}` : '',
        new Date(task.extractedAt).toISOString(),
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

function escapeCsvField(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}

function downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function getCurrentDateString(): string {
    return new Date().toISOString().split('T')[0];
}

export function ACExportMenu({
    storageData,
}: ACExportMenuProps): React.ReactElement {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const hasData =
        storageData.contacts.length > 0 ||
        storageData.deals.length > 0 ||
        storageData.tasks.length > 0;

    const handleExport = async (format: ExportFormat): Promise<void> => {
        setIsExporting(true);
        const dateStr = getCurrentDateString();

        try {
            if (format === 'json') {
                const exportData = {
                    exportedAt: new Date().toISOString(),
                    contacts: storageData.contacts,
                    deals: storageData.deals,
                    tasks: storageData.tasks,
                };
                downloadFile(
                    JSON.stringify(exportData, null, 2),
                    `crm-export-${dateStr}.json`,
                    'application/json'
                );
            } else {
                if (storageData.contacts.length > 0) {
                    downloadFile(
                        generateContactsCsv(storageData.contacts),
                        `contacts-${dateStr}.csv`,
                        'text/csv'
                    );
                }
                if (storageData.deals.length > 0) {
                    downloadFile(
                        generateDealsCsv(storageData.deals),
                        `deals-${dateStr}.csv`,
                        'text/csv'
                    );
                }
                if (storageData.tasks.length > 0) {
                    downloadFile(
                        generateTasksCsv(storageData.tasks),
                        `tasks-${dateStr}.csv`,
                        'text/csv'
                    );
                }
            }
        } finally {
            setIsExporting(false);
            setIsMenuOpen(false);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                disabled={!hasData || isExporting}
                className="btn-secondary flex items-center gap-1.5 text-sm py-1.5 px-3"
            >
                <FileDownloadIcon sx={{ fontSize: 16 }} />
                Export
            </button>

            {isMenuOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsMenuOpen(false)}
                    />
                    <div className="absolute right-0 bottom-full mb-1 z-50 bg-surface-primary 
                          rounded-lg shadow-dropdown border border-border-light 
                          py-1 min-w-[140px] animate-fade-in">
                        <button
                            onClick={() => handleExport('csv')}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary
                         hover:bg-surface-secondary transition-colors"
                        >
                            <DescriptionIcon sx={{ fontSize: 16, color: '#64748b' }} />
                            Export as CSV
                        </button>
                        <button
                            onClick={() => handleExport('json')}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary
                         hover:bg-surface-secondary transition-colors"
                        >
                            <DataObjectIcon sx={{ fontSize: 16, color: '#64748b' }} />
                            Export as JSON
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
