import React from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, AlertTriangle, Info, Lock, X } from "lucide-react";

interface NotificationItem {
  id: string;
  type: "CRITICAL" | "HIGH" | "MEDIUM" | "INFO";
  title: string;
  message: string;
  timestamp: string;
  linkId?: string;
}

interface HeaderNotificationPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  notifications?: NotificationItem[];
}

export default function HeaderNotificationPopover({ isOpen, onClose, notifications = [] }: HeaderNotificationPopoverProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const defaultNotifs: NotificationItem[] = [
    {
      id: "n1",
      type: "CRITICAL",
      title: "High-Risk Attack Chain Detected",
      message: "Customer Vikramaditya S. (CIF100000) triggered SIM Swap + Android Emulator + ₹4.5L transfer.",
      timestamp: "10:42 AM",
      linkId: "6601f10a12"
    },
    {
      id: "n2",
      type: "HIGH",
      title: "Recovery Shield Intercepted Request",
      message: "Suspicious M-PIN unlock attempt blocked for CIF100000 due to recent SIM change (24h gate).",
      timestamp: "10:40 AM",
      linkId: "6601f10a12"
    },
    {
      id: "n3",
      type: "MEDIUM",
      title: "Insider Governance Triggered",
      message: "EMP-2049 attempted off-hours bulk customer PII export at 02:14 AM.",
      timestamp: "02:14 AM",
      linkId: "emp_2049"
    },
    {
      id: "n4",
      type: "INFO",
      title: "Mule Account Syndicate Flagged",
      message: "Graph engine identified 4 applications sharing device fingerprint & IP cluster.",
      timestamp: "01:05 AM",
      linkId: "syndicate_01"
    }
  ];

  const displayNotifs = notifications.length > 0 ? notifications : defaultNotifs;

  const getIcon = (type: string) => {
    switch (type) {
      case "CRITICAL":
        return <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />;
      case "HIGH":
      case "MEDIUM":
        return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />;
      default:
        return <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />;
    }
  };

  return (
    <div className="absolute right-4 top-14 z-50 w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden font-mono text-xs select-none">
      <div className="bg-slate-50 border-b border-slate-200 p-3.5 flex justify-between items-center">
        <h4 className="font-bold text-slate-900 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          Security Alerts ({displayNotifs.length} New)
        </h4>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
        {displayNotifs.map((n) => (
          <div
            key={n.id}
            onClick={() => {
              onClose();
              navigate(n.linkId ? `/investigation/${n.linkId}` : "/monitoring");
            }}
            className="p-3.5 hover:bg-slate-50 transition duration-150 cursor-pointer flex gap-3 items-start"
          >
            {getIcon(n.type)}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <p className="font-bold text-slate-900 text-xs truncate">{n.title}</p>
                <span className="text-[9px] text-slate-400 font-mono shrink-0 ml-2">{n.timestamp}</span>
              </div>
              <p className="text-[11px] text-slate-600 font-sans mt-0.5 leading-normal">{n.message}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-50 border-t border-slate-200 p-2.5 text-center">
        <button
          onClick={() => {
            onClose();
            navigate("/monitoring");
          }}
          className="text-2xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer uppercase tracking-wider"
        >
          View Live Activity Feed →
        </button>
      </div>
    </div>
  );
}
