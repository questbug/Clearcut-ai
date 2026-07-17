import { ShieldCheck, Heart } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-8 pt-4 border-t border-slate-900 flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-500 gap-3">
      <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center sm:justify-start">
        <span className="flex items-center gap-1.5">
          <span className="w-1 h-1 bg-slate-500 rounded-full"></span>
          Open Source (Apache-2.0)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1 h-1 bg-slate-500 rounded-full"></span>
          No Account Required
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1 h-1 bg-slate-500 rounded-full"></span>
          100% Client-Side
        </span>
      </div>
      <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-slate-600">
        <span>© {currentYear} ClearCut AI</span>
        <span>•</span>
        <span className="flex items-center gap-1">
          Made with <Heart className="h-3 w-3 text-rose-500 fill-rose-500" />
        </span>
        <span>•</span>
        <span>CLEARCUT_ALPHA_v0.95 // READY</span>
      </div>
    </footer>
  );
}

