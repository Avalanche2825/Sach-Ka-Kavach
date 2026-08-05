import React, { useEffect, useState } from "react";
import { Clock3 } from "lucide-react";

const formatTime = (showSeconds: boolean) => new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  hour: "2-digit",
  minute: "2-digit",
  ...(showSeconds ? { second: "2-digit" } : {}),
  hour12: true,
}).format(new Date());

export default function BankClock({ compact = false }: { compact?: boolean }) {
  const [time, setTime] = useState(() => formatTime(!compact));

  useEffect(() => {
    const timer = window.setInterval(() => setTime(formatTime(!compact)), 1000);
    return () => window.clearInterval(timer);
  }, [compact]);

  return (
    <div className={`flex shrink-0 items-center gap-2 rounded-xl border ${compact ? 'border-slate-700 bg-slate-900 px-2 py-1 sm:px-2.5' : 'border-blue-100 bg-blue-50 px-3 py-1.5'}`} aria-label="Indian Standard Time">
      <Clock3 className={`h-4 w-4 ${compact ? 'text-blue-300' : 'text-blue-600'}`} />
      <div className="leading-tight">
        <div className={`text-[10px] font-extrabold tabular-nums whitespace-nowrap ${compact ? 'text-white sm:text-[11px]' : 'text-slate-800'}`}>{time}</div>
        <div className={`hidden min-[420px]:block text-[9px] font-bold tracking-wide whitespace-nowrap ${compact ? 'text-slate-400' : 'text-blue-700'}`}>BANK TIME · IST</div>
      </div>
    </div>
  );
}
