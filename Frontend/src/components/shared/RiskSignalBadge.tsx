import React from 'react';
import { signalToBadgeClass } from '../../lib/risk-utils.ts';

interface Props {
  signal: string;
  className?: string;
  key?: React.Key;
}

/** Signal icons based on keyword matching */
function signalIcon(signal: string): string {
  const s = signal.toLowerCase();
  if (s.includes('emulator'))                       return '🤖';
  if (s.includes('vpn') || s.includes('proxy'))     return '🔒';
  if (s.includes('datacenter'))                      return '🖥️';
  if (s.includes('sim') || s.includes('swap'))       return '📱';
  if (s.includes('untrusted'))                       return '⚠️';
  if (s.includes('trusted') || s.includes('recognized') || s.includes('baseline')) return '✓';
  if (s.includes('new device'))                      return '🔍';
  if (s.includes('geo') || s.includes('location') || s.includes('mismatch')) return '📍';
  return '•';
}

export default function RiskSignalBadge({ signal, className = '' }: Props) {
  return (
    <span className={`${signalToBadgeClass(signal)} ${className}`}>
      <span aria-hidden="true">{signalIcon(signal)}</span>
      {signal}
    </span>
  );
}

/** Renders a list of signal badges */
export function RiskSignalList({ signals, max = 6 }: { signals: string[]; max?: number }) {
  if (!signals?.length) {
    return <span className="signal-badge signal-trusted">✓ No Risk Signals</span>;
  }
  const shown = signals.slice(0, max);
  const extra = signals.length - max;
  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((s, i) => (
        <RiskSignalBadge key={i} signal={s} />
      ))}
      {extra > 0 && (
        <span className="signal-badge signal-neutral">+{extra} more</span>
      )}
    </div>
  );
}
