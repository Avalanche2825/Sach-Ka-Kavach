import React from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

interface RiskSparklineProps {
  baseScore: number;
  seed?: number;
}

export default function RiskSparkline({ baseScore = 80, seed = 0 }: RiskSparklineProps) {
  // Generate a mini historical array of 7 points ending in the current baseScore
  const data = React.useMemo(() => {
    const points = [];
    let currentVal = baseScore;
    
    // Seeded random walk to create a unique consistent line for each client
    for (let i = 0; i < 7; i++) {
      const idx = 6 - i;
      if (idx === 0) {
        points.unshift({ score: baseScore });
      } else {
        const hash = (seed + idx) * 31 % 17; // deterministic random step between -6 and +6
        const step = (hash % 13) - 6;
        currentVal = Math.min(100, Math.max(30, currentVal - step));
        points.unshift({ score: currentVal });
      }
    }
    return points;
  }, [baseScore, seed]);

  // Determine line color based on ending score
  const strokeColor = baseScore >= 80 ? "#10b981" : baseScore >= 60 ? "#f59e0b" : baseScore >= 40 ? "#f97316" : "#ef4444";

  return (
    <div className="w-[80px] h-[30px] inline-block shrink-0 select-none">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, bottom: 2, left: 2, right: 2 }}>
          <Line
            type="monotone"
            dataKey="score"
            stroke={strokeColor}
            strokeWidth={1.8}
            dot={false}
            animationDuration={600}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
