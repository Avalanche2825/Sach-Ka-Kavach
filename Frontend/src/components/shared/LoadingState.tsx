import React from 'react';

interface Props {
  rows?: number;
  cols?: number;
  type?: 'table' | 'cards' | 'kpi' | 'text';
  className?: string;
}

function Shimmer({ className = '', style = {}, key }: { className?: string; style?: React.CSSProperties; key?: React.Key }) {
  return (
    <div
      className={`rounded ${className}`}
      style={{
        background: 'linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.2s infinite',
        ...style,
      }}
    />
  );
}

// Inject keyframes once
if (typeof document !== 'undefined') {
  const existing = document.getElementById('shimmer-style');
  if (!existing) {
    const style = document.createElement('style');
    style.id = 'shimmer-style';
    style.textContent = `@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`;
    document.head.appendChild(style);
  }
}

/** 4-column KPI card skeletons */
export function KpiSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-${count} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card" style={{ borderLeft: '4px solid #E2E8F0' }}>
          <Shimmer style={{ height: 11, width: '60%', marginBottom: 12 }} />
          <Shimmer style={{ height: 28, width: '40%', marginBottom: 8 }} />
          <Shimmer style={{ height: 10, width: '80%' }} />
        </div>
      ))}
    </div>
  );
}

/** Table row skeletons */
export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
        <Shimmer style={{ height: 11, width: 200 }} />
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="flex items-center gap-4 px-4 py-3 border-b border-slate-100 last:border-0"
        >
          {Array.from({ length: cols }).map((_, c) => (
            <Shimmer
              key={c}
              style={{ height: 14, flex: c === 0 ? '0 0 40px' : '1', maxWidth: c === 0 ? 40 : undefined }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Generic page loader */
export default function LoadingState({ message = 'Loading…' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: '3px solid #E8ECF2',
          borderTop: '3px solid #1B2B6B',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ fontSize: 13, color: '#64748B' }}>{message}</p>
    </div>
  );
}
