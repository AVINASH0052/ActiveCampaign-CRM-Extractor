import React from 'react';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import PersonIcon from '@mui/icons-material/Person';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { ACContact } from '@shared/types';

interface ACContactCardProps {
    contact: ACContact;
    onDelete: (id: string, name: string) => void;
}

export function ACContactCard({
    contact,
    onDelete
}: ACContactCardProps): React.ReactElement {
    return (
        <div className="card-container group">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="text-sm font-semibold text-text-primary text-truncate">
                            {contact.name || 'Unnamed Contact'}
                        </h3>
                    </div>

                    {contact.email && (
                        <div className="flex items-center gap-1.5 text-xs text-text-secondary mb-1">
                            <EmailIcon sx={{ fontSize: 14, color: '#64748b' }} />
                            <span className="text-truncate">{contact.email}</span>
                        </div>
                    )}

                    {contact.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-text-secondary mb-1">
                            <PhoneIcon sx={{ fontSize: 14, color: '#64748b' }} />
                            <span>{contact.phone}</span>
                        </div>
                    )}

                    {contact.owner && (
                        <div className="flex items-center gap-1.5 text-xs text-text-secondary mb-2">
                            <PersonIcon sx={{ fontSize: 14, color: '#64748b' }} />
                            <span>{contact.owner}</span>
                        </div>
                    )}

                    {contact.tags.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <LocalOfferIcon sx={{ fontSize: 12, color: '#94a3b8' }} />
                            {contact.tags.slice(0, 3).map((tag, index) => (
                                <span key={index} className="badge-primary">
                                    {tag}
                                </span>
                            ))}
                            {contact.tags.length > 3 && (
                                <span className="text-xs text-text-tertiary">
                                    +{contact.tags.length - 3} more
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <button
                    onClick={() => onDelete(contact.id, contact.name || contact.email)}
                    className="p-1.5 rounded-md text-text-tertiary hover:text-status-error 
                     hover:bg-status-errorLight transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete contact"
                >
                    <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                </button>
            </div>
        </div>
    );
}
