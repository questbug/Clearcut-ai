import React, { useEffect, useRef, useState } from "react";
import { ImageJob } from "../types";
import { 
  X, 
  Paintbrush, 
  Eraser, 
  Undo2, 
  Redo2, 
  RotateCcw, 
  Check, 
  Eye, 
  EyeOff, 
  Sliders, 
  Loader2 
} from "lucide-react";

interface RefineModalProps {
  job: ImageJob | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (refinedBlob: Blob) => void;
}

export default function RefineModal({ job, isOpen, onClose, onSave }: RefineModalProps) {
  if (!job || !isOpen) return null;

  const [tool, setTool] = useState<"brush" | "eraser">("eraser");
  const [brushSize, setBrushSize] = useState<number>(30);
  const [overlayOpacity, setOverlayOpacity] = useState<number>(0.3);
  const [showOriginal, setShowOriginal] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Undo / Redo stacks (stores base64 data URLs of the canvas states)
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const processedImageRef = useRef<HTMLImageElement | null>(null);

  const [imagesLoaded, setImagesLoaded] = useState<boolean>(false);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const lastCoordsRef = useRef<{ x: number; y: number } | null>(null);

  // Initialize and load images
  useEffect(() => {
    if (!job) return;

    setImagesLoaded(false);
    let originalLoaded = false;
    let processedLoaded = false;

    const originalImg = new Image();
    originalImg.crossOrigin = "anonymous";
    originalImg.src = job.originalUrl;
    originalImg.onload = () => {
      originalLoaded = true;
      originalImageRef.current = originalImg;
      if (originalLoaded && processedLoaded) {
        initCanvas();
      }
    };

    const processedImg = new Image();
    processedImg.crossOrigin = "anonymous";
    // If we already have a refined URL, edit that; otherwise edit the processed automated output
    processedImg.src = job.refinedUrl || job.processedUrl || job.originalUrl;
    processedImg.onload = () => {
      processedLoaded = true;
      processedImageRef.current = processedImg;
      if (originalLoaded && processedLoaded) {
        initCanvas();
      }
    };
  }, [job]);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    const procImg = processedImageRef.current;
    if (!canvas || !procImg) return;

    // Set internal canvas dimensions to the image's real size to prevent distortion
    canvas.width = procImg.naturalWidth;
    canvas.height = procImg.naturalHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(procImg, 0, 0);

    // Save initial state to undo stack
    setUndoStack([canvas.toDataURL()]);
    setRedoStack([]);
    setImagesLoaded(true);
  };

  const getCanvasCoords = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX: number;
    let clientY: number;

    if ("touches" in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Map visual client coordinates directly to internal high-res canvas coordinates
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const handleStart = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    e.preventDefault();
    const coords = getCanvasCoords(e);
    if (!coords) return;

    setIsDrawing(true);
    lastCoordsRef.current = coords;
    draw(coords.x, coords.y, coords.x, coords.y);
  };

  const handleMove = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const coords = getCanvasCoords(e);
    if (!coords) {
      setMousePos(null);
      return;
    }

    // Keep track of hover mouse position to draw brush helper circle
    setMousePos(coords);

    if (!isDrawing || !lastCoordsRef.current) return;

    e.preventDefault();
    draw(lastCoordsRef.current.x, lastCoordsRef.current.y, coords.x, coords.y);
    lastCoordsRef.current = coords;
  };

  const handleEnd = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastCoordsRef.current = null;

    // Save canvas state to undo stack
    const canvas = canvasRef.current;
    if (canvas) {
      const stateUrl = canvas.toDataURL();
      setUndoStack((prev) => [...prev, stateUrl]);
      setRedoStack([]); // Clear redo stack on new stroke
    }
  };

  const draw = (startX: number, startY: number, endX: number, endY: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !imagesLoaded) return;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = brushSize;

    if (tool === "eraser") {
      // ERASER MODE: fully clear pixels on path
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    } else {
      // BRUSH MODE (RESTORE): restore original image pixels on stroke path
      const originalImg = originalImageRef.current;
      if (!originalImg) return;

      // 1. Create temporary canvas for the stroke path mask
      const offscreen = document.createElement("canvas");
      offscreen.width = canvas.width;
      offscreen.height = canvas.height;
      const oCtx = offscreen.getContext("2d");
      if (!oCtx) return;

      // Draw the stroke line as white solid
      oCtx.lineCap = "round";
      oCtx.lineJoin = "round";
      oCtx.lineWidth = brushSize;
      oCtx.strokeStyle = "#ffffff";
      oCtx.beginPath();
      oCtx.moveTo(startX, startY);
      oCtx.lineTo(endX, endY);
      oCtx.stroke();

      // 2. Compose with original image to fill the mask with original pixels
      oCtx.globalCompositeOperation = "source-in";
      oCtx.drawImage(originalImg, 0, 0);

      // 3. Render back to main canvas as source-over (layering original pixels back)
      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(offscreen, 0, 0);
    }
  };

  const handleUndo = () => {
    if (undoStack.length <= 1) return; // Need at least initial state

    const newUndo = [...undoStack];
    const currentState = newUndo.pop()!;
    setRedoStack((prev) => [currentState, ...prev]);
    setUndoStack(newUndo);

    const prevStateUrl = newUndo[newUndo.length - 1];
    restoreCanvasFromDataUrl(prevStateUrl);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;

    const newRedo = [...redoStack];
    const nextStateUrl = newRedo.shift()!;
    setUndoStack((prev) => [...prev, nextStateUrl]);
    setRedoStack(newRedo);

    restoreCanvasFromDataUrl(nextStateUrl);
  };

  const restoreCanvasFromDataUrl = (dataUrl: string) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(img, 0, 0);
    };
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to revert all manual refinements for this image?")) {
      initCanvas();
    }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsSaving(true);
    canvas.toBlob((blob) => {
      if (blob) {
        onSave(blob);
      }
      setIsSaving(false);
    }, "image/png");
  };

  // Convert brushSize to visual display size on screen for helper circle
  const getVisualBrushRadius = () => {
    const canvas = canvasRef.current;
    if (!canvas || !mousePos) return 0;
    const rect = canvas.getBoundingClientRect();
    const visualWidthRatio = rect.width / canvas.width;
    return (brushSize / 2) * visualWidthRatio;
  };

  const getVisualMousePos = () => {
    const canvas = canvasRef.current;
    if (!canvas || !mousePos) return null;
    const rect = canvas.getBoundingClientRect();
    const visualX = (mousePos.x / canvas.width) * rect.width;
    const visualY = (mousePos.y / canvas.height) * rect.height;
    return { x: visualX, y: visualY };
  };

  const visualMouse = getVisualMousePos();
  const visualBrushRadius = getVisualBrushRadius();

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-sm animate-fade-in">
      {/* Top Header Row */}
      <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900 px-6 text-white">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-600 p-2 text-white">
            <Paintbrush className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-100">Manual Touchup Canvas</h2>
            <p className="text-xs text-slate-400 max-w-xs truncate">{job.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Undo / Redo */}
          <button
            onClick={handleUndo}
            disabled={undoStack.length <= 1}
            className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent"
            title="Undo stroke"
          >
            <Undo2 className="h-5 w-5" />
          </button>
          <button
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent"
            title="Redo stroke"
          >
            <Redo2 className="h-5 w-5" />
          </button>
          <div className="mx-1 h-6 w-px bg-slate-800" />

          {/* Reset All */}
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
            title="Revert to original automated results"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {/* Save Action */}
          <button
            onClick={handleSave}
            disabled={isSaving || !imagesLoaded}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            <span>Apply Changes</span>
          </button>

          {/* Close Editor */}
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Main Workspace split */}
      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        {/* Left Toolbar Side panel */}
        <aside className="w-full border-b border-slate-800 bg-slate-900/50 p-6 lg:w-80 lg:border-r lg:border-b-0">
          <div className="space-y-6">
            {/* Tool selection */}
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Active Tool
              </span>
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setTool("eraser")}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all ${
                    tool === "eraser"
                      ? "border-rose-500 bg-rose-500/10 text-rose-400 font-medium shadow-md shadow-rose-950/25"
                      : "border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <Eraser className="h-6 w-6" />
                  <span className="text-xs">Erase (Remove)</span>
                </button>

                <button
                  onClick={() => setTool("brush")}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all ${
                    tool === "brush"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 font-medium shadow-md shadow-emerald-950/25"
                      : "border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <Paintbrush className="h-6 w-6" />
                  <span className="text-xs">Restore (Brush)</span>
                </button>
              </div>
            </div>

            {/* Brush Size Adjustment */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
                <span>Brush Size</span>
                <span className="font-mono text-slate-300">{brushSize}px</span>
              </div>
              <input
                type="range"
                min="5"
                max="150"
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-blue-500"
              />
              <div className="mt-2 flex justify-between text-[10px] text-slate-500">
                <span>5px</span>
                <span>75px</span>
                <span>150px</span>
              </div>
            </div>

            {/* Overlay Settings */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-300">Reference Layer</span>
                </div>
                <button
                  onClick={() => setShowOriginal(!showOriginal)}
                  className={`rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 ${
                    showOriginal ? "text-blue-400" : ""
                  }`}
                  title={showOriginal ? "Hide reference image" : "Show reference image"}
                >
                  {showOriginal ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>

              {showOriginal && (
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Reference Opacity</span>
                    <span>{Math.round(overlayOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={overlayOpacity}
                    onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-blue-500"
                  />
                </div>
              )}
            </div>

            {/* Usage Help Note */}
            <div className="rounded-xl bg-slate-900/80 p-4 border border-slate-800 text-xs text-slate-400 leading-relaxed">
              <p className="font-semibold text-slate-300 mb-1">Canvas Instructions:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Use <strong className="text-rose-400">Erase</strong> to rub out stray pixels or shadows the AI missed.</li>
                <li>Use <strong className="text-emerald-400">Restore</strong> to wipe back fine details or solid parts of the object that got clipped.</li>
                <li>Adjust reference opacity to align perfectly with the original photo.</li>
              </ul>
            </div>
          </div>
        </aside>

        {/* Central Canvas Container with custom alpha grid */}
        <main className="relative flex flex-1 items-center justify-center p-6 overflow-hidden bg-slate-950">
          {!imagesLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-400 bg-slate-950/80">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <p className="text-sm">Pre-loading high-resolution canvases...</p>
            </div>
          )}

          {/* Interactive Canvas Stage */}
          <div 
            className="relative select-none max-w-full max-h-[75vh] flex items-center justify-center border border-slate-800/80 rounded-xl overflow-hidden shadow-2xl"
            style={{
              backgroundImage: "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\"><rect width=\"12\" height=\"12\" fill=\"%231e293b\"/><rect x=\"12\" y=\"12\" width=\"12\" height=\"12\" fill=\"%231e293b\"/><rect x=\"12\" width=\"12\" height=\"12\" fill=\"%230f172a\"/><rect y=\"12\" width=\"12\" height=\"12\" fill=\"%230f172a\"/></svg>')",
              backgroundSize: "24px 24px",
            }}
          >
            {/* UNDERLAY: Original reference image with custom opacity */}
            {showOriginal && originalImageRef.current && (
              <img
                src={job.originalUrl}
                alt="Original Reference"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none transition-opacity duration-150"
                style={{ opacity: overlayOpacity }}
              />
            )}

            {/* MAIN CANVAS: Processed image overlay with modifications */}
            <canvas
              ref={canvasRef}
              onMouseDown={handleStart}
              onMouseMove={handleMove}
              onMouseUp={handleEnd}
              onMouseLeave={handleEnd}
              onTouchStart={handleStart}
              onTouchMove={handleMove}
              onTouchEnd={handleEnd}
              className={`relative max-w-full max-h-[75vh] object-contain block cursor-none transition-all ${
                isDrawing ? "scale-[1.002]" : ""
              }`}
            />

            {/* DYNAMIC BRUSH CURSOR OVERLAY */}
            {visualMouse && visualBrushRadius > 0 && (
              <div
                className={`absolute pointer-events-none rounded-full border border-dashed flex items-center justify-center ${
                  tool === "eraser" 
                    ? "border-rose-400 bg-rose-500/10" 
                    : "border-emerald-400 bg-emerald-500/10"
                }`}
                style={{
                  left: visualMouse.x - visualBrushRadius,
                  top: visualMouse.y - visualBrushRadius,
                  width: visualBrushRadius * 2,
                  height: visualBrushRadius * 2,
                }}
              >
                {/* Visual tiny center dot */}
                <div className={`h-1 w-1 rounded-full ${tool === "eraser" ? "bg-rose-500" : "bg-emerald-500"}`} />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
