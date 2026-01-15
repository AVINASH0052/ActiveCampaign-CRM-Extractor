import React from 'react';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PersonIcon from '@mui/icons-material/Person';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { ACDeal } from '@shared/types';
import { CURRENCY_SYMBOLS } from '@shared/constants';

interface ACDealCardProps {
    deal: ACDeal;
    onDelete: (id: string, name: string) => void;
}

function formatDealValue(value: number, currency: string): string {
    const symbol = CURRENCY_SYMBOLS[currency] || '$';

    if (value >= 1000000) {
        return `${symbol}${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
        return `${symbol}${(value / 1000).toFixed(1)}K`;
    }

    return `${symbol}${value.toLocaleString()}`;
}

const stageColorMap: Record<string, string> = {
    'new': 'bg-blue-100 text-blue-700',
    'qualified': 'bg-cyan-100 text-cyan-700',
    'proposal': 'bg-purple-100 text-purple-700',
    'negotiation': 'bg-amber-100 text-amber-700',
    'won': 'bg-green-100 text-green-700',
    'closed': 'bg-green-100 text-green-700',
    'lost': 'bg-red-100 text-red-700',
};

function getStageColorClass(stage: string): string {
    const stageLower = stage.toLowerCase();

    for (const [keyword, colorClass] of Object.entries(stageColorMap)) {
        if (stageLower.includes(keyword)) {
            return colorClass;
        }
    }

    return 'bg-slate-100 text-slate-700';
}

export function ACDealCard({
    deal,
    onDelete
}: ACDealCardProps): React.ReactElement {
    const stageColor = getStageColorClass(deal.stage);

    return (
        <div className="card-container group">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="text-sm font-semibold text-text-primary text-truncate">
                            {deal.title || 'Untitled Deal'}
                        </h3>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                        <span className="flex items-center gap-1 text-sm font-semibold text-primary-600">
                            <AttachMoneyIcon sx={{ fontSize: 16 }} />
                            {formatDealValue(deal.value, deal.currency)}
                        </span>
                        <span className={`badge ${stageColor}`}>
                            {deal.stage}
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-text-secondary mb-1">
                        <AccountTreeIcon sx={{ fontSize: 14, color: '#64748b' }} />
                        <span>{deal.pipeline}</span>
                    </div>

                    {deal.primaryContact && (
                        <div className="flex items-center gap-1.5 text-xs text-text-secondary mb-1">
                            <PersonIcon sx={{ fontSize: 14, color: '#64748b' }} />
                            <span>{deal.primaryContact}</span>
                        </div>
                    )}

                    {deal.owner && (
                        <div className="text-xs text-text-tertiary">
                            Owner: {deal.owner}
                        </div>
                    )}
                </div>

                <button
                    onClick={() => onDelete(deal.id, deal.title)}
                    className="p-1.5 rounded-md text-text-tertiary hover:text-status-error 
                     hover:bg-status-errorLight transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete deal"
                >
                    <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                </button>
            </div>
        </div>
    );
}
