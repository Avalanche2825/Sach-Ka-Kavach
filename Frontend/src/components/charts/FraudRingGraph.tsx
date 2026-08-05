import React, { useEffect, useMemo, useState } from "react";
import { FileText, Globe, Smartphone, User } from "lucide-react";

type SelectedLog = {
  name: string;
  clusterId?: string;
  linkedApplicants?: string[];
  linkage?: string;
} | null;

type FraudRingGraphProps = {
  selectedApp?: SelectedLog;
  // Kept for the customer dossier, which opens the graph with a customer
  // context rather than a selected KYC log.
  cif?: string;
  customerName?: string;
};

type GraphNode = { id: string; label: string; type: 'person' | 'signal'; x: number; y: number };

export default function FraudRingGraph({ selectedApp, customerName }: FraudRingGraphProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const people = selectedApp?.linkedApplicants?.length
    ? selectedApp.linkedApplicants
    : selectedApp?.name
      ? [selectedApp.name]
      : customerName
        ? [customerName]
        : [];
  const clusterId = selectedApp?.clusterId || '—';
  const linkage = selectedApp?.linkage || 'No relationship signal selected';

  const nodes = useMemo<GraphNode[]>(() => {
    const personNodes = people.map((name, index) => ({
      id: `person-${index}`,
      label: name,
      type: 'person' as const,
      x: 100 + index * Math.max(150, Math.min(220, 580 / Math.max(people.length, 1))),
      y: index % 2 ? 250 : 85,
    }));
    return [...personNodes, { id: 'signal', label: linkage, type: 'signal', x: 430, y: 165 }];
  }, [people.join('|'), linkage]);

  useEffect(() => setSelectedNode(nodes[0]?.id || null), [nodes]);

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div>
          <div className="text-xs font-bold text-slate-800 font-mono uppercase">Selected-log relationship graph</div>
          <p className="text-[10px] text-slate-500 mt-0.5">Only applicants named in this KYC log are shown.</p>
        </div>
        <span className="text-[10px] font-mono text-slate-500">Cluster {clusterId} · {people.length} named applicant{people.length === 1 ? '' : 's'}</span>
      </div>

      <div className="relative h-[390px] overflow-x-auto bg-slate-50/50 bg-[radial-gradient(#CBD5E1_1px,transparent_1px)] [background-size:16px_16px]">
        <div className="relative min-w-[720px] h-full">
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {nodes.filter((node) => node.type === 'person').map((node) => (
              <line key={node.id} x1={node.x + 52} y1={node.y + 30} x2={482} y2={195} stroke="#7C3AED" strokeWidth="2" strokeDasharray="6,4" opacity="0.8" />
            ))}
          </svg>
          {nodes.map((node) => {
            const selected = selectedNode === node.id;
            const Icon = node.type === 'person' ? User : FileText;
            return (
              <button key={node.id} onClick={() => setSelectedNode(node.id)} style={{ left: node.x, top: node.y }} className="absolute w-28 text-center group">
                <span className={`inline-flex p-3 rounded-2xl border-2 shadow-md ${node.type === 'person' ? 'bg-orange-500 border-orange-600' : 'bg-red-600 border-red-800'} ${selected ? 'ring-4 ring-blue-400/50' : ''}`}>
                  <Icon className="w-5 h-5 text-white" />
                </span>
                <span className="mt-1.5 block bg-white/95 border border-slate-200 px-2 py-1 rounded-lg shadow-sm text-[10px] font-bold text-slate-800">{node.label}</span>
              </button>
            );
          })}
          <div className="absolute bottom-4 left-4 right-4 bg-white/90 border border-slate-200 rounded-xl px-4 py-2 flex gap-4 text-[10px] text-slate-700">
            <span className="flex items-center gap-1.5"><User className="w-3 h-3 text-orange-500" /> Named applicant</span>
            <span className="flex items-center gap-1.5"><FileText className="w-3 h-3 text-red-600" /> Shared relationship signal</span>
            <span className="flex items-center gap-1.5"><Smartphone className="w-3 h-3 text-purple-600" /> Device may be the signal</span>
            <span className="flex items-center gap-1.5"><Globe className="w-3 h-3 text-blue-600" /> Network may be the signal</span>
          </div>
        </div>
      </div>
    </div>
  );
}
