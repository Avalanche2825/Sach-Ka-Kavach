import React from 'react';

interface Props {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({ icon, title = 'No data', description, action, className = '' }: Props) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-16 px-8 ${className}`}>
      {icon ? (
        <div className="mb-4 text-slate-300" style={{ fontSize: 48 }}>{icon}</div>
      ) : (
        <div className="mb-4 w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5">
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
            <rect x="9" y="3" width="6" height="4" rx="1"/>
            <line x1="9" y1="12" x2="15" y2="12"/>
            <line x1="9" y1="16" x2="13" y2="16"/>
          </svg>
        </div>
      )}
      <h3 style={{ fontSize: 15, fontWeight: 600, color: '#0F172A', marginBottom: 6 }}>{title}</h3>
      {description && (
        <p style={{ fontSize: 13, color: '#64748B', maxWidth: 280, lineHeight: 1.6 }}>{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
