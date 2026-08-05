import React from "react";
import { motion } from "motion/react";

interface SecurityGaugeProps {
  score: number; // 0 - 100
  size?: number;
}

export default function SecurityGauge({ score = 75, size = 180 }: SecurityGaugeProps) {
  const clampedScore = Math.min(100, Math.max(0, score));

  const getTheme = (val: number) => {
    if (val >= 80) return { stroke: "#10b981", text: "text-emerald-650", label: "Healthy Trust" };
    if (val >= 60) return { stroke: "#f59e0b", text: "text-amber-650", label: "Elevated Verification" };
    if (val >= 40) return { stroke: "#f97316", text: "text-orange-650", label: "Escalated Alert" };
    return { stroke: "#ef4444", text: "text-red-650", label: "CRITICAL BREACH FLAG" };
  };

  const theme = getTheme(clampedScore);

  const radius = 60;
  const strokeWidth = 10;
  const center = radius + strokeWidth;
  const w = center * 2;
  const h = center + 10;
  
  const arcLength = Math.PI * radius;
  const percentage = clampedScore / 100;
  const strokeDashoffset = arcLength * (1 - percentage);

  const rotation = -90 + clampedScore * 1.8;

  return (
    <div className="flex flex-col items-center justify-center select-none" style={{ width: size }}>
      <div className="relative" style={{ width: size, height: size * 0.6 }}>
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full overflow-visible">
          {/* Background track */}
          <path
            d={`M ${strokeWidth} ${center} A ${radius} ${radius} 0 0 1 ${w - strokeWidth} ${center}`}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Foreground progress path */}
          <motion.path
            d={`M ${strokeWidth} ${center} A ${radius} ${radius} 0 0 1 ${w - strokeWidth} ${center}`}
            fill="none"
            stroke={theme.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={arcLength}
            initial={{ strokeDashoffset: arcLength }}
            animate={{ strokeDashoffset }}
            transition={{ type: "spring", stiffness: 60, damping: 15 }}
          />

          {/* Needle pivot */}
          <circle cx={center} cy={center} r="6" fill="#0f172a" />
          
          {/* Needle pointer */}
          <motion.line
            x1={center}
            y1={center}
            x2={center}
            y2={strokeWidth + 5}
            stroke="#0f172a"
            strokeWidth="3.5"
            strokeLinecap="round"
            style={{ originX: `${center}px`, originY: `${center}px` }}
            animate={{ rotate: rotation }}
            transition={{ type: "spring", stiffness: 60, damping: 15 }}
          />
        </svg>

        {/* Floating live score */}
        <div className="absolute bottom-2 left-0 right-0 flex flex-col items-center">
          <motion.span 
            className="text-3xl font-extrabold tracking-tight font-mono text-slate-900"
            animate={{ scale: [0.95, 1.05, 1] }}
            transition={{ duration: 0.3 }}
            key={clampedScore}
          >
            {clampedScore}
          </motion.span>
          <span className={`text-[9px] uppercase tracking-widest font-mono font-bold mt-1 ${theme.text}`}>
            {theme.label}
          </span>
        </div>
      </div>
    </div>
  );
}
