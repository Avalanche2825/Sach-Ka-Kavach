import React, { useState, useMemo } from "react";
import ReactFlow, { Background, Controls, Edge, Node, MarkerType } from "reactflow";
import "reactflow/dist/style.css";
import { KYCApplication } from "../types.js";
import { UserCheck, ShieldAlert, AlertTriangle, Fingerprint, Map, Users, Sparkles, CheckSquare } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useToast } from "./ToastProvider.tsx";
import MethodologyBanner from "./layout/MethodologyBanner.tsx";


interface KYCOnboardingProps {
  kycApps: KYCApplication[];
  onAddApplication: (app: Omit<KYCApplication, "_id" | "timestamp" | "status" | "suspiciousMatches">) => void;
  loading: boolean;
}

export default function KYCOnboarding({ kycApps, onAddApplication, loading }: KYCOnboardingProps) {
  const { showToast } = useToast();
  // Form values
  const [name, setName] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [pan, setPan] = useState("");
  const [useFakeDevice, setUseFakeDevice] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !aadhaar || !pan) {
      showToast("Please fill all onboarding identity credentials.", "warning");
      return;
    }

    // Set baseline device patterns
    const deviceFingerprint = useFakeDevice ? "FINGERPRINT_WEB_FRAUD_RING" : `FINGERPRINT_WEB_${Math.floor(200 + Math.random() * 500)}`;
    const ipAddress = useFakeDevice ? "103.88.23.99" : `192.168.1.${Math.floor(20 + Math.random() * 200)}`;

    onAddApplication({
      name,
      aadhaar,
      pan,
      deviceFingerprint,
      ipAddress
    });

    setName("");
    setAadhaar("");
    setPan("");
  };

  // --- COMPUTE NODES & EDGES FOR REACT FLOW FRAUD RING GRAPH ---
  const { flowNodes, flowEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Center Hub representing the Threat Ring Focus
    nodes.push({
      id: "hub",
      position: { x: 300, y: 150 },
      data: { label: "FRAUD SECURITY DETECTOR HUB" },
      style: {
        background: "#0f172a",
        color: "#f97316",
        border: "2px solid #ea580c",
        borderRadius: "12px",
        padding: "10px",
        fontWeight: "bold",
        fontSize: "10px",
        textAlign: "center" as const,
        width: 180,
      }
    });

    // We will place shared resource nodes that are triggered in duplicates
    nodes.push({
      id: "shared-fingerprint",
      position: { x: 150, y: 300 },
      data: { label: "SHARED DEVICE: FINGERPRINT_WEB_FRAUD_RING" },
      style: {
        background: "#450a0a",
        color: "#f87171",
        border: "1.5px solid #dc2626",
        borderRadius: "8px",
        padding: "6px",
        fontSize: "9px",
        width: 180,
      }
    });

    nodes.push({
      id: "shared-ip",
      position: { x: 300, y: 330 },
      data: { label: "SHARED IP: 103.88.23.99 (VPN / Botnet)" },
      style: {
        background: "#450a0a",
        color: "#f87171",
        border: "1.5px solid #dc2626",
        borderRadius: "8px",
        padding: "6px",
        fontSize: "9px",
        width: 180,
      }
    });

    nodes.push({
      id: "shared-aadhaar-pan",
      position: { x: 450, y: 300 },
      data: { label: "DUPLICATE: Aadhaar 3214 - 9876 - 9999 / PAN" },
      style: {
        background: "#450a0a",
        color: "#f87171",
        border: "1.5px solid #dc2626",
        borderRadius: "8px",
        padding: "6px",
        fontSize: "9px",
        width: 180,
      }
    });

    edges.push({
      id: "hub-fingerprint",
      source: "hub",
      target: "shared-fingerprint",
      style: { stroke: "#b91c1c", strokeWidth: 1.5 },
    });
    edges.push({
      id: "hub-ip",
      source: "hub",
      target: "shared-ip",
      style: { stroke: "#b91c1c", strokeWidth: 1.5 },
    });
    edges.push({
      id: "hub-aadhaar-pan",
      source: "hub",
      target: "shared-aadhaar-pan",
      style: { stroke: "#b91c1c", strokeWidth: 1.5 },
    });

    // Let's lay out the Flagged applications around the specific shared resource they relate to
    const flaggedApps = kycApps.filter(app => app.status === "Flagged" || app.suspiciousMatches.length > 0);
    
    flaggedApps.forEach((app, idx) => {
      const angle = (idx / flaggedApps.length) * 2 * Math.PI;
      const x = 300 + 260 * Math.cos(angle);
      const y = 280 + 130 * Math.sin(angle);

      const nodeId = `app-node-${app._id}`;
      nodes.push({
        id: nodeId,
        position: { x, y: y + 40 },
        data: { label: `${app.name}\n(App ID: ${app._id})` },
        style: {
          background: "#18181b",
          color: "#fda4af",
          border: "2px solid #f43f5e",
          borderRadius: "8px",
          padding: "8px",
          fontSize: "9px",
          textAlign: "center" as const,
          width: 140,
        }
      });

      // Link connections with bright RED lines highlighting fraud
      if (app.aadhaar.includes("9999") || app.name.includes("Sen")) {
        edges.push({
          id: `edge-aad-${app._id}`,
          source: "shared-aadhaar-pan",
          target: nodeId,
          style: { stroke: "#f43f5e", strokeWidth: 2, strokeDasharray: "4 4" },
          markerEnd: { type: MarkerType.Arrow, color: "#f43f5e" }
        });
      }
      if (app.deviceFingerprint.includes("FRAUD_RING")) {
        edges.push({
          id: `edge-dev-${app._id}`,
          source: "shared-fingerprint",
          target: nodeId,
          style: { stroke: "#f43f5e", strokeWidth: 2, strokeDasharray: "4 4" },
          markerEnd: { type: MarkerType.Arrow, color: "#f43f5e" }
        });
      }
      if (app.ipAddress === "103.88.23.99") {
        edges.push({
          id: `edge-ip-${app._id}`,
          source: "shared-ip",
          target: nodeId,
          style: { stroke: "#f43f5e", strokeWidth: 2 },
          markerEnd: { type: MarkerType.Arrow, color: "#f43f5e" }
        });
      }
    });

    return { flowNodes: nodes, flowEdges: edges };
  }, [kycApps]);

  return (
    <div className="space-y-6">
      
      {/* Methodology banner link */}
      <MethodologyBanner pageId="kyc" />

      <div id="kyc-fraud-module" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 1. Onboarding Entry Form */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between h-[520px]">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
              <UserCheck className="w-4 h-4 text-blue-600 font-bold" />
              Applicant Onboarding
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-405 uppercase mb-1 font-mono">Applicant Name</label>
                <input
                  type="text"
                  placeholder="e.g. Suresh Sen"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-405 uppercase mb-1 font-mono">Aadhaar ID Number</label>
                <input
                  type="text"
                  placeholder="321098765432"
                  value={aadhaar}
                  onChange={(e) => setAadhaar(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-405 uppercase mb-1 font-mono">PAN Account Code</label>
                <input
                  type="text"
                  placeholder="ABCDE1234F"
                  value={pan}
                  onChange={(e) => setPan(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono uppercase focus:ring-1 focus:ring-blue-500 focus:outline-none text-slate-800"
                />
              </div>

              {/* Flagged Node Toggle */}
              <div className="p-3 bg-red-50/50 border border-red-100 rounded-xl">
                <label className="flex items-start gap-2 text-xs text-red-800 font-medium select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useFakeDevice}
                    onChange={(e) => setUseFakeDevice(e.target.checked)}
                    className="mt-1 accent-red-650 cursor-pointer scale-90"
                  />
                  <div>
                    <span className="font-bold text-[9px] uppercase tracking-wider block text-red-600">Simulate Fraud Ring</span>
                    <p className="text-[9px] text-red-500 font-normal leading-normal mt-0.5 font-mono">
                      Forces device sharing fingerprint checks to simulate syndicated account takeover.
                    </p>
                  </div>
                </label>
              </div>

            </form>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-2.5 bg-saffron-500 hover:bg-saffron-600 text-white font-bold rounded-lg text-xs duration-200 cursor-pointer shadow-md shadow-saffron-100 disabled:opacity-50"
          >
            {loading ? "Cross-referencing graph..." : "Submit Identity Application"}
          </button>
        </div>

        {/* 2. React Flow Interactive Fraud Graph */}
        <div className="lg:col-span-6 bg-slate-950 rounded-xl border border-slate-800 shadow-sm flex flex-col h-[520px] overflow-hidden">
          <div className="bg-slate-900 px-4 py-3 border-b border-slate-850 flex justify-between items-center shrink-0">
            <div>
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest font-mono">REAL-TIME THREAT MAP</span>
              <h4 className="text-xs font-bold text-white mt-0.5">Identity Duplication Graph</h4>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-850 text-[10px] text-slate-350 border border-slate-800 px-2 py-0.5 rounded">
              <Fingerprint className="w-3.5 h-3.5 text-red-400" />
              <span>Matching nodes linked in red</span>
            </div>
          </div>

          {/* React Flow Board */}
          <div className="flex-grow w-full bg-slate-950">
            <ReactFlow
              nodes={flowNodes}
              edges={flowEdges}
              fitView
              attributionPosition="bottom-left"
            >
              <Background color="#1e293b" gap={16} size={1} />
              <Controls showInteractive={false} className="text-slate-950" />
            </ReactFlow>
          </div>

          {/* Brief footer warning list */}
          <div className="bg-slate-900 border-t border-slate-850 px-4 py-2.5 text-[9px] text-slate-400 flex justify-between items-center shrink-0 select-none">
            <span className="flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5 text-red-500" /> Duplicate parameters automatically linked in network ring graph.</span>
            <span className="font-mono text-slate-500 font-bold uppercase text-[8px]">Sentinel Graph v4.1</span>
          </div>
        </div>

        {/* 3. Nominee Notification Simulation Panel (Team SACH Innovation) */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col h-[520px] select-none justify-between">
          <div>
            <div className="border-b border-slate-100 pb-2 mb-3">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Sparkles className="w-4 h-4 text-saffron-550 shrink-0" />
                Nominee Alert Gateway
              </h4>
              <p className="text-[9px] text-slate-400 mt-0.5">Real-time SMS alerts to Owner and Nominees</p>
            </div>

            {/* Simulated Phone Frame container */}
            <div className="bg-slate-950 rounded-2xl p-3 border-4 border-slate-850 h-[330px] flex flex-col justify-start gap-3 overflow-y-auto relative shadow-inner">
              <div className="absolute top-1 left-1/2 -translate-x-1/2 bg-slate-850 h-3.5 w-16 rounded-full" /> {/* Notch */}
              <div className="text-[8px] text-slate-500 text-center font-mono mt-1 mb-2">SMS GATEWAY ACTIVE</div>

              {/* Message cards */}
              <AnimatePresence>
                {kycApps.length > 0 && kycApps[0].status === "Flagged" ? (
                  <div className="space-y-3">
                    {/* SMS card 1: Aadhaar Owner */}
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-left text-white"
                    >
                      <div className="flex justify-between items-center text-[8px] font-mono text-red-400 font-bold border-b border-slate-800 pb-1.5 mb-1.5">
                        <span>💬 SMS: BOB SECURE GATE</span>
                        <span>NOW</span>
                      </div>
                      <p className="text-[9.5px] leading-relaxed text-slate-200">
                        🚨 <strong className="text-red-400">SACH Kavach Alert:</strong> Your Aadhaar ending in <strong>{kycApps[0].aadhaar.slice(-4)}</strong> is being used in another account opening request at Delhi Node. If this was not you, call BOB Helpline: 1800-102-4455.
                      </p>
                    </motion.div>

                    {/* SMS card 2: Nominee */}
                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 }}
                      className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-left text-white"
                    >
                      <div className="flex justify-between items-center text-[8px] font-mono text-amber-400 font-bold border-b border-slate-800 pb-1.5 mb-1.5">
                        <span>💬 SMS: BOB NOMINEE HUB</span>
                        <span>NOW</span>
                      </div>
                      <p className="text-[9.5px] leading-relaxed text-slate-200">
                        ⚠️ <strong>SACH Kavach:</strong> You have been added as nominee to a high risk onboarding request by applicant <strong>{kycApps[0].name}</strong>. Verify identity details immediately on the BOB app.
                      </p>
                    </motion.div>
                  </div>
                ) : (
                  <div className="text-center py-16 text-slate-500 font-mono text-[9px] flex flex-col items-center justify-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-slate-700" />
                    <span>Awaiting suspect KYC submission to trigger nominee warnings...</span>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="p-2 border-t border-slate-100 bg-slate-50 rounded-lg text-[9.5px] text-slate-500 font-mono leading-relaxed mt-2 text-center">
            🔔 <strong>Team SACH approach:</strong> alerts notify both Aadhaar owner and nominee to halt identity-theft loops early.
          </div>
        </div>

      </div>
    </div>
  );
}
