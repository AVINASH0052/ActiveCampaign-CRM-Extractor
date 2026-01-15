import React from 'react';
import PersonIcon from '@mui/icons-material/Person';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import TaskAltIcon from '@mui/icons-material/TaskAlt';

type TabId = 'contacts' | 'deals' | 'tasks';

interface TabConfig {
    id: TabId;
    label: string;
    icon: React.ReactNode;
    count: number;
}

interface ACTabNavigationProps {
    activeTab: TabId;
    onTabChange: (tabId: TabId) => void;
    contactCount: number;
    dealCount: number;
    taskCount: number;
}

export function ACTabNavigation({
    activeTab,
    onTabChange,
    contactCount,
    dealCount,
    taskCount,
}: ACTabNavigationProps): React.ReactElement {
    const tabConfigs: TabConfig[] = [
        {
            id: 'contacts',
            label: 'Contacts',
            icon: <PersonIcon sx={{ fontSize: 18 }} />,
            count: contactCount,
        },
        {
            id: 'deals',
            label: 'Deals',
            icon: <MonetizationOnIcon sx={{ fontSize: 18 }} />,
            count: dealCount,
        },
        {
            id: 'tasks',
            label: 'Tasks',
            icon: <TaskAltIcon sx={{ fontSize: 18 }} />,
            count: taskCount,
        },
    ];

    return (
        <nav className="flex border-b border-border-light bg-surface-secondary">
            {tabConfigs.map((tab) => {
                const isActive = activeTab === tab.id;

                return (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`
              flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3
              text-sm font-medium transition-colors duration-150
              border-b-2 -mb-px
              ${isActive
                                ? 'text-primary-600 border-primary-600 bg-surface-primary'
                                : 'text-text-secondary border-transparent hover:text-text-primary hover:bg-surface-tertiary'
                            }
            `}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                        <span className={`
              ml-1 px-1.5 py-0.5 rounded-full text-xs font-medium
              ${isActive
                                ? 'bg-primary-100 text-primary-700'
                                : 'bg-surface-tertiary text-text-tertiary'
                            }
            `}>
                            {tab.count}
                        </span>
                    </button>
                );
            })}
        </nav>
    );
}
