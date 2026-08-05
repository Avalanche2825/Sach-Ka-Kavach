import React from 'react';
import { scoreToLabel, scoreToLevel, scoreToColor } from '../../lib/risk-utils.ts';

interface Props {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
  className?: string;
}

const sizes = {
  sm: { badge: 'text-[10px] px-1.5 py-0.5 gap-1', dot: 'w-1.5 h-1.5', score: 'text-[10px]' },
  md: { badge: 'text-xs px-2 py-1 gap-1.5',        dot: 'w-2 h-2',     score: 'text-xs'    },
  lg: { badge: 'text-sm px-2.5 py-1 gap-2',         dot: 'w-2.5 h-2.5', score: 'text-sm'   },
};

const levelColors: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  critical: { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA', dot: '#DC2626' },
  high:     { bg: '#FFF7ED', text: '#EA580C', border: '#FED7AA', dot: '#EA580C' },
  medium:   { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A', dot: '#D97706' },
  low:      { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0', dot: '#16A34A' },
};

export default function RiskScoreBadge({ score, size = 'md', showNumber = true, className = '' }: Props) {
  const level = scoreToLevel(score);
  const colors = levelColors[level];
  const sz = sizes[size];

  return (
    <span
      className={`inline-flex items-center rounded font-semibold border ${sz.badge} ${className}`}
      style={{ background: colors.bg, color: colors.text, borderColor: colors.border }}
    >
      <span
        className={`rounded-full flex-shrink-0 ${sz.dot}`}
        style={{ background: colors.dot }}
      />
      {showNumber && (
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>
          {Math.round(score)}
        </span>
      )}
      <span>{scoreToLabel(score)}</span>
    </span>
  );
}

/** Simple inline version showing "score/100" in JetBrains Mono */
export function ScoreNumber({ score, className = '' }: { score: number; className?: string }) {
  const color = scoreToColor(score);
  return (
    <span
      className={`font-medium ${className}`}
      style={{ color, fontFamily: 'JetBrains Mono, monospace', fontVariantNumeric: 'tabular-nums' }}
    >
      {Math.round(score)}<span style={{ color: '#94A3B8', fontSize: '0.75em' }}>/100</span>
    </span>
  );
}
