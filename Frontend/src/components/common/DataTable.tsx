import React from "react";

interface Column<T> {
  header: string;
  render: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

export default function DataTable({ columns, data, emptyMessage = "No records found.", onRowClick }: DataTableProps<any>) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-xs text-slate-400 italic bg-white border border-slate-200 rounded-xl">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white border border-slate-200 rounded-xl shadow-2xs select-none">
      <table className="w-full text-left border-collapse text-xs font-sans">
        <thead>
          <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/50">
            {columns.map((col, idx) => (
              <th key={idx} className="py-3 px-4 font-bold tracking-widest">{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((row, rIdx) => (
            <tr 
              key={rIdx} 
              onClick={() => onRowClick && onRowClick(row)}
              className={`transition duration-150 text-slate-700 ${
                onRowClick ? "hover:bg-slate-50/50 cursor-pointer" : "hover:bg-slate-50/20"
              }`}
            >
              {columns.map((col, cIdx) => (
                <td key={cIdx} className="py-3 px-4 leading-normal">{col.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
