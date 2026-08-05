import React from "react";

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const norm = (status || "").toUpperCase();

  const getStyle = () => {
    switch (norm) {
      case "APPROVED":
      case "ALLOW":
      case "ACTIVE":
      case "HEALTHY":
      case "SYSTEM_READY":
        return "bg-emerald-50 text-emerald-700 border-emerald-300 shadow-2xs font-extrabold";
      case "CHALLENGE":
      case "OTP_REQUIRED":
      case "OTP_SENT":
        return "bg-blue-50 text-blue-700 border-blue-300 shadow-2xs font-extrabold";
      case "ALERT":
      case "WARNING":
      case "PENDING":
      case "CIF_REQUIRED":
        return "bg-amber-50 text-amber-700 border-amber-300 shadow-2xs font-extrabold";
      case "HOLD":
      case "ESCROW_HOLD":
      case "INVESTIGATING":
      case "ASSIGNED":
      case "MANUAL_REVIEW":
      case "GUARDIAN_APPROVAL_REQUIRED":
      case "FOUR_EYES_REQUIRED":
        return "bg-purple-50 text-purple-700 border-purple-300 shadow-2xs font-extrabold";
      case "REJECTED":
      case "BLOCK":
      case "BLOCKED":
      case "BRANCH_VERIFICATION_REQUIRED":
      case "BLOCK_AND_REVOKE":
      case "CRITICAL":
        return "bg-red-50 text-red-700 border-red-300 shadow-2xs font-extrabold";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300 font-extrabold";
    }
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] tracking-wider font-mono rounded-lg border ${getStyle()} uppercase shrink-0 leading-none`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0 animate-pulse"></span>
      {status}
    </span>
  );
}
