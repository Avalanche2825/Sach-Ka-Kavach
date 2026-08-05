// ── Risk Score Utilities ──────────────────────────────────────────────

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low';

/**
 * Returns the risk level category for a given score.
 * Score 80-100 → critical, 60-79 → high, 40-59 → medium, 0-39 → low
 */
export function scoreToLevel(score: number): RiskLevel {
  const s = Math.round(score);
  if (s >= 80) return 'critical';
  if (s >= 60) return 'high';
  if (s >= 40) return 'medium';
  return 'low';
}

/**
 * Returns the hex color string for a given score.
 */
export function scoreToColor(score: number): string {
  const level = scoreToLevel(score);
  switch (level) {
    case 'critical': return '#DC2626';
    case 'high':     return '#EA580C';
    case 'medium':   return '#D97706';
    case 'low':      return '#16A34A';
  }
}

/**
 * Returns the human-readable trust label for a given score.
 */
export function scoreToLabel(score: number): string {
  const level = scoreToLevel(score);
  switch (level) {
    case 'critical': return 'CRITICAL';
    case 'high':     return 'HIGH RISK';
    case 'medium':   return 'CAUTION';
    case 'low':      return 'TRUSTED';
  }
}

/**
 * Returns the CSS class for a risk badge (from index.css).
 */
export function scoreToBadgeClass(score: number): string {
  const level = scoreToLevel(score);
  return `risk-badge risk-${level}`;
}

/**
 * Returns the decision label for a given score.
 */
export function scoreToDecision(score: number): { label: string; color: string; bg: string } {
  const s = Math.round(score);
  if (s >= 80) return { label: 'ALLOW',        color: '#16A34A', bg: '#F0FDF4' };
  if (s >= 60) return { label: 'OTP REQUIRED', color: '#D97706', bg: '#FFFBEB' };
  if (s >= 40) return { label: 'ALERT',        color: '#EA580C', bg: '#FFF7ED' };
  if (s >= 20) return { label: 'HOLD',         color: '#DC2626', bg: '#FEF2F2' };
  return             { label: 'BLOCK',         color: '#DC2626', bg: '#FEF2F2' };
}

/**
 * Returns the CSS signal badge class based on signal text content.
 */
export function signalToBadgeClass(signal: string): string {
  const s = signal.toLowerCase();
  if (s.includes('emulator'))              return 'signal-badge signal-emulator';
  if (s.includes('vpn') || s.includes('proxy')) return 'signal-badge signal-vpn';
  if (s.includes('datacenter'))            return 'signal-badge signal-datacenter';
  if (s.includes('sim') || s.includes('swap'))  return 'signal-badge signal-sim';
  if (s.includes('untrusted'))             return 'signal-badge signal-untrusted';
  if (s.includes('recognized') || s.includes('trusted') || s.includes('baseline'))
                                           return 'signal-badge signal-trusted';
  if (s.includes('new device'))            return 'signal-badge signal-new-device';
  if (s.includes('geo') || s.includes('mismatch') || s.includes('location'))
                                           return 'signal-badge signal-geo';
  return 'signal-badge signal-neutral';
}

/**
 * Maps a technical risk factor to customer-friendly language.
 */
export function riskFactorToCustomerText(factor: string): string {
  const f = factor.toLowerCase();
  if (f.includes('new device') || f.includes('device fingerprint'))
    return 'Logging in from a new device';
  if (f.includes('amount') || f.includes('above average') || f.includes('8x') || f.includes('high amount'))
    return 'This amount is higher than usual';
  if (f.includes('geo') || f.includes('location') || f.includes('city') || f.includes('ip'))
    return 'Login location differs from your usual area';
  if (f.includes('sim') || f.includes('swap'))
    return 'Recent SIM card change detected';
  if (f.includes('vpn') || f.includes('proxy'))
    return 'Unusual network connection detected';
  if (f.includes('time') || f.includes('hour') || f.includes('night') || f.includes('unusual'))
    return 'Transfer initiated at an unusual time';
  if (f.includes('emulator'))
    return 'Access from unrecognized device type';
  if (f.includes('velocity') || f.includes('speed'))
    return 'Multiple attempts detected in a short period';
  if (f.includes('beneficiar') || f.includes('new payee'))
    return 'Transfer to a new, unverified recipient';
  return factor; // fallback to original if no match
}
