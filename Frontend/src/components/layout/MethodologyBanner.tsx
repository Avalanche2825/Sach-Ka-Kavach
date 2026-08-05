import React, { useState, useEffect } from "react";
import { Info, X, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface MethodologyBannerProps {
  pageId: string;
}

const bannerDataMap: Record<string, { module: string; text: string; color: string }> = {
  dashboard: {
    module: "Bharat Trust Grid Architecture — Team SACH",
    text: "This dashboard represents the Unified Trust Score Engine that aggregates 5 independent risk modules: Behavioral Trust Engine (typing patterns, access time, peer-group comparison), New Device Trust Engine (IP/Geo/OS/Emulator signals), Swarm Identity Detector (Aadhaar relationship graph), Secure Recovery Shield, and Privileged Access Governance. Trust score range: 0–100. Below 20 → Auto-block + Fraud team alert.",
    color: "from-amber-500/10 to-saffron-500/5 border-amber-500/20 text-amber-900"
  },
  sessions: {
    module: "Module 1 — Behavioral Trust Engine",
    text: "Team SACH collects: User Agent, Browser fingerprint, Typing rhythm (keystroke intervals + speed), Access time patterns, Transaction timing. Comparison: User's own 90-day history AND peer-group sub-average (same age band, city tier, account type). Key innovation: Hacker Delay Layer — when risk detected, instead of instant block, system intentionally slows sensitive pages and captures IP/geo intelligence while fraud team is alerted.",
    color: "from-blue-500/10 to-[#0a1628]/5 border-blue-500/20 text-blue-900"
  },
  transactions: {
    module: "Module 2 + Risk Response Matrix",
    text: "Trust Score → Action mapping: 80–100 = Allow | 60–80 = OTP | 40–60 = Alert Customer | 20–40 = Hold Transaction | 0–20 = Block + Fraud Team Alert. AI engine: Security AI evaluates customer history, device context, amount ratios, and session signals simultaneously. Heuristic fallback ensures system works even without AI connectivity.",
    color: "from-saffron-500/10 to-orange-500/5 border-saffron-500/20 text-orange-950"
  },
  guardian: {
    module: "Guardian Multi-Sig Protocol",
    text: "When Risk Score > 80, a single customer cannot authorize a transaction alone. A registered trusted Guardian (nominee, family member, or CA) must co-sign. This implements the Four-Eyes Principle — two independent authorizations for critical actions. Inspired by RBI's dual-control mechanisms for high-value banking operations.",
    color: "from-emerald-500/10 to-teal-500/5 border-emerald-500/20 text-emerald-950"
  },
  kyc: {
    module: "Module 3 — Swarm Identity Detector",
    text: "Team SACH's key innovation: we don't just validate Aadhaar — we validate Aadhaar relationships. Rule: If Account A opens with Aadhaar X, and Account B also uses Aadhaar X → BOTH accounts frozen until manual verification. Additional signals: device fingerprint clustering, IP clustering, submission velocity (bot patterns). Nominee notification ensures the real Aadhaar owner is always alerted when their identity is used.",
    color: "from-indigo-500/10 to-purple-500/5 border-indigo-500/20 text-indigo-950"
  },
  recovery: {
    module: "Module 4 — Secure Recovery Shield",
    text: "Account recovery flows are the weakest entry point in banking security. Team SACH evaluates recovery context BEFORE allowing any step: new device? new IP? geolocation mismatch? emulator? SIM swap event? Each signal increases risk score. Mobile number changes are flagged as highest-risk (SIM swap attack vector). When score > 45 → Fraud team notified. When score > 65 → Recovery blocked, manual verification required.",
    color: "from-pink-500/10 to-rose-500/5 border-pink-500/20 text-rose-950"
  },
  insider: {
    module: "Module 5 — Privileged Access Governance Engine",
    text: "Layer-based access: employees only receive permissions necessary for their current role. Four-Eyes Principle: critical actions require Employee + Manager approval. Temporary Privilege Tokens: sensitive access auto-revokes after 2 hours — no permanent privilege accumulation. Outside-hours actions trigger automatic escalation. This directly addresses the insider threat pattern where legitimate credentials are used for illegitimate purposes.",
    color: "from-cyan-500/10 to-teal-500/5 border-cyan-500/20 text-cyan-950"
  },
  "hacker-delay": {
    module: "SACH Kavach Unique Innovation — Hacker Delay Layer",
    text: "Most fraud systems either block (alerting the attacker) or allow (completing the fraud). Bharat Trust Grid introduces a third path: when risk score is 40–65, the system appears to work normally for the attacker while secretly: (1) degrading their session performance, (2) capturing enriched intelligence (precise geo, behavioral recording, attempted actions), (3) alerting fraud team, (4) notifying the real customer. The attacker wastes time. The fraud team responds. The genuine customer is protected without being disrupted.",
    color: "from-violet-500/10 to-purple-500/5 border-violet-500/20 text-violet-950"
  },
  audit: {
    module: "Immutable Audit Ledger",
    text: "Every decision made by Bharat Trust Grid is logged with: timestamp, actor (AI engine or human), event description, risk score, risk factors, and decision outcome. Records are hash-chained (tamper-evident simulation) for regulatory compliance. This satisfies RBI's requirements for audit trails and provides explainability for every automated decision — critical for bank risk teams and regulators.",
    color: "from-slate-500/10 to-slate-650/5 border-slate-500/20 text-slate-900"
  }
};

export default function MethodologyBanner({ pageId }: MethodologyBannerProps) {
  const data = bannerDataMap[pageId] || bannerDataMap["dashboard"];
  const storageKey = `sach_banner_dismissed_${pageId}`;
  
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem(storageKey) === "true";
  });
  
  const [isExpanded, setIsExpanded] = useState(true);

  // Sync state if page changes
  useEffect(() => {
    setIsDismissed(localStorage.getItem(storageKey) === "true");
    setIsExpanded(true);
  }, [pageId]);

  const handleDismiss = () => {
    localStorage.setItem(storageKey, "true");
    setIsDismissed(true);
  };

  if (isDismissed) return null;

  return (
    <div className={`mb-6 p-4 rounded-xl border bg-gradient-to-r ${data.color} shadow-sm relative overflow-hidden transition-all duration-300`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <Info className="w-5 h-5 mt-0.5 shrink-0 text-saffron-600" />
          <div>
            <h4 className="font-mono text-xs font-bold tracking-tight text-slate-800 uppercase">
              {data.module}
            </h4>
            
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.p
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-xs leading-relaxed text-slate-600 mt-1 font-sans pr-8 overflow-hidden"
                >
                  {data.text}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 select-none">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-slate-200/50 rounded-lg text-slate-500 transition-colors"
            title={isExpanded ? "Collapse info" : "Expand info"}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-slate-200/50 rounded-lg text-slate-500 transition-colors"
            title="Dismiss forever"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
