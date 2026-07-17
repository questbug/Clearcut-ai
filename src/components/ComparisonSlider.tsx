import React, { useRef, useState, useEffect } from "react";
import { MoveHorizontal } from "lucide-react";

interface ComparisonSliderProps {
  originalUrl: string;
  processedUrl: string;
  // Optional backdrop config to show under the transparent overlay
  backdropStyle?: React.CSSProperties;
}

export default function ComparisonSlider({
  originalUrl,
  processedUrl,
  backdropStyle,
}: ComparisonSliderProps) {
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [isSliding, setIsSliding] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSliding) return;
    handleMove(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSliding) return;
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleMouseDown = () => setIsSliding(true);
  const handleTouchStart = () => setIsSliding(true);

  useEffect(() => {
    const handleMouseUp = () => setIsSliding(false);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchend", handleMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onMouseDown={(e) => {
        // Prevent default text selection during sliding
        e.preventDefault();
        handleMouseDown();
      }}
      onTouchStart={handleTouchStart}
      className="relative w-full aspect-video sm:h-[420px] bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden cursor-ew-resize select-none"
    >
      {/* 1. ORIGINAL IMAGE (Left Side / Underlay) */}
      <div className="absolute inset-0 bg-slate-950 flex items-center justify-center">
        <img
          src={originalUrl}
          alt="Original photo"
          className="w-full h-full object-contain pointer-events-none"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* 2. PROCESSED IMAGE (Right Side / Overlay with Clip Path) */}
      <div 
        className="absolute inset-0 flex items-center justify-center overflow-hidden"
        style={backdropStyle}
      >
        <img
          src={processedUrl}
          alt="Processed transparent"
          className="w-full h-full object-contain pointer-events-none"
          style={{
            clipPath: `polygon(${sliderPosition}% 0, 100% 0, 100% 100%, ${sliderPosition}% 100%)`,
          }}
          referrerPolicy="no-referrer"
        />
      </div>

      {/* LABELS */}
      <span className="absolute top-4 left-4 bg-slate-950/80 border border-slate-800 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-slate-300 pointer-events-none shadow">
        Original
      </span>
      <span className="absolute top-4 right-4 bg-blue-950/80 border border-blue-900/40 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-blue-300 pointer-events-none shadow">
        Removed BG
      </span>

      {/* SLIDER HANDLE LINE */}
      <div
        className="absolute top-0 bottom-0 w-[2px] bg-white pointer-events-none"
        style={{ left: `${sliderPosition}%` }}
      >
        {/* Rounded Handle center icon */}
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-9 w-9 rounded-full bg-white border border-slate-300 shadow-2xl flex items-center justify-center text-slate-700 hover:scale-105 active:scale-95 transition-transform">
          <MoveHorizontal className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
