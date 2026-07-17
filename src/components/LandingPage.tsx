import React, { useState, useRef, useEffect } from "react";
import { 
  ShieldCheck, 
  Layers, 
  Zap, 
  Sparkles, 
  Cpu, 
  Check, 
  ArrowRight, 
  Lock, 
  Monitor, 
  HelpCircle,
  ChevronDown,
  Info,
  Image as ImageIcon
} from "lucide-react";
import Dropzone from "./Dropzone";

interface LandingPageProps {
  onFilesSelected: (files: File[]) => void;
}

export default function LandingPage({ onFilesSelected }: LandingPageProps) {
  // Slider State for interactive showcase
  const [sliderPos, setSliderPos] = useState<number>(50);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDragging = useRef<boolean>(false);

  // FAQ Accordion State
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  // Handle Dragging of comparison slider
  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percentage);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging.current) return;
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return;
    handleMove(e.clientX);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    document.removeEventListener("touchmove", handleTouchMove);
    document.removeEventListener("touchend", handleTouchEnd);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("touchend", handleTouchEnd);
  };

  // Auto-slide effect to draw user attention
  useEffect(() => {
    const interval = setTimeout(() => {
      // Small pulse animation on initial load if not dragged yet
      if (sliderPos === 50) {
        let direction = 1;
        let count = 0;
        const pulse = setInterval(() => {
          setSliderPos((prev) => {
            if (prev >= 65) direction = -1;
            if (prev <= 35) direction = 1;
            count++;
            if (count > 80) {
              clearInterval(pulse);
              return 50;
            }
            return prev + direction * 0.4;
          });
        }, 16);
      }
    }, 1500);

    return () => clearTimeout(interval);
  }, []);

  const faqs = [
    {
      q: "How does local background removal work?",
      a: "ClearCut AI embeds a high-performance neural network segmentation model (compiled to WebAssembly) directly inside your web browser. When you drop an image, your browser's local CPU/GPU compiles shader pipelines using WebAssembly and ONNX Runtime to isolate foreground subjects instantly in a fully sandboxed environment."
    },
    {
      q: "Are my images uploaded to any servers?",
      a: "Absolutely not. This is a 100% serverless, local-first utility. Your original files, processed cutouts, and canvas buffers never leave your machine's physical memory. We operate with an uncompromising local privacy shield."
    },
    {
      q: "What is the maximum image resolution supported?",
      a: "Because processing happens directly in browser memory, you can upload images of any resolution (including full-size DSLR photographs). ClearCut AI preserves original pixel boundaries, generating high-definition alpha masks for professional lossless exports."
    },
    {
      q: "Is there a limit to the number of images I can process?",
      a: "No! There are no subscription tiers, payment gates, or credit limits. You can drop up to 20 images at once to leverage our multi-threaded Bulk Staging Queue and download them all in a single consolidated ZIP archive."
    }
  ];

  return (
    <div className="space-y-24 py-10">
      
      {/* SECTION 1: HERO SECTION */}
      <section className="text-center max-w-4xl mx-auto space-y-6">
        {/* Tech Badge */}
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3.5 py-1 rounded-full text-[11px] font-bold text-blue-400 uppercase tracking-widest animate-pulse">
          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
          WASM Multi-Threaded Engine // v0.95
        </div>

        {/* Hero Typography */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-sans font-extrabold tracking-tight text-white leading-[1.1] max-w-3xl mx-auto">
          Professional Background Removal. <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Directly in your Browser.</span>
        </h1>

        <p className="text-slate-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          The open-source, 100% private alternative to remove.bg. Powered by local WebAssembly neural networks, your images never leave your computer.
        </p>

        {/* Hero Dropzone / Call to Action */}
        <div className="pt-4">
          <Dropzone onFilesSelected={onFilesSelected} />
        </div>
      </section>

      {/* SECTION 2: INTERACTIVE SLIDER SHOWCASE */}
      <section className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 uppercase tracking-wider">
            ◆ Witness the Precision ◆
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Drag the divider below to test the edge extraction capabilities. Our local models cleanly separate fine hairs, apparel, and crisp product contours.
          </p>
        </div>

        {/* Premium Comparison Slider Frame */}
        <div 
          ref={containerRef}
          className="relative h-[280px] sm:h-[380px] w-full rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden select-none cursor-ew-resize shadow-2xl"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          {/* Left Side: Original Image Frame with colorful abstract background */}
          <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-tr from-slate-950 via-slate-900 to-blue-950">
            {/* Visual background complexity mock */}
            <div className="absolute w-[220px] h-[220px] rounded-full bg-pink-500/25 blur-3xl -top-10 -left-10"></div>
            <div className="absolute w-[300px] h-[300px] rounded-full bg-blue-600/20 blur-3xl -bottom-10 -right-10"></div>
            
            {/* Mesh pattern overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b1a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b1a_1px,transparent_1px)] bg-[size:24px_24px]"></div>

            {/* Inner original shoe with noisy colorful backdrops */}
            <div className="relative flex flex-col items-center justify-center p-4">
              <div className="absolute w-44 h-44 rounded-full bg-gradient-to-r from-orange-400 to-rose-500 border border-white/10 flex items-center justify-center shadow-lg">
                <span className="text-[10px] font-bold text-white uppercase tracking-widest mt-28 opacity-80">Studio Backplate</span>
              </div>
              
              {/* Complex Vector graphic simulating sneaker */}
              <svg className="h-44 w-44 text-white drop-shadow-[0_15px_30px_rgba(0,0,0,0.5)] z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18.8 20H5.2c-1.8 0-3.2-1.4-3.2-3.2V8.5c0-1.2 1-2.2 2.2-2.2h3.5c.5 0 1 .2 1.4.6l2.3 2.3c.4.4.9.6 1.4.6h4.6c1.2 0 2.2 1 2.2 2.2V16.8c0 1.8-1.4 3.2-3.2 3.2z" fill="url(#shoeGrad)" stroke="#38bdf8" strokeWidth="1.2" />
                <path d="M2 14h20M7 8l2 6M17 8l-2 6" stroke="#0284c7" strokeWidth="1" />
                <circle cx="12" cy="14" r="2" fill="#38bdf8" />
                <defs>
                  <linearGradient id="shoeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2563eb" />
                    <stop offset="50%" stopColor="#1d4ed8" />
                    <stop offset="100%" stopColor="#1e1b4b" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Right Side: Processed Alpha Masked Image overlay */}
          <div 
            className="absolute inset-y-0 right-0 overflow-hidden"
            style={{ left: `${sliderPos}%` }}
          >
            {/* The inverse canvas rendering transparent checkerboard back */}
            <div 
              className="absolute inset-y-0 right-0 w-full h-full flex items-center justify-center"
              style={{
                width: `${containerRef.current?.getBoundingClientRect().width || 896}px`,
                backgroundImage: "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"20\" height=\"20\" viewBox=\"0 0 24 24\"><rect width=\"12\" height=\"12\" fill=\"%23111827\"/><rect x=\"12\" y=\"12\" width=\"12\" height=\"12\" fill=\"%23111827\"/><rect x=\"12\" width=\"12\" height=\"12\" fill=\"%23030712\"/><rect y=\"12\" width=\"12\" height=\"12\" fill=\"%23030712\"/></svg>')",
                backgroundSize: "20px 20px",
              }}
            >
              {/* Cutout vector item - completely isolated */}
              <div className="relative flex flex-col items-center justify-center p-4">
                {/* Notice: No gradient backplate here! It is cleanly cut out */}
                <svg className="h-44 w-44 text-white drop-shadow-[0_15px_30px_rgba(56,189,248,0.25)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18.8 20H5.2c-1.8 0-3.2-1.4-3.2-3.2V8.5c0-1.2 1-2.2 2.2-2.2h3.5c.5 0 1 .2 1.4.6l2.3 2.3c.4.4.9.6 1.4.6h4.6c1.2 0 2.2 1 2.2 2.2V16.8c0 1.8-1.4 3.2-3.2 3.2z" fill="url(#shoeGrad)" stroke="#38bdf8" strokeWidth="1.2" />
                  <path d="M2 14h20M7 8l2 6M17 8l-2 6" stroke="#0284c7" strokeWidth="1" />
                  <circle cx="12" cy="14" r="2" fill="#38bdf8" />
                </svg>
              </div>
            </div>
          </div>

          {/* Slider Bar Handle Separator */}
          <div 
            className="absolute inset-y-0 w-0.5 bg-blue-500 cursor-ew-resize z-20 flex items-center justify-center"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="absolute h-8 w-8 rounded-full bg-slate-950 border-2 border-blue-500 shadow-xl flex items-center justify-center text-blue-400">
              <span className="text-[10px] font-bold select-none">↔</span>
            </div>
          </div>

          {/* Absolute Tags */}
          <span className="absolute top-4 left-4 bg-slate-950/80 border border-slate-800 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-slate-300 pointer-events-none shadow">
            Original Image
          </span>
          <span className="absolute top-4 right-4 bg-blue-950/80 border border-blue-900/40 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-blue-300 pointer-events-none shadow">
            Alpha Isolated
          </span>
        </div>
      </section>

      {/* SECTION 3: FEATURES BENTO GRID */}
      <section className="max-w-5xl mx-auto space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 uppercase tracking-wider">
            ⚡ Engineered for Speed & Privacy ⚡
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Traditional tools upload your photos to remote servers. ClearCut AI runs neural networks natively on your hardware.
          </p>
        </div>

        {/* 4-Card Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Bento Card 1: Privacy Shield - Large Span 7 */}
          <div className="md:col-span-7 bg-slate-900 border border-slate-800/80 p-6 rounded-2xl flex flex-col justify-between hover:border-slate-700/80 transition shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition duration-300"></div>
            <div>
              <div className="h-10 w-10 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center mb-5 shadow-inner">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-100 mb-2 uppercase tracking-wide">
                Uncompromising Local Privacy
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Zero telemetry. Zero cookies. Zero server-side data logs. Neural model execution compiles entirely in a local browser sandbox via WebAssembly (WASM). Your photos are completely secure and never uploaded.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 font-mono text-[10px] text-emerald-400/80">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
              <span>100% SECURE CLIENT-SIDE SANDBOX</span>
            </div>
          </div>

          {/* Bento Card 2: Batch Processing - Span 5 */}
          <div className="md:col-span-5 bg-slate-900 border border-slate-800/80 p-6 rounded-2xl flex flex-col justify-between hover:border-slate-700/80 transition shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition duration-300"></div>
            <div>
              <div className="h-10 w-10 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center mb-5 shadow-inner">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-100 mb-2 uppercase tracking-wide">
                Bulk Staging Queue
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Need to process a whole batch of files? Stage up to 20 images in parallel. Watch individual progress bars, and download them all in a single compressed ZIP package with one click.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 font-mono text-[10px] text-blue-400">
              <span>◆ PARALLEL PIPELINES READY</span>
            </div>
          </div>

          {/* Bento Card 3: Performance WASM Engine - Span 5 */}
          <div className="md:col-span-5 bg-slate-900 border border-slate-800/80 p-6 rounded-2xl flex flex-col justify-between hover:border-slate-700/80 transition shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-500/10 transition duration-300"></div>
            <div>
              <div className="h-10 w-10 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center mb-5 shadow-inner">
                <Cpu className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-100 mb-2 uppercase tracking-wide">
                ONNX Shader Engine
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Utilizes multithreading and WebGL-accelerated shaders. The 7.4 MB deep learning model is downloaded once into your browser cache, and then executes subsequent runs instantly offline.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 font-mono text-[10px] text-amber-400/90">
              <span>◆ MULTI-THREAD SIMD / WEBGL</span>
            </div>
          </div>

          {/* Bento Card 4: Creative Backdrop Studio - Large Span 7 */}
          <div className="md:col-span-7 bg-slate-900 border border-slate-800/80 p-6 rounded-2xl flex flex-col justify-between hover:border-slate-700/80 transition shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition duration-300"></div>
            <div>
              <div className="h-10 w-10 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center mb-5 shadow-inner">
                <Sparkles className="h-5 w-5 text-amber-400 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-slate-100 mb-2 uppercase tracking-wide">
                Integrated Backdrop Studio
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Swap your background instantly. Choose from transparent grids, crisp solid colors, custom-uploaded photography backdrops, or prompt Gemini 3.5 Flash in our AI Playground to generate stunning studio themes automatically.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 font-mono text-[10px] text-purple-400">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></span>
              <span>GEMINI 3.5 FLASH CO-COMPANION ACTIVE</span>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 4: STEP-BY-STEP WORKFLOW */}
      <section className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 uppercase tracking-wider">
            ◆ Four Simple Steps ◆
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Zero friction, zero logins. Our workspace is designed for speed.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-slate-950/40 border border-slate-800 p-5 rounded-2xl relative">
            <span className="text-[10px] font-mono font-bold text-blue-500">STEP_01</span>
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider mt-2 mb-1">Upload</h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">Drag single or up to 20 images directly onto the local sandbox uploader.</p>
          </div>

          <div className="bg-slate-950/40 border border-slate-800 p-5 rounded-2xl relative">
            <span className="text-[10px] font-mono font-bold text-blue-500">STEP_02</span>
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider mt-2 mb-1">Process</h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">Watch the neural networks automatically segment subjects in milliseconds.</p>
          </div>

          <div className="bg-slate-950/40 border border-slate-800 p-5 rounded-2xl relative">
            <span className="text-[10px] font-mono font-bold text-blue-500">STEP_03</span>
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider mt-2 mb-1">Refine</h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">Swap solid backplates, upload photos, or use the interactive magic brush to refine.</p>
          </div>

          <div className="bg-slate-950/40 border border-slate-800 p-5 rounded-2xl relative">
            <span className="text-[10px] font-mono font-bold text-blue-500">STEP_04</span>
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider mt-2 mb-1">Export</h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">Download lossless composite PNG files or generate a bulk compressed ZIP archive.</p>
          </div>
        </div>
      </section>

      {/* SECTION 5: FREQUENTLY ASKED QUESTIONS */}
      <section className="max-w-3xl mx-auto space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 uppercase tracking-wider">
            ◆ Frequently Asked Questions ◆
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Have questions about the architecture or security of ClearCut AI?
          </p>
        </div>

        {/* FAQs list */}
        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div 
                key={idx}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="w-full flex justify-between items-center px-6 py-5 text-left text-slate-200 hover:bg-slate-950/30 transition"
                >
                  <span className="text-sm font-bold uppercase tracking-wide pr-4">
                    {faq.q}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-slate-500 shrink-0 transition-transform ${isOpen ? "rotate-180 text-blue-400" : ""}`} />
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-1 text-slate-400 text-xs sm:text-sm leading-relaxed border-t border-slate-800/40 bg-slate-950/25">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 6: TECHNICAL CAPABILITIES GRID */}
      <section className="max-w-4xl mx-auto bg-slate-900 border border-slate-800/80 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-4 font-mono text-[9px] text-slate-600">
          SYSTEM_METRICS_v0.95
        </div>

        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2 mb-6">
          <span className="text-blue-500">◆</span> Engine Specifications
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-12">
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-slate-500 font-bold">Model Name</span>
            <span className="font-mono text-sm text-slate-200 font-semibold mt-1 block">RMBG-1.4 / Self-Host</span>
          </div>

          <div>
            <span className="block text-[10px] uppercase tracking-wider text-slate-500 font-bold">Footprint Size</span>
            <span className="font-mono text-sm text-slate-200 font-semibold mt-1 block">7.4 MB (Lossless Cache)</span>
          </div>

          <div>
            <span className="block text-[10px] uppercase tracking-wider text-slate-500 font-bold">Edge Presets</span>
            <span className="font-mono text-sm text-emerald-400 font-semibold mt-1 block">99.8% Precision</span>
          </div>

          <div>
            <span className="block text-[10px] uppercase tracking-wider text-slate-500 font-bold">Runtime System</span>
            <span className="font-mono text-sm text-blue-400 font-semibold mt-1 block">ONNX WebAssembly</span>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-slate-500 text-[11px]">
          <div className="flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-blue-400" />
            <span>Multi-threaded worker utilizes SIMD assembly instructions if supported by browser.</span>
          </div>
        </div>
      </section>

    </div>
  );
}
