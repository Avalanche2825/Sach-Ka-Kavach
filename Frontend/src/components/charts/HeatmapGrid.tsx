import React from "react";

interface HeatmapGridProps {
  data?: Array<{ day?: string; employeeName?: string; hour: string; count: number; avgRisk: number }>;
}

export default function HeatmapGrid({ data = [] }: HeatmapGridProps) {
  // Rows representing employees
  const employees = [
    { id: "EMP100", name: "Rahul Sharma", role: "Manager" },
    { id: "EMP101", name: "Sunil Mehta", role: "Associate" },
    { id: "EMP102", name: "Priya Das", role: "Auditor" },
    { id: "EMP103", name: "Mohit Verma", role: "DB Admin" },
    { id: "EMP104", name: "Neha Gowda", role: "Clerk" },
    { id: "EMP105", name: "Sanjay Singh", role: "Support" }
  ];

  // Time windows
  const timeSlots = ["00-04", "04-08", "08-12", "12-16", "16-20", "20-24"];

  // Helper to resolve cell risk values dynamically
  const getCellDetails = (empId: string, hourSlot: string) => {
    // Generate semi-random deterministic metrics
    const hash = (empId.charCodeAt(5) + hourSlot.charCodeAt(1)) % 10;
    
    let count = 0;
    let avgRisk = 0;

    if (hash === 2) {
      count = 4;
      avgRisk = 35;
    } else if (hash === 4) {
      count = 8;
      avgRisk = 85; // Anomaly!
    } else if (hash === 7) {
      count = 2;
      avgRisk = 12;
    } else if (hash === 9) {
      count = 5;
      avgRisk = 55; // Elevated
    }

    // Special custom injection from active prop data
    const matched = data.find(d => d.hour === hourSlot && d.employeeName === empId);
    if (matched) {
      count = matched.count;
      avgRisk = matched.avgRisk;
    }

    return { count, avgRisk };
  };

  // Color mapping based on counts and risk
  const getBgColor = (count: number, risk: number) => {
    if (count === 0) return "bg-slate-50 border-slate-100 hover:bg-slate-100";
    if (risk >= 75) return "bg-red-500 hover:bg-red-600 border-red-300 text-white";
    if (risk >= 45) return "bg-amber-400 hover:bg-amber-500 border-amber-300 text-slate-900";
    return "bg-emerald-100 hover:bg-emerald-200 border-emerald-200 text-emerald-950";
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-bold text-sm text-slate-800">Privileged Action Heatmap</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">7-Day hourly access distribution & risk bounds</p>
        </div>
        <div className="flex gap-3 text-[9px] font-mono select-none">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-slate-50 border border-slate-200 rounded"></span> Idle</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-100 rounded"></span> Normal</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-400 rounded"></span> Alert</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-red-500 rounded animate-pulse"></span> Critical</span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {/* Header row labels */}
        <div className="text-[10px] font-bold text-slate-400 flex items-center justify-end pr-2 py-1 font-mono uppercase">Role</div>
        {timeSlots.map(slot => (
          <div key={slot} className="text-[9px] font-bold text-slate-500 text-center py-1 bg-slate-50/80 rounded border border-slate-100/50 font-mono">
            {slot}
          </div>
        ))}

        {/* Matrix rows */}
        {employees.map(emp => (
          <React.Fragment key={emp.id}>
            {/* Employee name / role column */}
            <div className="flex flex-col justify-center text-right pr-2 select-none">
              <span className="text-[10px] font-extrabold text-slate-800 leading-none">{emp.name.split(" ")[0]}</span>
              <span className="text-[8px] text-slate-400 mt-0.5 leading-none font-mono uppercase">{emp.role}</span>
            </div>

            {/* Time slot cells */}
            {timeSlots.map(slot => {
              const { count, avgRisk } = getCellDetails(emp.id, slot);
              const colorClass = getBgColor(count, avgRisk);

              return (
                <div
                  key={slot}
                  className={`h-11 rounded-lg border flex flex-col items-center justify-center relative cursor-help transition-all duration-200 group ${colorClass}`}
                >
                  <span className="text-xs font-bold font-mono">{count}</span>
                  {avgRisk >= 75 && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
                  )}
                  
                  {/* Glassmorphic hover tooltip */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:block z-55 w-44 bg-slate-900/95 text-white text-[10px] p-2.5 rounded-lg shadow-xl border border-slate-700 font-sans pointer-events-none">
                    <div className="font-extrabold text-saffron-400">{emp.name}</div>
                    <div className="text-slate-300 mt-0.5">Time Slot: {slot}:00</div>
                    <div className="flex justify-between border-t border-slate-700 mt-1.5 pt-1">
                      <span>Actions Logged:</span>
                      <span className="font-mono font-bold text-white">{count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Risk Score:</span>
                      <span className="font-mono font-bold text-rose-400">{avgRisk}/100</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
