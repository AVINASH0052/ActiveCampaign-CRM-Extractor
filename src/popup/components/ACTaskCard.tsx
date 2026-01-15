import React from 'react';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import EventIcon from '@mui/icons-material/Event';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PersonIcon from '@mui/icons-material/Person';
import LinkIcon from '@mui/icons-material/Link';
import ScheduleIcon from '@mui/icons-material/Schedule';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { ACTask, TaskType } from '@shared/types';

interface ACTaskCardProps {
    task: ACTask;
    onDelete: (id: string, name: string) => void;
}

const taskTypeConfig: Record<TaskType, {
    icon: React.ReactNode;
    colorClass: string;
    label: string;
}> = {
    call: {
        icon: <PhoneIcon sx={{ fontSize: 14 }} />,
        colorClass: 'bg-blue-100 text-blue-700',
        label: 'Call',
    },
    email: {
        icon: <EmailIcon sx={{ fontSize: 14 }} />,
        colorClass: 'bg-purple-100 text-purple-700',
        label: 'Email',
    },
    meeting: {
        icon: <EventIcon sx={{ fontSize: 14 }} />,
        colorClass: 'bg-cyan-100 text-cyan-700',
        label: 'Meeting',
    },
    todo: {
        icon: <CheckCircleOutlineIcon sx={{ fontSize: 14 }} />,
        colorClass: 'bg-slate-100 text-slate-700',
        label: 'To-Do',
    },
};

function formatDueDate(dateString: string): { display: string; isOverdue: boolean } {
    if (!dateString) {
        return { display: 'No due date', isOverdue: false };
    }

    const dueDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return { display: 'Today', isOverdue: false };
    }
    if (diffDays === 1) {
        return { display: 'Tomorrow', isOverdue: false };
    }
    if (diffDays === -1) {
        return { display: 'Yesterday', isOverdue: true };
    }
    if (diffDays < 0) {
        return { display: `${Math.abs(diffDays)} days overdue`, isOverdue: true };
    }
    if (diffDays <= 7) {
        return { display: `In ${diffDays} days`, isOverdue: false };
    }

    return {
        display: dueDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        }),
        isOverdue: false,
    };
}

export function ACTaskCard({
    task,
    onDelete
}: ACTaskCardProps): React.ReactElement {
    const typeConfig = taskTypeConfig[task.type];
    const dueInfo = formatDueDate(task.dueDate);

    return (
        <div className="card-container group">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className={`badge ${typeConfig.colorClass} flex items-center gap-1`}>
                            {typeConfig.icon}
                            {typeConfig.label}
                        </span>
                    </div>

                    <h3 className="text-sm font-semibold text-text-primary mb-2 text-truncate">
                        {task.title || 'Untitled Task'}
                    </h3>

                    <div className="flex items-center gap-1.5 text-xs mb-1">
                        <ScheduleIcon sx={{ fontSize: 14, color: dueInfo.isOverdue ? '#dc2626' : '#64748b' }} />
                        <span className={dueInfo.isOverdue ? 'text-status-error font-medium' : 'text-text-secondary'}>
                            {dueInfo.display}
                        </span>
                    </div>

                    {task.assignee && (
                        <div className="flex items-center gap-1.5 text-xs text-text-secondary mb-1">
                            <PersonIcon sx={{ fontSize: 14, color: '#64748b' }} />
                            <span>{task.assignee}</span>
                        </div>
                    )}

                    {task.linkedEntity && (
                        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                            <LinkIcon sx={{ fontSize: 14, color: '#64748b' }} />
                            <span className="capitalize">{task.linkedEntity.type}:</span>
                            <span className="text-primary-600">{task.linkedEntity.name}</span>
                        </div>
                    )}
                </div>

                <button
                    onClick={() => onDelete(task.id, task.title)}
                    className="p-1.5 rounded-md text-text-tertiary hover:text-status-error 
                     hover:bg-status-errorLight transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete task"
                >
                    <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                </button>
            </div>
        </div>
    );
}
