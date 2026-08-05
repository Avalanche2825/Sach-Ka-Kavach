import React from "react";
import { motion } from "motion/react";

interface TrustGaugeProps {
  score: number; // 0 - 100
  size?: number;
}

export default function TrustGauge({ score = 75, size = 180 }: TrustGaugeProps) {
  // Clamp score
  const clampedScore = Math.min(100, Math.max(0, score));

  // Determine color theme based on trust score bands
  const getTheme = (val: number) => {
    if (val >= 80) return { stroke: "#10b981", text: "text-emerald-500", label: "Excellent Trust" };
    if (val >= 60) return { stroke: "#f59e0b", text: "text-amber-500", label: "Cautionary Trust" };
    if (val >= 40) return { stroke: "#f97316", text: "text-orange-500", label: "Elevated Risk" };
    return { stroke: "#ef4444", text: "text-red-500", label: "Critical Risk / Threat" };
  };

  const theme = getTheme(clampedScore);

  // SVG parameters
  const radius = 60;
  const strokeWidth = 10;
  const center = radius + strokeWidth;
  const w = center * 2;
  const h = center + 10;
  
  // Arc length for a semi-circle (PI * radius)
  const arcLength = Math.PI * radius;
  // Calculate stroke-dashoffset: 0 means fully colored, arcLength means empty
  const percentage = clampedScore / 100;
  const strokeDashoffset = arcLength * (1 - percentage);

  // Calculate needle rotation: -90 degrees (at 0 score) to 90 degrees (at 100 score)
  const rotation = -90 + clampedScore * 1.8;

  return (
    <div className="flex flex-col items-center justify-center select-none" style={{ width: size }}>
      <div className="relative" style={{ width: size, height: size * 0.6 }}>
        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="w-full h-full overflow-visible"
        >
          {/* Background track (semi-circle) */}
          <path
            d={`M ${strokeWidth} ${center} A ${radius} ${radius} 0 0 1 ${w - strokeWidth} ${center}`}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Foreground progress path (animated color stroke) */}
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

        {/* Floating live score centered beneath the arc pivot */}
        <div className="absolute bottom-2 left-0 right-0 flex flex-col items-center">
          <motion.span 
            className="text-3xl font-extrabold tracking-tight font-mono text-slate-900"
            animate={{ scale: [0.95, 1.05, 1] }}
            transition={{ duration: 0.3 }}
            key={clampedScore}
          >
            {clampedScore}
          </motion.span>
          <span className={`text-[10px] uppercase tracking-widest font-mono font-bold mt-1 ${theme.text}`}>
            {theme.label}
          </span>
        </div>
      </div>
    </div>
  );
}
