import React, { useState } from 'react';
import { ACErrorBoundary } from './components/ACErrorBoundary';
import { ACLoadingSpinner } from './components/ACLoadingSpinner';
import { ACDashboardHeader } from './components/ACDashboardHeader';
import { ACTabNavigation } from './components/ACTabNavigation';
import { ACContactsTab } from './components/ACContactsTab';
import { ACDealsTab } from './components/ACDealsTab';
import { ACTasksTab } from './components/ACTasksTab';
import { ACExportMenu } from './components/ACExportMenu';
import { ACErrorAlert } from './components/ACErrorAlert';
import { useStorageManager } from './hooks/useStorageManager';
import { useExtractionManager } from './hooks/useExtractionManager';

type ActiveTabId = 'contacts' | 'deals' | 'tasks';

function App(): React.ReactElement {
    const [activeTab, setActiveTab] = useState<ActiveTabId>('contacts');

    const {
        storageData,
        isLoading,
        fetchError,
        removeContact,
        removeDeal,
        removeTask,
    } = useStorageManager();

    const {
        isExtracting,
        extractionError,
        triggerExtraction,
        clearExtractionError,
    } = useExtractionManager();

    const totalRecordCount =
        storageData.contacts.length +
        storageData.deals.length +
        storageData.tasks.length;

    if (isLoading) {
        return (
            <div className="w-[420px] h-[540px] bg-surface-primary flex items-center justify-center">
                <ACLoadingSpinner message="Loading data..." />
            </div>
        );
    }

    const renderActiveTab = (): React.ReactElement => {
        switch (activeTab) {
            case 'contacts':
                return (
                    <ACContactsTab
                        contacts={storageData.contacts}
                        onDeleteContact={removeContact}
                    />
                );
            case 'deals':
                return (
                    <ACDealsTab
                        deals={storageData.deals}
                        onDeleteDeal={removeDeal}
                    />
                );
            case 'tasks':
                return (
                    <ACTasksTab
                        tasks={storageData.tasks}
                        onDeleteTask={removeTask}
                    />
                );
        }
    };

    return (
        <ACErrorBoundary>
            <div className="w-[420px] h-[540px] bg-surface-primary flex flex-col overflow-hidden">
                <ACDashboardHeader
                    lastSyncTimestamp={storageData.lastSync}
                    totalRecordCount={totalRecordCount}
                    isExtracting={isExtracting}
                    onExtractClick={triggerExtraction}
                />

                {(extractionError || fetchError) && (
                    <ACErrorAlert
                        message={extractionError || fetchError || 'An error occurred'}
                        onDismiss={clearExtractionError}
                    />
                )}

                <ACTabNavigation
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    contactCount={storageData.contacts.length}
                    dealCount={storageData.deals.length}
                    taskCount={storageData.tasks.length}
                />

                <div className="flex-1 overflow-hidden">
                    {renderActiveTab()}
                </div>

                <footer className="px-3 py-2 border-t border-border-light bg-surface-secondary 
                          flex items-center justify-between">
                    <span className="text-xs text-text-tertiary">
                        ActiveCampaign CRM Extractor
                    </span>
                    <ACExportMenu storageData={storageData} />
                </footer>
            </div>
        </ACErrorBoundary>
    );
}

export default App;
