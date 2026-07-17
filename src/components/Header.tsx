import { Scissors, Shield, Zap } from "lucide-react";

export default function Header() {
  return (
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-slate-900 pb-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-xl italic text-white shadow-lg shadow-blue-950/30">
          C
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white leading-tight">
            ClearCut <span className="text-blue-500">AI</span>
          </h1>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5">
            High-Precision Background Removal
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800/80 px-3 py-1.5 rounded-full shadow-inner">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[11px] font-medium text-slate-300">Local Wasm Active</span>
        </div>
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800/80 px-3 py-1.5 rounded-full shadow-inner">
          <Shield className="h-3 w-3 text-blue-500" />
          <span className="text-[11px] font-medium text-slate-300">Privacy Guard: ON</span>
        </div>
      </div>
    </header>
  );
}

