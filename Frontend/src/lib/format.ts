// ── Indian Format Utilities ──────────────────────────────────────────

/**
 * Formats a number as Indian currency: ₹1,24,582
 */
export function formatINR(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(Number(amount))) return '₹0';
  return '₹' + Number(amount).toLocaleString('en-IN');
}

/**
 * Formats a date/time string in Indian format: "15 Jul 2026, 2:34 PM IST"
 */
export function formatTimestamp(ts: string | undefined | null): string {
  if (!ts) return '—';
  try {
    const d = new Date(ts);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    }).replace(',', '') + ' IST';
  } catch {
    return ts;
  }
}

/**
 * Formats just the date: "15 Jul 2026"
 */
export function formatDate(ts: string | undefined | null): string {
  if (!ts) return '—';
  try {
    const d = new Date(ts);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Kolkata',
    });
  } catch {
    return ts;
  }
}

/**
 * Formats just the time: "2:34 PM IST"
 */
export function formatTime(ts: string | undefined | null): string {
  if (!ts) return '—';
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    }) + ' IST';
  } catch {
    return ts;
  }
}

/**
 * Returns relative time: "2 min ago", "1 hr ago", "just now"
 */
export function formatRelative(ts: string | undefined | null): string {
  if (!ts) return '—';
  try {
    const diff = Date.now() - new Date(ts).getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } catch {
    return ts;
  }
}

/**
 * Masks an account number: shows only last 4 digits.
 * "1234567890123456" → "XXXX XXXX XXXX 3456"
 */
export function maskAccount(account: string | undefined | null): string {
  if (!account) return '—';
  const clean = account.replace(/\s/g, '');
  const last4 = clean.slice(-4);
  return `XXXX XXXX XXXX ${last4}`;
}

/**
 * Masks Aadhaar: shows only last 4
 * "123456789012" → "XXXX XXXX 9012"
 */
export function maskAadhaar(aadhaar: string | undefined | null): string {
  if (!aadhaar) return '—';
  const clean = aadhaar.replace(/\s/g, '');
  return `XXXX XXXX ${clean.slice(-4)}`;
}

/**
 * Masks mobile: shows only last 4
 * "9876543210" → "••••••3210"
 */
export function maskMobile(mobile: string | undefined | null): string {
  if (!mobile) return '—';
  return '••••' + mobile.slice(-4);
}

/**
 * Truncates a string and appends "..."
 */
export function truncate(str: string | undefined | null, max = 40): string {
  if (!str) return '—';
  return str.length > max ? str.slice(0, max) + '…' : str;
}

/**
 * Returns initials from a name: "Priya Sharma" → "PS"
 */
export function getInitials(name: string | undefined | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .map(w => w[0].toUpperCase())
    .slice(0, 2)
    .join('');
}
